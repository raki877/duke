const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Set canvas size
canvas.width = 800;
canvas.height = 600;

// Game state
let gameRunning = false;
let distance = 0;
let coins = 0;
let fuel = 100;

// Camera
let cameraX = 0;

// Terrain
const terrainSegments = [];
const segmentWidth = 50;
let terrainLength = 0;

// Coins array
const coinPositions = [];

// Car properties
const car = {
    x: 150,
    y: 300,
    width: 80,
    height: 35,
    wheelRadius: 15,
    angle: 0,
    velocityX: 0,
    velocityY: 0,
    angularVelocity: 0,
    onGround: false
};

// Physics constants
const GRAVITY = 0.4;
const ACCELERATION = 0.15;
const BRAKE_POWER = 0.2;
const MAX_SPEED = 12;
const FRICTION = 0.99;
const ANGULAR_FRICTION = 0.95;

// Controls
let gasPressed = false;
let brakePressed = false;

// Generate terrain
function generateTerrain(startX, count) {
    for (let i = 0; i < count; i++) {
        const x = startX + i * segmentWidth;
        const baseHeight = 400;
        
        // Create hills using sine waves
        const hill1 = Math.sin(x * 0.008) * 80;
        const hill2 = Math.sin(x * 0.015) * 40;
        const hill3 = Math.sin(x * 0.003) * 100;
        
        const y = baseHeight + hill1 + hill2 + hill3;
        
        terrainSegments.push({ x, y });
        
        // Add coins randomly
        if (Math.random() < 0.1 && x > 300) {
            coinPositions.push({
                x: x,
                y: y - 50,
                collected: false
            });
        }
    }
    terrainLength = startX + count * segmentWidth;
}

// Get terrain height at x position
function getTerrainHeight(x) {
    for (let i = 0; i < terrainSegments.length - 1; i++) {
        const seg1 = terrainSegments[i];
        const seg2 = terrainSegments[i + 1];
        
        if (x >= seg1.x && x < seg2.x) {
            const t = (x - seg1.x) / (seg2.x - seg1.x);
            return seg1.y + (seg2.y - seg1.y) * t;
        }
    }
    return 400;
}

// Get terrain angle at x position
function getTerrainAngle(x) {
    const h1 = getTerrainHeight(x - 10);
    const h2 = getTerrainHeight(x + 10);
    return Math.atan2(h2 - h1, 20);
}

// Update car physics
function updateCar() {
    if (!gameRunning) return;
    
    // Apply gravity
    car.velocityY += GRAVITY;
    
    // Get wheel positions
    const frontWheelX = car.x + Math.cos(car.angle) * 25;
    const rearWheelX = car.x - Math.cos(car.angle) * 25;
    
    const frontTerrainY = getTerrainHeight(frontWheelX);
    const rearTerrainY = getTerrainHeight(rearWheelX);
    
    const frontWheelY = car.y + Math.sin(car.angle) * 25;
    const rearWheelY = car.y - Math.sin(car.angle) * 25;
    
    // Check ground collision
    car.onGround = false;
    
    const carBottomY = car.y + car.wheelRadius;
    const terrainY = getTerrainHeight(car.x);
    
    if (carBottomY >= terrainY) {
        car.y = terrainY - car.wheelRadius;
        car.velocityY = 0;
        car.onGround = true;
        
        // Align car to terrain
        const targetAngle = getTerrainAngle(car.x);
        car.angularVelocity += (targetAngle - car.angle) * 0.1;
    }
    
    // Apply controls
    if (car.onGround) {
        if (gasPressed && fuel > 0) {
            car.velocityX += Math.cos(car.angle) * ACCELERATION;
            fuel -= 0.1;
        }
        if (brakePressed) {
            car.velocityX -= Math.cos(car.angle) * BRAKE_POWER;
        }
    }
    
    // Limit speed
    car.velocityX = Math.max(-MAX_SPEED / 2, Math.min(MAX_SPEED, car.velocityX));
    
    // Apply friction
    car.velocityX *= FRICTION;
    car.angularVelocity *= ANGULAR_FRICTION;
    
    // Update position
    car.x += car.velocityX;
    car.y += car.velocityY;
    car.angle += car.angularVelocity;
    
    // Prevent going backwards too far
    if (car.x < 50) {
        car.x = 50;
        car.velocityX = 0;
    }
    
    // Update distance
    distance = Math.max(distance, Math.floor((car.x - 150) / 10));
    
    // Check if car flipped
    if (Math.abs(car.angle) > Math.PI / 2) {
        endGame();
    }
    
    // Check fuel
    if (fuel <= 0) {
        fuel = 0;
        endGame();
    }
    
    // Generate more terrain
    if (car.x > terrainLength - 1000) {
        generateTerrain(terrainLength, 50);
    }
    
    // Check coin collection
    coinPositions.forEach(coin => {
        if (!coin.collected) {
            const dx = car.x - coin.x;
            const dy = car.y - coin.y;
            if (Math.sqrt(dx * dx + dy * dy) < 40) {
                coin.collected = true;
                coins++;
                fuel = Math.min(100, fuel + 10);
            }
        }
    });
}

