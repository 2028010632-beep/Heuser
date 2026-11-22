const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const scoreVal = document.getElementById('scoreVal');
const livesVal = document.getElementById('livesVal');
const highScoreVal = document.getElementById('highScoreVal');
const finalScore = document.getElementById('finalScore');

const menuOverlay = document.getElementById('menuOverlay');
const pauseOverlay = document.getElementById('pauseOverlay');
const gameOverOverlay = document.getElementById('gameOverOverlay');

const startBtn = document.getElementById('startBtn');
const resumeBtn = document.getElementById('resumeBtn');
const restartBtn = document.getElementById('restartBtn');
const pauseBtn = document.getElementById('pauseBtn');
const muteBtn = document.getElementById('muteBtn');
const resetDataBtn = document.getElementById('resetDataBtn');

let score = 0;
let lives = 3;
let highScore = localStorage.getItem('catchHighScore') || 0;
highScoreVal.textContent = highScore;

let gameState = 'MENU'; // MENU, PLAYING, PAUSED, GAMEOVER
let isMuted = false;

// Audio Context helper using Web Audio API
let audioCtx = null;
function playSound(type) {
    if (isMuted) return;
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'catch') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'bomb') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(40, audioCtx.currentTime + 0.2);
        gain.gain.setValueAtTime(0.4, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    }
}

// Player Basket
const basket = {
    x: canvas.width / 2 - 50,
    y: canvas.height - 45,
    width: 100,
    height: 20,
    speed: 8,
    dx: 0
};

// Falling Items
let items = [];
function spawnItem() {
    if (gameState !== 'PLAYING') return;
    const isBomb = Math.random() < 0.25; // 25% chance of bomb
    items.push({
        x: Math.random() * (canvas.width - 30),
        y: -30,
        size: 25,
        speed: 3 + Math.random() * 3,
        type: isBomb ? 'bomb' : 'star'
    });
}
setInterval(spawnItem, 800);

// Keyboard controls
const keys = {};
window.addEventListener('keydown', (e) => {
    keys[e.key] = true;
    if (e.key === 'Escape') togglePause();
});
window.addEventListener('keyup', (e) => {
    keys[e.key] = false;
});

function update() {
    if (gameState !== 'PLAYING') return;

    // Movement
    if (keys['ArrowLeft'] || keys['a']) {
        basket.x -= basket.speed;
    }
    if (keys['ArrowRight'] || keys['d']) {
        basket.x += basket.speed;
    }

    // Clamp inside canvas
    if (basket.x < 0) basket.x = 0;
    if (basket.x + basket.width > canvas.width) {
        basket.x = canvas.width - basket.width;
    }

    // Update items
    for (let i = items.length - 1; i >= 0; i--) {
        let item = items[i];
        item.y += item.speed;

        // Collision detection with basket
        if (
            item.y + item.size >= basket.y &&
            item.x + item.size >= basket.x &&
            item.x <= basket.x + basket.width &&
            item.y <= basket.y + basket.height
        ) {
            if (item.type === 'star') {
                score++;
                playSound('catch');
                if (score > highScore) {
                    highScore = score;
                    localStorage.setItem('catchHighScore', highScore);
                    highScoreVal.textContent = highScore;
                }
            } else {
                lives--;
                playSound('bomb');
                if (lives <= 0) {
                    endGame();
                }
            }
            items.splice(i, 1);
            continue;
        }

        // Remove if out of bounds
        if (item.y > canvas.height) {
            items.splice(i, 1);
        }
    }

    scoreVal.textContent = score;
    livesVal.textContent = lives;
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Basket
    ctx.fillStyle = '#38bdf8';
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#38bdf8';
    ctx.fillRect(basket.x, basket.y, basket.width, basket.height);
    ctx.shadowBlur = 0; // reset shadow

    // Draw Items
    items.forEach(item => {
        if (item.type === 'star') {
            ctx.fillStyle = '#facc15';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#facc15';
            ctx.beginPath();
            ctx.arc(item.x + item.size/2, item.y + item.size/2, item.size/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            ctx.fillStyle = '#f43f5e';
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#f43f5e';
            ctx.beginPath();
            ctx.arc(item.x + item.size/2, item.y + item.size/2, item.size/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    });
}

function gameLoop() {
    update();
    draw();
    requestAnimationFrame(gameLoop);
}

function startGame() {
    score = 0;
    lives = 3;
    items = [];
    scoreVal.textContent = score;
    livesVal.textContent = lives;
    gameState = 'PLAYING';
    menuOverlay.classList.add('hidden');
    gameOverOverlay.classList.add('hidden');
    pauseOverlay.classList.add('hidden');
}

function endGame() {
    gameState = 'GAMEOVER';
    finalScore.textContent = score;
    gameOverOverlay.classList.remove('hidden');
}

function togglePause() {
    if (gameState === 'PLAYING') {
        gameState = 'PAUSED';
        pauseOverlay.classList.remove('hidden');
        pauseBtn.textContent = 'Resume';
    } else if (gameState === 'PAUSED') {
        gameState = 'PLAYING';
        pauseOverlay.classList.add('hidden');
        pauseBtn.textContent = 'Pause';
    }
}

// Event Listeners for UI buttons
startBtn.addEventListener('click', startGame);
restartBtn.addEventListener('click', startGame);
resumeBtn.addEventListener('click', togglePause);
pauseBtn.addEventListener('click', togglePause);

muteBtn.addEventListener('click', () => {
    isMuted = !isMuted;
    muteBtn.textContent = isMuted ? 'Mute: ON' : 'Mute: OFF';
});

resetDataBtn.addEventListener('click', () => {
    localStorage.removeItem('catchHighScore');
    highScore = 0;
    highScoreVal.textContent = 0;
    alert('High score cleared!');
});

// Initialize loop
requestAnimationFrame(gameLoop);