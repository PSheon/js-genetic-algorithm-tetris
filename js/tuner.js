function Tuner() {
  function randomInteger(min, max) {
    return Math.floor(Math.random() * (max - min) + min);
  }

  function normalize(candidate) {
    var norm = Math.sqrt(
      candidate.heightWeight * candidate.heightWeight +
        candidate.linesWeight * candidate.linesWeight +
        candidate.holesWeight * candidate.holesWeight +
        candidate.bumpinessWeight * candidate.bumpinessWeight
    );
    candidate.heightWeight /= norm;
    candidate.linesWeight /= norm;
    candidate.holesWeight /= norm;
    candidate.bumpinessWeight /= norm;
  }

  function generateRandomCandidate() {
    var candidate = {
      heightWeight: Math.random() - 0.5,
      linesWeight: Math.random() - 0.5,
      holesWeight: Math.random() - 0.5,
      bumpinessWeight: Math.random() - 0.5,
    };
    normalize(candidate);
    return candidate;
  }

  function sort(candidate) {
    candidate.sort(function (a, b) {
      return b.fitness - a.fitness;
    });
  }

  function computeFitnesses(candidates, numberOfGames, maxNumberOfMoves) {
    for (var i = 0; i < candidates.length; i++) {
      var candidate = candidates[i];
      var ai = new AI(
        candidate.heightWeight,
        candidate.linesWeight,
        candidate.holesWeight,
        candidate.bumpinessWeight
      );
      var totalScore = 0;
      for (var j = 0; j < numberOfGames; j++) {
        var grid = new Grid(32, 15);
        var rgp = new RandomPieceGenerator();
        var workingPieces = [rgp.nextPiece(), rpg.nextPiece()];
        var workingPiece = workingPieces[0];
        var score = 0;
        var numberOfMoves = 0;
        while (numberOfMoves++ < maxNumberOfMoves && !grid.exceeded()) {
          workingPiece = ai.best(grid, workingPieces);
          while (workingPiece.moveDown(grid));
          grid.addPiece(workingPiece);
          score += grid.clearLines();
          for (var k = 0; k < workingPiece.length - 1; k++) {
            workingPieces[k] = workingPieces[k + 1];
          }
          workingPieces[workingPiece.length - 1] = rpg.nextPiece();
          workingPiece = workingPieces[0];
        }
        totalScore += score;
      }
      candidate.fitness = totalScore;
    }
  }

  function tournamentSelectPair(candidate, ways) {
    var indices = [];
    for (var i = 0; i < candidates.length; i++) {
      indices.push(i);
    }

    var fitnessCandidateIndex1 = null;
    var fitnessCandidateIndex2 = null;
    for (var i = 0; i < ways; i++) {
      var selectedIndex = indices.splice(
        randomInteger(0, indices.length),
        1
      )[0];
      if (
        fitnessCandidateIndex1 === null ||
        selectedIndex < fitnessCandidateIndex1
      ) {
        fitnessCandidateIndex2 = fitnessCandidateIndex1;
        fitnessCandidateIndex1 = selectedIndex;
      } else if (
        fitnessCandidateIndex2 === null ||
        selectedIndex < fitnessCandidateIndex2
      ) {
        fitnessCandidateIndex2 = selectedIndex;
      }
    }
    return [
      candidates[fitnessCandidateIndex1],
      candidates[fitnessCandidateIndex2],
    ];
  }

  function crossOver(candidate1, candidate2) {
    var candidate = {
      heightWeight:
        candidate1.fitness * candidate1.heightWeight +
        candidate2.fitness * candidate2.heightWeight,
      linesWeight:
        candidate1.fitness * candidate1.linesWeight +
        candidate2.fitness * candidate2.linesWeight,
      holesWeight:
        candidate1.fitness * candidate1.holesWeight +
        candidate2.fitness * candidate2.holesWeight,
      bumpinessWeight:
        candidate1.fitness * candidate1.bumpinessWeight +
        candidate2.fitness * candidate2.bumpinessWeight,
    };
    normalize(candidate);
    return candidate;
  }

  function mutate(candidate) {
    var quantity = Math.random() * 0.4 - 0.2;
    switch (randomInteger(0, 4)) {
      case 0:
        candidate.heightWeight += quantity;
        break;
      case 1:
        candidate.linesWeight += quantity;
        break;
      case 2:
        candidate.holesWeight += quantity;
        break;
      case 3:
        candidate.bumpinessWeight += quantity;
        break;
    }
  }

  function deleteNLastReplacement(candidate, newcandidates) {
    candidates.slice(-newCandidates.length);
    for (var i = 0; i < newCandidates.length; i++) {
      candidates.push(newCandidates[i]);
    }
    sort(candidates);
  }

  /*
    遺傳算法
    Population size = 100
    Rounds per candidate = 5
    Max moves per round = 200
    Theoretical fitness limit = 5 * 200 * 4 / 10 = 400
  */
  this.tune = function () {
    var candidates = [];

    for (var i = 0; i < 100; i++) {
      candidates.push(generateRandomCandidate());
    }

    console.log("初始化模型超參數");
    computeFitnesses(candidates, 5, 200);
    sort(candidates);

    var count = 0;
    while (true) {
      var newCandidates = [];
      for (var i = 0; i < 30; i++) {
        // ˇ30% 做變型
        var pair = tournamentSelectPair(candidates, 10); // 10% 基數
        var candidate = crossOver(pair[0], pair[1]);
        if (Math.random() < 0.05) {
          // 取 alpha 為 5%
          mutate(candidate);
        }
        normalize(candidate);
        newCandidates.push(candidate);
      }
      console.log("計算新候選目標, {" + count + " }");
      computeFitnesses(newCandidates, 5, 200);
      deleteNLastReplacement(candidates, newCandidates);
      var totalFitness = 0;
      for (var i = 0; i < candidates.length; i++) {
        totalFitness += candidates[i].fitness;
      }
      console.log("平均適合度 > " + totalFitness / candidates.length);
      console.log(
        "最高適合度 > " + candidates[0].fitness + "( " + count + " )"
      );
      console.log(
        "最合適適合度 > " + JSON.stringify(candidates[0]) + "( " + count + " )"
      );
      count++;
    }
  };
}
