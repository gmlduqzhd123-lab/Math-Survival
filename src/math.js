// Extracted from upstream. Cross-system state is supplied by the shared runtime.
export function createSystem(gameRuntime) {
function makeProblem() { return gameRuntime.v2.makeProblem(); }

function spawnQuiz() {
      const problem = gameRuntime.makeProblem();
      gameRuntime.state.problem = problem;
      gameRuntime.v2.present(problem);
      gameRuntime.state.quizActive = true;
      gameRuntime.state.currentAnswer = problem.answer;
      gameRuntime.questionText.textContent = problem.text;
      gameRuntime.questionSub.textContent = gameRuntime.gameNow() < gameRuntime.state.hintUntil
        ? "연산노트 효과: 정답 구슬이 금빛으로 반짝입니다!"
        : gameRuntime.state.mode==='explore' ? "답안 버튼으로 답하세요. 오답 피해 없이 해설을 확인한 뒤 계속합니다." : "정답 구슬을 먹으면 강화됩니다. 오답 구슬은 피해 주세요!";
      gameRuntime.questionBox.style.display = "block";

      gameRuntime.answerOrbs = [];
      const offsets = gameRuntime.v2.orbPositions();
      problem.options.forEach((value, i) => {
        gameRuntime.answerOrbs.push({ x: offsets[i].x, y: offsets[i].y, r: Math.min(38,gameRuntime.canvas.height/5), value,
          correct: gameRuntime.v2.isCorrect(value, problem.answer), explain: problem.explain, pulse: Math.random()*6 });
      });
      gameRuntime.showToast("수학 문제가 등장했습니다! 정답 구슬을 먹으세요.");
      gameRuntime.sfx("item");
    }

function resolveAnswer(orb) {
      if (!gameRuntime.state.running || gameRuntime.state.paused || !gameRuntime.state.quizActive) return;
      gameRuntime.v2.record(orb);
      gameRuntime.state.quizActive = false;
      gameRuntime.questionBox.style.display = "none";
      gameRuntime.answerOrbs = [];

      if (orb.correct) {
        gameRuntime.state.correct++;
        gameRuntime.state.combo++;
        gameRuntime.state.bestCombo = Math.max(gameRuntime.state.bestCombo, gameRuntime.state.combo);
        gameRuntime.updateMission("correct", 1);
        gameRuntime.unlockAchievement("firstCorrect", "첫 정답");
        if (gameRuntime.state.combo >= 5) gameRuntime.unlockAchievement("combo5", "5콤보 달성");
        if (gameRuntime.state.combo > 0 && gameRuntime.state.combo % 5 === 0) {
          gameRuntime.state.feverUntil = gameRuntime.gameNow() + 10000;
          gameRuntime.showToast("🔥 피버 모드! 10초 동안 점수와 공격 효율이 크게 증가합니다.");
          gameRuntime.sfx("level");
        }
        gameRuntime.scorePlus(135 + gameRuntime.state.combo * 18);
        gameRuntime.state.exp += 40;
        gameRuntime.state.hp = gameRuntime.clamp(gameRuntime.state.hp + 12 + gameRuntime.state.healBonus, 0, gameRuntime.state.maxHp);
        gameRuntime.state.attackPower += 1.2;

        gameRuntime.floatingTexts.push({ x: gameRuntime.player.x, y: gameRuntime.player.y - 42, text: "정답!", life: 50, color: "#86efac" });

        if (gameRuntime.state.combo % 3 === 0) {
          gameRuntime.state.shield = Math.min(8, gameRuntime.state.shield + 1);
          gameRuntime.explode(gameRuntime.player.x, gameRuntime.player.y, 150, 46, true);
          gameRuntime.showToast(`정답! 콤보 ${gameRuntime.state.combo}회! 보호막 +1, 수학 폭발 발동!`);
        } else {
          gameRuntime.explode(gameRuntime.player.x, gameRuntime.player.y, 92, 24, false);
          gameRuntime.showToast(`정답! 공격력 증가 + 체력 회복!`);
        }
        gameRuntime.sfx("correct");
      } else {
        gameRuntime.state.wrong++;
        gameRuntime.state.combo = 0;
        if(gameRuntime.state.mode!=="explore"){gameRuntime.state.hp -= 7;
        gameRuntime.state.slowUntil = gameRuntime.gameNow() + 1800;}
        gameRuntime.floatingTexts.push({ x: gameRuntime.player.x, y: gameRuntime.player.y - 42, text: `정답: ${gameRuntime.state.currentAnswer}`, life: 70, color: "#fca5a5" });
        gameRuntime.showToast(`오답! 정답은 ${gameRuntime.state.currentAnswer}입니다. ${orb.explain}`);
        gameRuntime.sfx("wrong");
      }

      gameRuntime.checkLevelUp();
      gameRuntime.v2.afterAnswer();
    }
return { makeProblem, spawnQuiz, resolveAnswer };
}
