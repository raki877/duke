const car = document.getElementById('car');
const game = document.getElementById('game');
let carX = 175;
let score = 0;

// Move car with arrow keys
document.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' && carX > 10) carX -= 20;
    if (e.key === 'ArrowRight' && carX < 350) carX += 20;
    car.style.left = carX + 'px';
});

// Create enemy cars
function createEnemy() {
    const enemy = document.createElement('div');
    enemy.classList.add('enemy');
    enemy.innerHTML = '🚙';
    enemy.style.left = Math.random() * 350 + 'px';
    enemy.style.top = '0px';
    game.appendChild(enemy);
    
    let enemyY = 0;
    const fall = setInterval(() => {
        enemyY += 5;
        enemy.style.top = enemyY + 'px';
        
        // Collision detection
        if (enemyY > 520 && enemyY < 580 && 
            Math.abs(parseInt(enemy.style.left) - carX) < 40) {
            alert('Game Over! Score: ' + score);
            location.reload();
        }
        
        // Remove enemy & add score
        if (enemyY > 600) {
            enemy.remove();
            score++;
            document.getElementById('score').textContent = 'Score: ' + score;
        }
    }, 30);
}

setInterval(createEnemy, 1500);
