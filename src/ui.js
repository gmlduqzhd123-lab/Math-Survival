// Extracted from upstream. Cross-system state is supplied by the shared runtime.
import {spriteMarkup} from './sprites.js';
export function createSystem(gameRuntime) {
function stopJoystick(e) {
      if (e) e.preventDefault();
      gameRuntime.isJoystickActive = false;
      gameRuntime.joystickDelta = { x: 0, y: 0 };
      gameRuntime.joystickStick.style.transform = `translate(0px, 0px)`;
    }

function updateJoystick(clientX, clientY) {
      const maxDist = 40;
      let dx = clientX - gameRuntime.joystickCenter.x;
      let dy = clientY - gameRuntime.joystickCenter.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > maxDist) { dx = (dx / dist) * maxDist; dy = (dy / dist) * maxDist; }
      gameRuntime.joystickStick.style.transform = `translate(${dx}px, ${dy}px)`;
      gameRuntime.joystickDelta = { x: dx / maxDist, y: dy / maxDist };
    }

function stopDash(e) {
      if (e) e.preventDefault();
      gameRuntime.keys[" "] = false;
    }

function initAudio() {
      if (gameRuntime.audioReady) {
        if (gameRuntime.audioCtx.state === "suspended") gameRuntime.audioCtx.resume().catch(() => {});
        return;
      }
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      try { gameRuntime.audioCtx = new AudioContext(); } catch { return; }
      gameRuntime.masterGain = gameRuntime.audioCtx.createGain();
      gameRuntime.musicGain = gameRuntime.audioCtx.createGain();
      gameRuntime.sfxGain = gameRuntime.audioCtx.createGain();
      gameRuntime.masterGain.gain.value = gameRuntime.muted ? 0 : 1;
      gameRuntime.musicGain.gain.value = 0.08;
      gameRuntime.sfxGain.gain.value = 0.18;
      gameRuntime.musicGain.connect(gameRuntime.masterGain);
      gameRuntime.sfxGain.connect(gameRuntime.masterGain);
      gameRuntime.masterGain.connect(gameRuntime.audioCtx.destination);
      gameRuntime.audioReady = true;
      gameRuntime.startPersistentMusic();
    }

function setMuted(value) {
      gameRuntime.muted = value;
      gameRuntime.muteBtn.textContent = gameRuntime.muted ? "🔇 소리 꺼짐" : "🔊 소리 켜짐";
      if (gameRuntime.musicBtn) gameRuntime.musicBtn.textContent = gameRuntime.muted ? "🔇 브금 꺼짐" : "🎵 브금 유지 중";
      if (gameRuntime.audioReady) gameRuntime.masterGain.gain.value = gameRuntime.muted ? 0 : 1;
    }

function playTone(freq, duration = 0.08, type = "sine", volume = 0.25, target = gameRuntime.sfxGain, delay = 0) {
      if (!gameRuntime.audioReady || gameRuntime.muted) return;
      const osc = gameRuntime.audioCtx.createOscillator();
      const gain = gameRuntime.audioCtx.createGain();
      osc.type = type;
      osc.frequency.value = freq;
      osc.connect(gain);
      gain.connect(target);
      const now = gameRuntime.audioCtx.currentTime + delay;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(Math.max(0.001, volume), now + 0.012);
      gain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      osc.start(now);
      osc.stop(now + duration + 0.03);
    }

function startPersistentMusic() {
      if (!gameRuntime.audioReady || gameRuntime.musicTimer) return;
      const lead = [392, 494, 523, 587, 659, 587, 523, 494, 440, 523, 587, 659, 784, 659, 587, 523];
      const bass = [98, 98, 130.81, 130.81, 146.83, 146.83, 130.81, 130.81];
      let step = 0;
      gameRuntime.musicTimer = setInterval(() => {
        if (!gameRuntime.audioReady || gameRuntime.muted) return;
        gameRuntime.playTone(lead[step % lead.length], 0.16, "triangle", 0.09, gameRuntime.musicGain, 0);
        if (step % 2 === 0) gameRuntime.playTone(bass[Math.floor(step / 2) % bass.length], 0.22, "sine", 0.08, gameRuntime.musicGain, 0);
        if (step % 4 === 2) gameRuntime.playTone(lead[step % lead.length] * 1.5, 0.06, "square", 0.025, gameRuntime.musicGain, 0.02);
        step++;
      }, 245);
    }