// Draw functions
function drawSky() {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(1, '#E0F6FF');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw clouds
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    for (let i = 0; i < 5; i++) {
        const cloudX = ((i * 300 - cameraX * 0.3) % (canvas.width + 200)) - 100;
        ctx.beginPath();
        ctx.arc(cloudX, 80 + i * 20, 30, 0, Math.PI * 2);
        ctx.arc(cloudX + 25, 70 + i * 20, 25, 0, Math.PI * 2);
        ctx.arc(cloudX + 50, 80 + i * 20, 30, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawTerrain() {
    ctx.beginPath();
    ctx.moveTo(0, canvas.height);
    
    for (const seg of terrainSegments) {
        const screenX = seg.x - cameraX;
        if (screenX > -100 && screenX < canvas.width + 100) {
            ctx.lineTo(screenX, seg.y);
        }
    }
    
    ctx.lineTo(canvas.width, canvas.height);
    ctx.closePath();
    
    // Ground gradient
    const gradient = ctx.createLinearGradient(0, 300, 0, canvas.height);
    gradient.addColorStop(0, '#4a7c23');
    gradient.addColorStop(0.3, '#3d6b1e');
    gradient.addColorStop(1, '#2d4a15');
    ctx.fillStyle = gradient;
    ctx.fill();
    
    // Ground border
    ctx.strokeStyle = '#2d4a15';
    ctx.lineWidth = 3;
    ctx.stroke();
}

function drawCoins() {
    coinPositions.forEach(coin => {
        if (coin.collected) return;
        
        const screenX = coin.x - cameraX;
        if (screenX > -50 && screenX < canvas.width + 50) {
            // Coin glow
            ctx.beginPath();
            ctx.arc(screenX, coin.y, 20, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.fill();
            
            // Coin
            ctx.beginPath();
            ctx.arc(screenX, coin.y, 15, 0, Math.PI * 2);
            ctx.fillStyle = '#FFD700';
            ctx.fill();
            ctx.strokeStyle = '#FFA500';
            ctx.lineWidth = 2;
            ctx.stroke();
            
            // $ symbol
            ctx.fillStyle = '#FFA500';
            ctx.font = 'bold 16px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', screenX, coin.y);
        }
    });
}

function drawCar() {
    const screenX = car.x - cameraX;
    
    ctx.save();
    ctx.translate(screenX, car.y);
    ctx.rotate(car.angle);
    
    // Car shadow
    ctx.fillStyle = 'rgba(0, 0, 0, 0.2)';
    ctx.beginPath();
    ctx.ellipse(5, 20, 40, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Car body
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath();
    ctx.roundRect(-40, -25, 80, 30, 5);
    ctx.fill();
    
    // Car top
    ctx.fillStyle = '#c0392b';
    ctx.beginPath();
    ctx.roundRect(-20, -45, 45, 22, 5);
    ctx.fill();
    
    // Windows
    ctx.fillStyle = '#85c1e9';
    ctx.beginPath();
    ctx.roundRect(-15, -42, 35, 16, 3);
    ctx.fill();
    
    // Front wheel
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(25, 5, car.wheelRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7f8c8d';
    ctx.beginPath();
    ctx.arc(25, 5, 8, 0, Math.PI * 2);
    ctx.fill();
    
    // Rear wheel
    ctx.fillStyle = '#2c3e50';
    ctx.beginPath();
    ctx.arc(-25, 5, car.wheelRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#7f8c8d';
    ctx.beginPath();
    ctx.arc(-25, 5, 8, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
}

function updateCamera() {
    const targetX = car.x - canvas.width / 3;
    cameraX += (targetX - cameraX) * 0.1;
}

function updateUI() {
    document.getElementById('distance').textContent = `Distance: ${distance}m`;
    document.getElementById('coins').textContent = `Coins: ${coins}`;
    document.getElementById('fuelBar').style.width = `${fuel}%`;
}

function gameLoop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    drawSky();
    updateCar();
    updateCamera();
    drawTerrain();
    drawCoins();
    drawCar();
    updateUI();
    
    if (gameRunning) {
        requestAnimationFrame(gameLoop);
    }
}

function startGame() {
    // Reset game state
    car.x = 150;
    car.y = 300;
    car.velocityX = 0;
    car.velocityY = 0;
    car.angle = 0;
    car.angularVelocity = 0;
    
    distance = 0;
    coins = 0;
    fuel = 100;
    cameraX = 0;
    
    terrainSegments.length = 0;
    coinPositions.length = 0;
    terrainLength = 0;
    
    generateTerrain(0, 100);
    
    document.getElementById('startScreen').classList.add('hidden');
    document.getElementById('gameOver').classList.add('hidden');
    
    gameRunning = true;
    gameLoop();
}

function endGame() {
    gameRunning = false;
    document.getElementById('finalDistance').textContent = distance;
    document.getElementById('finalCoins').textContent = coins;
    document.getElementById('gameOver').classList.remove('hidden');
}

// Event listeners
document.getElementById('startBtn').addEventListener('click', startGame);
document.getElementById('restartBtn').addEventListener('click', startGame);

// Keyboard controls
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'd') gasPressed = true;
    if (e.key === 'ArrowLeft' || e.key === 'a') brakePressed = true;
});

document.addEventListener('keyup', (e) => {
    if (e.key === 'ArrowRight' || e.key === 'd') gasPressed = false;
    if (e.key === 'ArrowLeft' || e.key === 'a') brakePressed = false;
});

// Touch controls
const gasBtn = document.getElementById('gasBtn');
const brakeBtn = document.getElementById('brakeBtn');

gasBtn.addEventListener('mousedown', () => gasPressed = true);
gasBtn.addEventListener('mouseup', () => gasPressed = false);
gasBtn.addEventListener('mouseleave', () => gasPressed = false);
gasBtn.addEventListener('touchstart', (e) => { e.preventDefault(); gasPressed = true; });
gasBtn.addEventListener('touchend', () => gasPressed = false);

brakeBtn.addEventListener('mousedown', () => brakePressed = true);
brakeBtn.addEventListener('mouseup', () => brakePressed = false);
brakeBtn.addEventListener('mouseleave', () => brakePressed = false);
brakeBtn.addEventListener('touchstart', (e) => { e.preventDefault(); brakePressed = true; });
brakeBtn.addEventListener('touchend', () => brakePressed = false);
