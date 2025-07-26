function startGame() {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");

  let dino = {
    x: 50,
    y: 150,
    width: 44,
    height: 47,
    vy: 0,
    jump: -10,
    gravity: 0.5,
    onGround: true
  };

  let obstacles = [];
  const obstacleTypes = [
    { src: "assets/obstacle.png", width: 20, height: 27 },
    { src: "assets/obstacle-2.png", width: 37, height: 15 },
    { src: "assets/obstacle-3.png", width: 35, height: 35 }
  ];

  let goal = { x: 3000, y: 150, width: 40, height: 40 };
  let showGoal = false;
  let goalReached = false;

  let gameOver = false;
  let gameWon = false;
  let startTime = null;
  const totalGameTime = 105000;

  const dinoImg = new Image();
  dinoImg.src = "assets/dino.png";
  const obstacleImgs = obstacleTypes.map(obj => {
    const img = new Image();
    img.src = obj.src;
    return img;
  });
  const goalImg = new Image();
  goalImg.src = "assets/goal.png";

  const jumpSound = new Audio("sounds/jump.mp3");
  const winSound = new Audio("sounds/win.mp3");
  const deathSound = new Audio("sounds/death.mp3");
  const bgm = new Audio("sounds/bgm.mp3");
  bgm.loop = true;

  let isBlackingOut = false;
  let nextBlackoutTime = 0;
  let blackoutDuration = 0;

  let spawnObstacleInterval = null;
  let lastDoubleSpawn = false;

  function scheduleNextBlackout(currentTime) {
    const nextIn = 5000 + Math.random() * 5000;
    blackoutDuration = 300 + Math.random() * 200;
    nextBlackoutTime = currentTime + nextIn;
  }

  function spawnObstacle() {
    const idx = Math.floor(Math.random() * obstacleTypes.length);
    const type = obstacleTypes[idx];
    const baseX = canvas.width + Math.random() * 200;
    const baseY = 197 - type.height;

    const obstacleObj = {
      x: baseX,
      y: baseY,
      baseY: baseY,
      width: type.width,
      height: type.height,
      typeIndex: idx,
      img: obstacleImgs[idx],
      floatPhase: Math.random() * Math.PI * 2
    };

    obstacles.push(obstacleObj);

    const shouldDouble = Math.random() < 0.1 && !lastDoubleSpawn;
    if (shouldDouble) {
      const secondX = baseX + 50 + Math.random() * 30;
      obstacles.push({
        x: secondX,
        y: baseY,
        baseY: baseY,
        width: type.width,
        height: type.height,
        typeIndex: idx,
        img: obstacleImgs[idx],
        floatPhase: Math.random() * Math.PI * 2
      });
      lastDoubleSpawn = true;
    } else {
      lastDoubleSpawn = false;
    }
  }

  function startSpawningObstacles() {
    if (spawnObstacleInterval) clearInterval(spawnObstacleInterval);
    spawnObstacle();
    spawnObstacleInterval = setInterval(() => {
      if (gameOver) {
        clearInterval(spawnObstacleInterval);
        return;
      }

      if (showGoal && Math.random() < 0.3) return;

      spawnObstacle();
    }, 800 + Math.random() * 500);
  }

  function resetGame() {
    dino.y = 150;
    dino.vy = 0;
    dino.onGround = true;
    goal.x = 3000;
    showGoal = false;
    goalReached = false;
    obstacles = [];
    gameOver = false;
    gameWon = false;
    startTime = null;
    isBlackingOut = false;
    scheduleNextBlackout(0);
    bgm.currentTime = 0;
    bgm.play();
    startSpawningObstacles();
    requestAnimationFrame(gameLoop);
  }

  function drawTimer(timestamp) {
    const elapsed = timestamp - startTime;
    const remaining = Math.max(0, totalGameTime - elapsed);
    const displayRemaining = Math.max(0, totalGameTime - elapsed - 10000);
    const seconds = Math.floor(displayRemaining / 1000);
    const millis = Math.floor((displayRemaining % 1000) / 10);

    ctx.fillStyle = "black";
    ctx.font = "20px Arial";
    ctx.fillText(`Time Left: ${seconds}.${millis.toString().padStart(2, '0')}`, 10, 30);

    if (remaining <= 0 && !gameOver) {
      gameOver = true;
      bgm.pause();
      alert("Time's up! Press Space or Tap to restart.");
    }

    if (remaining <= 15000 && !showGoal) {
      showGoal = true;
      for (let i = 0; i < 3; i++) spawnObstacle();
    }
  }

  function draw(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (isBlackingOut) {
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      return;
    }

    ctx.drawImage(dinoImg, dino.x, dino.y, dino.width, dino.height);
    for (const obs of obstacles) {
      const floatOffset = Math.sin(timestamp / 100 + obs.floatPhase) * 2;
      ctx.drawImage(obs.img, obs.x, obs.baseY + floatOffset, obs.width, obs.height);
    }

    if (showGoal) ctx.drawImage(goalImg, goal.x, goal.y, goal.width, goal.height);
    drawTimer(timestamp);
  }

  function update(timestamp) {
    const elapsed = timestamp - startTime;
    const progressRatio = Math.min(1, elapsed / totalGameTime);
    const obstacleSpeed = 5 + progressRatio * 5;

    if (timestamp >= nextBlackoutTime && !isBlackingOut) {
      isBlackingOut = true;
      setTimeout(() => {
        isBlackingOut = false;
        scheduleNextBlackout(timestamp);
      }, blackoutDuration);
    }

    dino.vy += dino.gravity;
    dino.y += dino.vy;
    if (dino.y >= 150) {
      dino.y = 150;
      dino.vy = 0;
      dino.onGround = true;
    }

    for (const obs of obstacles) {
      obs.x -= obstacleSpeed;
    }

    if (showGoal) goal.x -= obstacleSpeed;

    for (const obs of obstacles) {
      const floatOffset = Math.sin(timestamp / 100 + obs.floatPhase) * 2;
      const obsY = obs.baseY + floatOffset;
      if (
        dino.x + dino.width > obs.x &&
        dino.x < obs.x + obs.width &&
        dino.y + dino.height > obsY
      ) {
        gameOver = true;
        bgm.pause();
        deathSound.play();
        alert("Game Over! Press Space or Tap to restart.");
        return;
      }
    }

    if (!goalReached && showGoal && dino.x + dino.width > goal.x) {
      gameOver = true;
      gameWon = true;
      goalReached = true;
      bgm.pause();
      winSound.play();
      alert("You Win! Press Space or Tap to restart.");
    }
  }

  function gameLoop(timestamp) {
    if (startTime === null) {
      startTime = timestamp;
      scheduleNextBlackout(timestamp);
    }

    if (!gameOver) {
      update(timestamp);
      draw(timestamp);
      requestAnimationFrame(gameLoop);
    }
  }

  function handleJumpOrRestart() {
    if (dino.onGround && !gameOver) {
      dino.vy = dino.jump;
      dino.onGround = false;
      jumpSound.currentTime = 0;
      jumpSound.play();
    } else if (gameOver) {
      resetGame();
    }
  }

  document.addEventListener("keydown", e => {
    if (e.key === " " || e.key === "ArrowUp") handleJumpOrRestart();
  });

  canvas.addEventListener("touchstart", e => {
    e.preventDefault();
    handleJumpOrRestart();
  });

  resetGame();
}

// 綁定按鈕觸發 startGame
document.getElementById("startButton").addEventListener("click", startGame);