function sfx(type) {
      if (!gameRuntime.audioReady || gameRuntime.muted) return;
      if (type === "correct") { gameRuntime.playTone(659,.08,"triangle",.22); gameRuntime.playTone(880,.09,"triangle",.20,gameRuntime.sfxGain,.07); gameRuntime.playTone(1175,.11,"triangle",.18,gameRuntime.sfxGain,.14); }
      if (type === "wrong") { gameRuntime.playTone(220,.13,"sawtooth",.16); gameRuntime.playTone(150,.18,"sawtooth",.12,gameRuntime.sfxGain,.08); }
      if (type === "hit") { gameRuntime.playTone(115,.12,"square",.17); gameRuntime.playTone(92,.10,"sawtooth",.11,gameRuntime.sfxGain,.05); }
      if (type === "dash") { gameRuntime.playTone(740,.055,"triangle",.10); gameRuntime.playTone(980,.055,"triangle",.08,gameRuntime.sfxGain,.04); }
      if (type === "item") { gameRuntime.playTone(523,.06,"triangle",.18); gameRuntime.playTone(784,.08,"triangle",.17,gameRuntime.sfxGain,.07); }
      if (type === "heal") { gameRuntime.playTone(523,.07,"sine",.15); gameRuntime.playTone(659,.08,"sine",.14,gameRuntime.sfxGain,.08); gameRuntime.playTone(784,.10,"sine",.13,gameRuntime.sfxGain,.16); }
      if (type === "shield") { gameRuntime.playTone(330,.10,"triangle",.14); gameRuntime.playTone(660,.14,"triangle",.13,gameRuntime.sfxGain,.05); }
      if (type === "freeze") { gameRuntime.playTone(988,.11,"sine",.12); gameRuntime.playTone(740,.16,"sine",.10,gameRuntime.sfxGain,.10); }
      if (type === "boom") { gameRuntime.playTone(82,.18,"sawtooth",.25); gameRuntime.playTone(123,.14,"square",.18,gameRuntime.sfxGain,.06); }
      if (type === "level") { gameRuntime.playTone(523,.08,"triangle",.20); gameRuntime.playTone(659,.08,"triangle",.18,gameRuntime.sfxGain,.08); gameRuntime.playTone(784,.08,"triangle",.18,gameRuntime.sfxGain,.16); gameRuntime.playTone(1046,.13,"triangle",.16,gameRuntime.sfxGain,.25); }
      if (type === "speed") { gameRuntime.playTone(880,.06,"square",.13); gameRuntime.playTone(1175,.06,"square",.12,gameRuntime.sfxGain,.05); }
    }

function showToast(msg) {
      gameRuntime.toast.textContent = msg;
      gameRuntime.toast.classList.add("show");
      clearTimeout(gameRuntime.showToast.timer);
      gameRuntime.showToast.timer = setTimeout(() => gameRuntime.toast.classList.remove("show"), 1500);
    }

function scorePlus(amount) {
      let multiplier = gameRuntime.gameNow() < gameRuntime.state.doubleScoreUntil ? 2 : 1;
      if (gameRuntime.gameNow() < gameRuntime.state.feverUntil) multiplier *= 2;
      gameRuntime.state.score += amount * multiplier;
      if (multiplier > 1) {
        gameRuntime.floatingTexts.push({ x: gameRuntime.player.x, y: gameRuntime.player.y - 34, text: "점수 2배!", life: 44, color: "#fde047" });
      }
    }

function unlockAchievement(key, title) {
      if (gameRuntime.state.achievements[key]) return;
      gameRuntime.state.achievements[key] = true;
      gameRuntime.achievementPop.textContent = `🏆 업적 달성: ${title}`;
      gameRuntime.achievementPop.classList.add("show");
      clearTimeout(gameRuntime.unlockAchievement.timer);
      gameRuntime.unlockAchievement.timer = setTimeout(() => gameRuntime.achievementPop.classList.remove("show"), 2600);
      gameRuntime.state.exp += 30;
      gameRuntime.scorePlus(150);
      gameRuntime.sfx("level");
    }

