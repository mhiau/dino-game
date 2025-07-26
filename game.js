function startGame() {
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

let dino = { x: 50, y: 150, width: 44, height: 47, vy: 0, jump: -10, gravity: 0.5, onGround: true };
let obstacle = { x: 800, y: 160, width: 20, height: 40 };
let goal = { x: 1400, y: 150, width: 40, height: 40 };
let gameOver = false;

const dinoImg = new Image();
dinoImg.src = "assets/dino.png";
const obsImg = new Image();
obsImg.src = "assets/obstacle.png";
const goalImg = new Image();
goalImg.src = "assets/goal.png";

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(dinoImg, dino.x, dino.y, dino.width, dino.height);
  ctx.drawImage(obsImg, obstacle.x, obstacle.y, obstacle.width, obstacle.height);
  ctx.drawImage(goalImg, goal.x, goal.y, goal.width, goal.height);
}

function update() {
  dino.vy += dino.gravity;
  dino.y += dino.vy;
  if (dino.y >= 150) {
    dino.y = 150;
    dino.vy = 0;
    dino.onGround = true;
  }

  obstacle.x -= 5;
  goal.x -= 5;

  // collision
  if (dino.x + dino.width > obstacle.x && dino.x < obstacle.x + obstacle.width &&
      dino.y + dino.height > obstacle.y) {
    gameOver = true;
    alert("Game Over!");
  }

  if (dino.x + dino.width > goal.x) {
    gameOver = true;
    alert("You Win!");
  }
}

function gameLoop() {
  if (!gameOver) {
    update();
    draw();
    requestAnimationFrame(gameLoop);
  }
}

document.addEventListener("keydown", e => {
  if ((e.key === " " || e.key === "ArrowUp") && dino.onGround) {
    dino.vy = dino.jump;
    dino.onGround = false;
  }
});

gameLoop();

}