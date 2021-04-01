function GameManager() {
  var gridCanvas = document.getElementById("grid-canvas");
  var nextCanvas = document.getElementById("next-canvas");
  var scoreContainer = document.getElementById("score-container");
  var resetButton = document.getElementById("reset-button");
  var aiButton = document.getElementById("ai-button");
  var gridContext = gridCanvas.getContext("2d");
  var nextContext = nextCanvas.getContext("2d");
  document.addEventListener("keydown", onKeyDown);

  var grid = new Grid(32, 15);
  var rpg = new RandomPieceGenerator();
  var ai = new AI(0.510066, 0.760666, 0.35663, 0.184483);
  var workingPieces = [null, rpg.nextPiece()];
  var workingPiece = null;
  var isAiActive = true;
  var isKeyEnabled = false;
  var gravityTimer = new Timer(onGravityTimerTick, 500);
  var score = 0;

  function intToRGBHexString(v) {
    return (
      "rgb(" +
      ((v >> 16) & 0xff) +
      "," +
      ((v >> 8) & 0xff) +
      "," +
      (v & 0xff) +
      ")"
    );
  }

  function redrawGridCanvas(workingPieceVerticalOffset = 0) {
    gridContext.save();

    gridContext.clearRect(0, 0, gridCanvas.width, gridCanvas.height);

    // 繪製格線
    for (var r = 2; r < grid.rows; r++) {
      for (var c = 0; c < grid.columns; c++) {
        if (grid.cells[r][c] != 0) {
          gridContext.fillStyle = intToRGBHexString(grid.cells[r][c]);
          gridContext.fillRect(20 * c, 20 * (r - 2), 20, 20);
          gridContext.strokeStyle = "#FFFFFF";
          gridContext.strokeRect(20 * c, 20 * (r - 2), 20, 20);
        }
      }
    }

    // 繪製畫布方塊
    for (var r = 0; r < workingPiece.dimension; r++) {
      for (var c = 0; c < workingPiece.dimension; c++) {
        if (workingPiece.cells[r][c] != 0) {
          gridContext.fillStyle = intToRGBHexString(workingPiece.cells[r][c]);
          gridContext.fillRect(
            20 * (c + workingPiece.column),
            20 * (r + workingPiece.row - 2) + workingPieceVerticalOffset,
            20,
            20
          );
          gridContext.strokeStyle = "#FFFFFF";
          gridContext.strokeRect(
            20 * (c + workingPiece.column),
            20 * (r + workingPiece.row - 2) + workingPieceVerticalOffset,
            20,
            20
          );
        }
      }
    }

    gridContext.restore();
  }

  function redrawNextCanvas() {
    nextContext.save();

    nextContext.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    var next = workingPieces[1];
    var xOffset =
      next.dimension == 2
        ? 20
        : next.dimension == 3
        ? 10
        : next.dimension == 4
        ? 0
        : null;
    var yOffset =
      next.dimension == 2
        ? 20
        : next.dimension == 3
        ? 20
        : next.dimension == 4
        ? 10
        : null;
    for (var r = 0; r < next.dimension; r++) {
      for (var c = 0; c < next.dimension; c++) {
        if (next.cells[r][c] != 0) {
          nextContext.fillStyle = intToRGBHexString(next.cells[r][c]);
          nextContext.fillRect(xOffset + 20 * c, yOffset + 20 * r, 20, 20);
          nextContext.strokeStyle = "#FFFFFF";
          nextContext.strokeRect(xOffset + 20 * c, yOffset + 20 * r, 20, 20);
        }
      }
    }

    nextContext.restore();
  }

  function updateScoreContainer() {
    scoreContainer.innerHTML = score.toString();
  }

  var workingPieceDropAnimationStopwatch = null;

  function startWorkingPieceDropAnimation(callback = function () {}) {
    // 計算動畫高度
    animationHeight = 0;
    _workingPiece = workingPiece.clone();
    while (_workingPiece.moveDown(grid)) {
      animationHeight++;
    }

    var stopwatch = new Stopwatch(function (elapsed) {
      if (elapsed >= animationHeight * 20) {
        stopwatch.stop();
        redrawGridCanvas(20 * animationHeight);
        callback();
        return;
      }

      redrawGridCanvas((20 * elapsed) / 20);
    });

    workingPieceDropAnimationStopwatch = stopwatch;
  }

  function cancelWorkingPieceDropAnimation() {
    if (workingPieceDropAnimationStopwatch === null) {
      return;
    }
    workingPieceDropAnimationStopwatch.stop();
    workingPieceDropAnimationStopwatch = null;
  }

  // 開始循環
  function startTurn() {
    // 整理運行方塊
    for (var i = 0; i < workingPieces.length - 1; i++) {
      workingPieces[i] = workingPieces[i + 1];
    }
    workingPieces[workingPieces.length - 1] = rpg.nextPiece();
    workingPiece = workingPieces[0];

    redrawGridCanvas();
    redrawNextCanvas();

    if (isAiActive) {
      isKeyEnabled = false;
      // 用佈局跟方塊算出最佳位置
      workingPiece = ai.best(grid, workingPieces);
      startWorkingPieceDropAnimation(function () {
        while (workingPiece.moveDown(grid));
        if (!endTurn()) {
          alert("遊戲結束");
          return;
        }
        startTurn();
      });
    } else {
      isKeyEnabled = true;
      gravityTimer.resetForward(500);
    }
  }

  // 處理循環尾端
  function endTurn() {
    // 加入方塊
    grid.addPiece(workingPiece);

    score += grid.clearLines();

    redrawGridCanvas();
    updateScoreContainer();

    return !grid.exceeded();
  }

  // Process gravity tick
  function onGravityTimerTick() {
    // 畫布上的方塊還未到底部
    if (workingPiece.canMoveDown(grid)) {
      workingPiece.moveDown(grid);
      redrawGridCanvas();
      return;
    }

    // 暫停重力
    gravityTimer.stop();

    // 如果方塊已經到底部並且超出了畫布
    if (!endTurn()) {
      isKeyEnabled = false;
      alert("遊戲結束");
      return;
    }

    // 繼續遊戲
    startTurn();
  }

  function onKeyDown(event) {
    if (!isKeyEnabled) {
      return;
    }

    switch (event.which) {
      case 32: // 空白鍵 -> 快速到底
        isKeyEnabled = false;
        gravityTimer.stop();
        startWorkingPieceDropAnimation(function () {
          while (workingPiece.moveDown(grid));
          if (!endTurn()) {
            alert("遊戲結束");
            return;
          }
          startTurn();
        });
        break;
      case 40: // 方向鍵下
        gravityTimer.resetForward(500);
        break;
      case 37: // 方向鍵左
        if (workingPiece.canMoveLeft(grid)) {
          workingPiece.moveLeft(grid);
          redrawGridCanvas();
        }
        break;
      case 39: // 方向鍵右
        if (workingPiece.canMoveRight(grid)) {
          workingPiece.moveRight(grid);
          redrawGridCanvas();
        }
        break;
      case 38: // 方向鍵上 -> 旋轉方塊
        workingPiece.rotate(grid);
        redrawGridCanvas();
        break;
    }
  }

  aiButton.onclick = function () {
    if (isAiActive) {
      isAiActive = false;
      aiButton.style.backgroundColor = "#f9f9f9";
    } else {
      isAiActive = true;
      aiButton.style.backgroundColor = "#e9e9ff";

      isKeyEnabled = false;
      gravityTimer.stop();
      startWorkingPieceDropAnimation(function () {
        while (workingPiece.moveDown(grid));
        if (!endTurn()) {
          alert("遊戲結束");
          return;
        }
        startTurn();
      });
    }
  };

  resetButton.onclick = function () {
    gravityTimer.stop();
    cancelWorkingPieceDropAnimation();
    grid = new Grid(32, 15);
    rpg = new RandomPieceGenerator();
    workingPieces = [null, rpg.nextPiece()];
    workingPiece = null;
    score = 0;
    isKeyEnabled = true;
    updateScoreContainer();
    startTurn();
  };

  aiButton.style.backgroundColor = "#e9e9ff";
  startTurn();
}