function createMission() {
      const pool = [
        { type:"defeat", target: 18 + gameRuntime.state.level * 2, title:"몬스터 처치" },
        { type:"correct", target: 3, title:"수학 문제 정답" },
        { type:"collect", target: 4, title:"아이템 수집" },
        { type:"survive", target: 28, title:"시간 버티기" }
      ];
      const m = pool[gameRuntime.randint(0, pool.length - 1)];
      gameRuntime.state.mission = { ...m, progress:0, startedAt: gameRuntime.state.time };
      gameRuntime.updateMissionUI();
    }

function updateMission(kind, amount = 1) {
      const m = gameRuntime.state.mission;
      if (!m || m.type !== kind) return;
      m.progress = Math.min(m.target, m.progress + amount);
      if (m.progress >= m.target) gameRuntime.completeMission();
      else gameRuntime.updateMissionUI();
    }

function completeMission() {
      const m = gameRuntime.state.mission;
      if (!m) return;
      gameRuntime.scorePlus(320);
      gameRuntime.state.exp += 70;
      gameRuntime.state.shield = Math.min(8, gameRuntime.state.shield + 1);
      gameRuntime.spawnItem(gameRuntime.player.x + gameRuntime.rand(-120, 120), gameRuntime.player.y + gameRuntime.rand(-120, 120), "chest");
      gameRuntime.showToast(`미션 완료: ${m.title}! 보물상자가 등장했습니다.`);
      gameRuntime.sfx("level");
      gameRuntime.state.mission = null;
      gameRuntime.checkLevelUp();
      gameRuntime.state.missionDue=gameRuntime.gameNow()+1200;
    }

function updateMissionUI() {
      if (!gameRuntime.state.mission) {
        gameRuntime.missionInfo.textContent = "🎯 새 미션 준비 중";
        return;
      }
      const m = gameRuntime.state.mission;
      const label = m.type === "defeat" ? "몬스터 처치" :
                    m.type === "correct" ? "정답 맞히기" :
                    m.type === "collect" ? "아이템 수집" : "생존하기";
      gameRuntime.missionInfo.textContent = `🎯 미션: ${label} ${Math.floor(m.progress)}/${m.target}`;
    }

function openLevelUpPanel() {
      gameRuntime.state.levelUpPending = true;
      gameRuntime.state.paused = true;
      gameRuntime.levelUpPanel.classList.add("show");
      gameRuntime.upgradeChoices.innerHTML = "";

      const options = gameRuntime.upgradeOptions();
      options.forEach(option => {
        const btn = document.createElement("button");
        btn.className = "upgradeBtn";
        btn.innerHTML = `<span class="emoji">${option.sprite?spriteMarkup(option.sprite):option.emoji}</span><span class="title">${option.title}</span><span class="desc">${option.desc}</span>`;
        btn.addEventListener("click", () => gameRuntime.chooseUpgrade(option));
        gameRuntime.upgradeChoices.appendChild(btn);
      });

      gameRuntime.showToast(`Lv.${gameRuntime.state.level} 달성! 성장 카드를 선택하세요.`);
      gameRuntime.sfx("level");
      gameRuntime.burst(gameRuntime.player.x, gameRuntime.player.y, "#fde047", 44, 4.5);
    }

function updateWeaponInfo() {
      const parts = [`🔮 Lv.${gameRuntime.state.weaponLevel}`];
      if (gameRuntime.state.weaponSpread > 1) parts.push(`${gameRuntime.state.weaponSpread}연발`);
      if (gameRuntime.state.weaponPierce > 0) parts.push(`관통${gameRuntime.state.weaponPierce}`);
      if (gameRuntime.state.satelliteLevel > 0) parts.push(`위성${gameRuntime.state.satelliteLevel}`);
      if (gameRuntime.state.laserLevel > 0) parts.push(`레이저${gameRuntime.state.laserLevel}`);
      if (gameRuntime.state.boomerangLevel > 0) parts.push(`칠판${gameRuntime.state.boomerangLevel}`);
      if (gameRuntime.state.chalkRainLevel > 0) parts.push(`분필비${gameRuntime.state.chalkRainLevel}`);
      gameRuntime.weaponInfo.textContent = `무기: ${parts.join(" · ")}`;
    }

function endGame(won, quit = false) {
      if (!gameRuntime.state.running) return;
      gameRuntime.state.missionDue=null;
      gameRuntime.v2.clearInput();
      gameRuntime.state.running = false;
      document.body.classList.remove("game-running");
      gameRuntime.stopJoystick();
      gameRuntime.keys[" "] = false;
      gameRuntime.hud.classList.add("hidden");
      gameRuntime.mainMenuBtn.classList.add("hidden");
      gameRuntime.quitGameBtn.classList.add("hidden");
      gameRuntime.questionBox.style.display = "none";
      gameRuntime.levelUpPanel.classList.remove("show");
      gameRuntime.state.levelUpPending = false;
      gameRuntime.gameOverPanel.classList.remove("hidden");

      document.getElementById("resultTitle").textContent = quit ? "⛔ 게임 종료" : (won ? "🎉 수학 월드 정복!" : "💫 다시 도전!");
      document.getElementById("resultText").innerHTML = quit
        ? `${gameRuntime.state.map.name} 탐험을 종료했습니다. 지금까지 모은 점수와 정답 기록을 확인해 보세요.`
        : won
          ? `${gameRuntime.state.map.name}에서 3분 생존 성공! 큰 맵을 이동하며 정답과 아이템을 찾아 성장했습니다.`
          : `${gameRuntime.state.map.name}에서 아쉽게 쓰러졌습니다. 다음 판에서는 무기 강화와 이동 경로를 다르게 선택해 보세요.`;

      document.getElementById("finalScore").textContent = gameRuntime.state.score;
      document.getElementById("finalLevel").textContent = gameRuntime.state.level;
      document.getElementById("finalCorrect").textContent = gameRuntime.state.correct;
      document.getElementById("finalCombo").textContent = gameRuntime.state.bestCombo;
      gameRuntime.v2.finish(won, quit);
    }

let lastBuff="",lastBuffTick=-Infinity;
function updateBuffUI(now) {
      if(now-lastBuffTick<250&&now>=lastBuffTick)return;lastBuffTick=now;
      const buffs = [];
      buffs.push(`🗺️ ${gameRuntime.state.map.name}`);
      if (now < gameRuntime.state.speedUntil) buffs.push(`⚡ 속도 ${Math.ceil((gameRuntime.state.speedUntil - now) / 1000)}초`);
      if (now < gameRuntime.state.freezeUntil) buffs.push(`❄️ 정지 ${Math.ceil((gameRuntime.state.freezeUntil - now) / 1000)}초`);
      if (now < gameRuntime.state.magnetUntil) buffs.push(`🧲 자석 ${Math.ceil((gameRuntime.state.magnetUntil - now) / 1000)}초`);
      if (now < gameRuntime.state.doubleScoreUntil) buffs.push(`⭐ 점수2배 ${Math.ceil((gameRuntime.state.doubleScoreUntil - now) / 1000)}초`);
      if (now < gameRuntime.state.hintUntil) buffs.push(`📘 정답힌트 ${Math.ceil((gameRuntime.state.hintUntil - now) / 1000)}초`);
      if (now < gameRuntime.state.rainbowUntil) buffs.push(`🌈 무기강화 ${Math.ceil((gameRuntime.state.rainbowUntil - now) / 1000)}초`);
      if (now < gameRuntime.state.feverUntil) buffs.push(`🔥 피버 ${Math.ceil((gameRuntime.state.feverUntil - now) / 1000)}초`);
      if (now < gameRuntime.state.luckyUntil) buffs.push(`🍀 행운 ${Math.ceil((gameRuntime.state.luckyUntil - now) / 1000)}초`);
      const html=buffs.map(b => `<div class="buff">${b}</div>`).join("");if(html!==lastBuff){gameRuntime.activeItems.innerHTML=html;lastBuff=html;}
      gameRuntime.updateMissionUI();
    }
return { stopJoystick, updateJoystick, stopDash, initAudio, setMuted, playTone, startPersistentMusic, sfx, showToast, scorePlus, unlockAchievement, createMission, updateMission, completeMission, updateMissionUI, openLevelUpPanel, updateWeaponInfo, endGame, updateBuffUI };
}
