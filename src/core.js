// Extracted from upstream. Cross-system state is supplied by the shared runtime.
import {renderDpr} from './render-budget.js';
export function createSystem(gameRuntime) {
function gameNow(){ return gameRuntime.clock; }

function syncCanvasViewport() {
      const box=gameRuntime.surface.getBoundingClientRect(),v=gameRuntime.viewport;
      if(!box.width||!box.height)return false;
      const width=box.width,height=box.height,dpr=renderDpr(width,height,window.devicePixelRatio);
      const changed=v.width!==width||v.height!==height||v.dpr!==dpr;
      v.width=width;v.height=height;v.dpr=dpr;
      if(changed){gameRuntime.surface.width=Math.round(width*dpr);gameRuntime.surface.height=Math.round(height*dpr);}
      return changed;
    }

function rand(min, max) { return Math.random() * (max - min) + min; }

function randint(min, max) { return Math.floor(gameRuntime.rand(min, max + 1)); }

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }

function distance(a, b) { return Math.hypot(a.x - b.x, a.y - b.y); }

function worldToScreenX(x) { return x - gameRuntime.state.cameraX; }

function worldToScreenY(y) { return y - gameRuntime.state.cameraY; }

function isNearScreen(x, y, buffer = 120) {
      const sx = gameRuntime.worldToScreenX(x), sy = gameRuntime.worldToScreenY(y);
      return sx > -buffer && sx < gameRuntime.canvas.width + buffer && sy > -buffer && sy < gameRuntime.canvas.height + buffer;
    }

function updateCamera() {
      gameRuntime.state.cameraX = gameRuntime.clamp(gameRuntime.player.x - gameRuntime.canvas.width / 2, 0, gameRuntime.state.worldW - gameRuntime.canvas.width);
      gameRuntime.state.cameraY = gameRuntime.clamp(gameRuntime.player.y - gameRuntime.canvas.height / 2, 0, gameRuntime.state.worldH - gameRuntime.canvas.height);
    }

function randomPointAroundPlayer(minR, maxR) {
      const a = gameRuntime.rand(0, Math.PI * 2);
      const r = gameRuntime.rand(minR, maxR);
      return {
        x: gameRuntime.clamp(gameRuntime.player.x + Math.cos(a) * r, 70, gameRuntime.state.worldW - 70),
        y: gameRuntime.clamp(gameRuntime.player.y + Math.sin(a) * r, 70, gameRuntime.state.worldH - 70)
      };
    }

function randomVisiblePoint() {
      return {
        x: gameRuntime.clamp(gameRuntime.state.cameraX + gameRuntime.rand(90, gameRuntime.canvas.width - 90), 60, gameRuntime.state.worldW - 60),
        y: gameRuntime.clamp(gameRuntime.state.cameraY + gameRuntime.rand(100, gameRuntime.canvas.height - 80), 60, gameRuntime.state.worldH - 60)
      };
    }

function resetGame() {
      gameRuntime.state.missionDue = null;
      gameRuntime.clock = 0;
      Object.keys(gameRuntime.keys).forEach(k => gameRuntime.keys[k] = false);
      gameRuntime.initAudio();
      document.body.classList.add("game-running");
      gameRuntime.stopJoystick();
      gameRuntime.keys[" "] = false;

      const mapKey = gameRuntime.mapSelect.value;
      gameRuntime.state.currentMapKey = mapKey;
      gameRuntime.state.map = gameRuntime.MAPS[mapKey];
      gameRuntime.state.worldW = gameRuntime.state.map.worldW;
      gameRuntime.state.worldH = gameRuntime.state.map.worldH;

      gameRuntime.state.dashRequested = false;
      gameRuntime.state.running = true;
      gameRuntime.state.paused = false;
      gameRuntime.state.difficulty = gameRuntime.difficultyEl.value;
      gameRuntime.state.score = 0;
      gameRuntime.state.level = 1;
      gameRuntime.state.exp = 0;
      gameRuntime.state.hp = 120;
      gameRuntime.state.maxHp = 120;
      gameRuntime.state.time = 0;
      gameRuntime.state.combo = 0;
      gameRuntime.state.bestCombo = 0;
      gameRuntime.state.correct = 0;
      gameRuntime.state.wrong = 0;
      gameRuntime.state.mission = null;
      gameRuntime.state.achievements = {};
      gameRuntime.state.feverUntil = 0;
      gameRuntime.state.luckyUntil = 0;
      gameRuntime.state.bossIndex = 0;
      gameRuntime.state.bossWarnings = 0;
      gameRuntime.state.portalCooldown = 0;
      gameRuntime.state.petLevel = 1;
      gameRuntime.state.lastPetShot = 0;
      gameRuntime.state.levelUpPending = false;
      gameRuntime.state.levelUpQueue = 0;

      gameRuntime.state.weaponLevel = 1;
      gameRuntime.state.attackPower = 22;
      gameRuntime.state.fireRate = 490;
      gameRuntime.state.projectileSpeed = 7.5;
      gameRuntime.state.weaponPierce = 0;
      gameRuntime.state.weaponSpread = 1;
      gameRuntime.state.satelliteLevel = 0;
      gameRuntime.state.satelliteAngle = 0;
      gameRuntime.state.laserLevel = 0;
      gameRuntime.state.boomerangLevel = 0;
      gameRuntime.state.chalkRainLevel = 0;

      gameRuntime.state.shield = 0;
      gameRuntime.state.healBonus = 0;
      gameRuntime.state.slowUntil = 0;
      gameRuntime.state.freezeUntil = 0;
      gameRuntime.state.speedUntil = 0;
      gameRuntime.state.magnetUntil = 0;
      gameRuntime.state.doubleScoreUntil = 0;
      gameRuntime.state.hintUntil = 0;
      gameRuntime.state.rainbowUntil = 0;
      gameRuntime.state.eraserUntil = 0;

      const now = gameRuntime.gameNow();
      gameRuntime.state.lastShot = 0;
      gameRuntime.state.lastSpawn = 0;
      gameRuntime.state.lastQuiz = 0;
      gameRuntime.state.lastItem = now;
      gameRuntime.state.lastLaser = 0;
      gameRuntime.state.lastBoomerang = 0;
      gameRuntime.state.lastChalkRain = 0;
      gameRuntime.state.quizActive = false;
      gameRuntime.state.currentAnswer = null;

      gameRuntime.player.x = gameRuntime.state.worldW / 2;
      gameRuntime.player.y = gameRuntime.state.worldH / 2;
      gameRuntime.player.invincible = 0;
      gameRuntime.player.dashCooldown = 0;
      gameRuntime.player.speed = 4.35;

      gameRuntime.enemies = [];
      gameRuntime.projectiles = [];
      gameRuntime.particles = [];
      gameRuntime.answerOrbs = [];
      gameRuntime.items = [];
      gameRuntime.expDrops = [];
      gameRuntime.floatingTexts = [];
      gameRuntime.makeDecorations();
      gameRuntime.makePortals();
      gameRuntime.updateCamera();

      gameRuntime.startPanel.classList.add("hidden");
      gameRuntime.gameOverPanel.classList.add("hidden");
      gameRuntime.hud.classList.remove("hidden");
      gameRuntime.mainMenuBtn.classList.remove("hidden");
      gameRuntime.quitGameBtn.classList.remove("hidden");
      gameRuntime.questionBox.style.display = "none";
      gameRuntime.levelUpPanel.classList.remove("show");
      gameRuntime.updateWeaponInfo();
      gameRuntime.createMission();

      gameRuntime.spawnItem(gameRuntime.player.x - 180, gameRuntime.player.y + 130, "book");
      gameRuntime.spawnItem(gameRuntime.player.x, gameRuntime.player.y + 170, "heart");
      gameRuntime.spawnItem(gameRuntime.player.x + 180, gameRuntime.player.y + 130, "shield");
      gameRuntime.spawnItem(gameRuntime.player.x, gameRuntime.player.y - 190, "expBook");
      gameRuntime.spawnItem(gameRuntime.player.x + 260, gameRuntime.player.y, "chest");
      gameRuntime.showToast(`${gameRuntime.state.map.name} 입장! 큰 맵을 돌아다니며 살아남으세요.`);
      gameRuntime.v2.start();
    }

function update(dt, now) {
      if (!gameRuntime.state.running || gameRuntime.state.paused) return;
      if(gameRuntime.state.missionDue!=null&&now>=gameRuntime.state.missionDue){gameRuntime.state.missionDue=null;gameRuntime.createMission();}
      gameRuntime.updateBuffUI(now);

      gameRuntime.state.time += dt / 1000;
      gameRuntime.v2.tick(dt, now);
      if (!gameRuntime.state.running || gameRuntime.state.paused) return;

      if (gameRuntime.state.mission && gameRuntime.state.mission.type === "survive") {
        gameRuntime.state.mission.progress = Math.min(gameRuntime.state.mission.target, gameRuntime.state.time - gameRuntime.state.mission.startedAt);
        if (gameRuntime.state.mission.progress >= gameRuntime.state.mission.target) gameRuntime.completeMission();
      }

      if (gameRuntime.state.mode === "survival" && gameRuntime.state.time > 45 + gameRuntime.state.bossIndex * 50 && gameRuntime.state.bossIndex < 3) {
        gameRuntime.spawnBoss();
      }

      const slow = now < gameRuntime.state.slowUntil ? 0.58 : 1;
      const speedBoost = now < gameRuntime.state.speedUntil ? 1.42 : 1;
      let mx = 0, my = 0;
      if (gameRuntime.keys["ArrowLeft"] || gameRuntime.keys["a"]) mx -= 1;
      if (gameRuntime.keys["ArrowRight"] || gameRuntime.keys["d"]) mx += 1;
      if (gameRuntime.keys["ArrowUp"] || gameRuntime.keys["w"]) my -= 1;
      if (gameRuntime.keys["ArrowDown"] || gameRuntime.keys["s"]) my += 1;

      if (gameRuntime.joystickDelta.x !== 0 || gameRuntime.joystickDelta.y !== 0) {
        mx += gameRuntime.joystickDelta.x;
        my += gameRuntime.joystickDelta.y;
      }

      if(mx||my){gameRuntime.player.facing=Math.abs(mx)>Math.abs(my)?(mx>0?2:1):(my>0?0:3);gameRuntime.player.movingUntil=now+120;}
      const mag = Math.hypot(mx, my) || 1;
      const movementFrom={x:gameRuntime.player.x,y:gameRuntime.player.y};
      gameRuntime.player.x += (mx / mag) * gameRuntime.player.speed * slow * speedBoost;
      gameRuntime.player.y += (my / mag) * gameRuntime.player.speed * slow * speedBoost;
      gameRuntime.player.x = gameRuntime.clamp(gameRuntime.player.x, gameRuntime.player.r, gameRuntime.state.worldW - gameRuntime.player.r);
      gameRuntime.player.y = gameRuntime.clamp(gameRuntime.player.y, gameRuntime.player.r, gameRuntime.state.worldH - gameRuntime.player.r);

      gameRuntime.v3?.dungeon.constrain(gameRuntime.player,movementFrom);
      gameRuntime.updateCamera();
      gameRuntime.checkPortals(now);

      gameRuntime.player.invincible = Math.max(0, gameRuntime.player.invincible - dt);
      gameRuntime.player.dashCooldown = Math.max(0, gameRuntime.player.dashCooldown - dt);
      if (!gameRuntime.v2.settings.reduced) gameRuntime.player.blink += dt / 180;

      if ((gameRuntime.keys[" "] || gameRuntime.state.dashRequested) && gameRuntime.player.dashCooldown <= 0) {
        const dashFrom={x:gameRuntime.player.x,y:gameRuntime.player.y};
        gameRuntime.player.x += (mx / mag) * 92;
        gameRuntime.player.y += (my / mag) * 92;
        gameRuntime.player.x = gameRuntime.clamp(gameRuntime.player.x, gameRuntime.player.r, gameRuntime.state.worldW - gameRuntime.player.r);
        gameRuntime.player.y = gameRuntime.clamp(gameRuntime.player.y, gameRuntime.player.r, gameRuntime.state.worldH - gameRuntime.player.r);
        gameRuntime.v3?.dungeon.constrain(gameRuntime.player,dashFrom);
        gameRuntime.updateCamera();
        gameRuntime.player.invincible = 620;
        gameRuntime.player.dashCooldown = 1150;
        gameRuntime.burst(gameRuntime.player.x, gameRuntime.player.y, "#bfdbfe", 18, 3.3);
        gameRuntime.sfx("dash");
      }

      gameRuntime.state.dashRequested = false;
      const spawnDelay = Math.max(360, 1180 - gameRuntime.state.time * 4.4 - gameRuntime.state.level * 20);
      if (!gameRuntime.v3 && now - gameRuntime.state.lastSpawn > spawnDelay) {
        gameRuntime.state.lastSpawn = now;
        gameRuntime.spawnEnemy();
        if (gameRuntime.state.time > 45 && Math.random() < 0.28) gameRuntime.spawnEnemy();
      }

      if (now - gameRuntime.state.lastItem > 11000) {
        gameRuntime.state.lastItem = now;
        gameRuntime.spawnItem();
      }

      if (!gameRuntime.state.quizActive && now - gameRuntime.state.lastQuiz > gameRuntime.v2.quizInterval) {
        gameRuntime.state.lastQuiz = now;
        gameRuntime.spawnQuiz();
      }

      gameRuntime.shoot(now);
      gameRuntime.fireLaser(now);
      gameRuntime.fireBoomerang(now);
      gameRuntime.fireChalkRain(now);
      gameRuntime.updatePet(now);

      if (gameRuntime.state.satelliteLevel > 0) {
        gameRuntime.state.satelliteAngle += dt * 0.0045;
        const count = gameRuntime.state.satelliteLevel;
        for (const e of gameRuntime.enemies) {
          for (let i = 0; i < count; i++) {
            const ang = gameRuntime.state.satelliteAngle + (Math.PI * 2 / count) * i;
            const sx = gameRuntime.player.x + Math.cos(ang) * 50;
            const sy = gameRuntime.player.y + Math.sin(ang) * 50;
            if (Math.hypot(sx - e.x, sy - e.y) < e.r + 12) {
              gameRuntime.damageEnemy(e,0.65 + gameRuntime.state.satelliteLevel * 0.14);
            }
          }
        }
      }

      for (const e of gameRuntime.enemies) {
        if(gameRuntime.v3&&!e.boss)gameRuntime.v3.battle.move(e,dt,now);
        else if (now >= gameRuntime.state.freezeUntil) {
          const a = Math.atan2(gameRuntime.player.y - e.y, gameRuntime.player.x - e.x);
          const wobble = Math.sin(gameRuntime.state.time * 2 + e.wobble) * 0.25;
          e.x += Math.cos(a + wobble) * e.speed;
          e.y += Math.sin(a + wobble) * e.speed;
          e.x = gameRuntime.clamp(e.x, e.r, gameRuntime.state.worldW - e.r);
          e.y = gameRuntime.clamp(e.y, e.r, gameRuntime.state.worldH - e.r);
        } else {
          e.wobble += 0.03;
        }

        if (Math.hypot(gameRuntime.player.x - e.x, gameRuntime.player.y - e.y) < gameRuntime.player.r + e.r) {
          if (gameRuntime.player.invincible <= 0) {
            if (gameRuntime.state.shield > 0) {
              gameRuntime.state.shield--;
              gameRuntime.showToast("보호막이 공격을 막았습니다!");
              gameRuntime.explode(gameRuntime.player.x, gameRuntime.player.y, 80, 22, false);
              gameRuntime.sfx("shield");
            } else {
              gameRuntime.state.hp -= e.damage*(1-(gameRuntime.v3?.weapons.passives.armor||0)*.06);
              gameRuntime.state.combo = 0;
              gameRuntime.showToast("몬스터에게 맞았습니다. 거리를 벌리세요!");
              gameRuntime.sfx("hit");
            }
            gameRuntime.player.invincible = 940;
          }
        }
      }

      for (const p of gameRuntime.projectiles) {
        if (p.kind === "orb" || p.kind === "chalk" || p.kind === "pet") {
          if(p.homing&&gameRuntime.v3){const target=gameRuntime.v3.battle.grid.near(p.x,p.y,500).sort((a,b)=>gameRuntime.distance(a,p)-gameRuntime.distance(b,p))[0];if(target){const a=Math.atan2(target.y-p.y,target.x-p.x);p.vx=p.vx*.9+Math.cos(a)*.7;p.vy=p.vy*.9+Math.sin(a)*.7;}}
          p.x += p.vx;
          p.y += p.vy;
          p.life--;
        } else if (p.kind === "boomerang") {
          p.t++;
          const forward = p.t < 46 ? 1 : -1;
          p.x += Math.cos(p.angle) * p.speed * forward;
          p.y += Math.sin(p.angle) * p.speed * forward;
          p.angle += 0.13;
          p.life--;
        } else if (p.kind === "laser") {
          p.life--;
        }
      }

      gameRuntime.v3?.battle.grid.rebuild(gameRuntime.enemies);
      for (const p of gameRuntime.projectiles) {
        if (p.kind === "laser") continue;
        for (const e of gameRuntime.v3?gameRuntime.v3.battle.grid.near(p.x,p.y,p.r+60):gameRuntime.enemies) {
          if (p.life > 0 && !p.hitEnemies?.has(e.uid||e) && Math.hypot(p.x - e.x, p.y - e.y) < p.r + e.r) {
            (p.hitEnemies??=new Set()).add(e.uid||e);
            if(gameRuntime.v3)gameRuntime.v3.weapons.hit(e,p.damage);else gameRuntime.damageEnemy(e,p.damage);
            if (p.pierce > 0) {
              p.pierce--;
              p.damage *= 0.72;
            } else {
              p.life = 0;
            }
            gameRuntime.burst(e.x, e.y, e.elite ? "#fca5a5" : "#fde68a", 8, 3);
          }
        }
      }

      gameRuntime.projectiles = gameRuntime.projectiles.filter(p =>
        p.life > 0 &&
        p.x > -100 && p.x < gameRuntime.state.worldW + 100 &&
        p.y > -450 && p.y < gameRuntime.state.worldH + 100
      );

      const defeated = [];
      gameRuntime.enemies = gameRuntime.enemies.filter(e => {
        if (e.hp <= 0) {
          if(e.escaped){gameRuntime.v3?.battle.killed(e);return false;}
          defeated.push(e);
          gameRuntime.v3?.killed(e);
          gameRuntime.state.kills++;
          if(e.boss) gameRuntime.state.bossKills++;
          gameRuntime.scorePlus(e.boss ? 650 : e.elite ? 50 : e.tiny ? 16 : 24);
          if (e.boss) {
            gameRuntime.unlockAchievement("boss", "수학 보스 격파");
            gameRuntime.showToast(`${e.name} 격파! 보물상자가 쏟아집니다.`);
          }
          const expValue = e.boss ? 150 : e.elite ? 24 : e.tiny ? 7 : 12;
          const expCount = e.boss ? 10 : e.elite ? 4 : e.tiny ? 1 : 2;
          gameRuntime.spawnExpDrops(e.x, e.y, expValue, expCount);
          gameRuntime.burst(e.x, e.y, "#fef08a", 10, 3.2);
          return false;
        }
        return true;
      });

      for (const e of defeated) {
        if (e.boss) {
          gameRuntime.spawnItem(e.x - 70, e.y, "chest");
          gameRuntime.spawnItem(e.x + 70, e.y, "gem");
          gameRuntime.spawnItem(e.x, e.y + 70, "clover");
        } else {
          const dropChance = (now < gameRuntime.state.luckyUntil ? 0.24 : 0) + (e.elite ? 0.48 : 0.12);
          if (Math.random() < dropChance) gameRuntime.spawnItem(e.x, e.y);
        }
      }
      if (defeated.length) gameRuntime.updateMission("defeat", defeated.length);

      if (defeated.length) {
        gameRuntime.playTone(310, .04, "square", .04);
        gameRuntime.checkLevelUp();
      }

      if (now < gameRuntime.state.magnetUntil) {

      for (const item of gameRuntime.items) {
          const d = Math.hypot(gameRuntime.player.x - item.x, gameRuntime.player.y - item.y);
          if (d < 280) {
            item.x += (gameRuntime.player.x - item.x) * 0.05;
            item.y += (gameRuntime.player.y - item.y) * 0.05;
          }
        }
        for (const drop of gameRuntime.expDrops) {
          const d = Math.hypot(gameRuntime.player.x - drop.x, gameRuntime.player.y - drop.y);
          if (d < 360) {
            drop.x += (gameRuntime.player.x - drop.x) * 0.06;
            drop.y += (gameRuntime.player.y - drop.y) * 0.06;
          }
        }

      for (const orb of gameRuntime.answerOrbs) {
          if (orb.correct) {
            const d = Math.hypot(gameRuntime.player.x - orb.x, gameRuntime.player.y - orb.y);
            if (d < 230) {
              orb.x += (gameRuntime.player.x - orb.x) * 0.025;
              orb.y += (gameRuntime.player.y - orb.y) * 0.025;
            }
          }
        }
      }

      for (const drop of gameRuntime.expDrops) {
        drop.pulse += dt / 180;
        drop.life -= dt;
        drop.x += drop.vx;
        drop.y += drop.vy;
        drop.vx *= 0.94;
        drop.vy *= 0.94;

        const d = Math.hypot(gameRuntime.player.x - drop.x, gameRuntime.player.y - drop.y);
        if (d < 140+(gameRuntime.v3?.weapons.passives.magnet||0)*20) {
          drop.x += (gameRuntime.player.x - drop.x) * 0.035;
          drop.y += (gameRuntime.player.y - drop.y) * 0.035;
        }
        if (d < gameRuntime.player.r + drop.r + 4) {
          gameRuntime.collectExpDrop(drop);
        }
      }
      gameRuntime.expDrops = gameRuntime.expDrops.filter(drop => !drop.collected && drop.life > 0);

      for (const orb of gameRuntime.answerOrbs) {
        orb.pulse += dt / 190;
        if (Math.hypot(gameRuntime.player.x - orb.x, gameRuntime.player.y - orb.y) < gameRuntime.player.r + orb.r) {
          gameRuntime.resolveAnswer(orb);
          break;
        }
      }

      for (const item of gameRuntime.items) {
        item.pulse += dt / 180;
        item.life -= dt;
        if (Math.hypot(gameRuntime.player.x - item.x, gameRuntime.player.y - item.y) < gameRuntime.player.r + item.r) {
          item.collected = true;
          gameRuntime.applyItem(item, now);
        }
      }
      gameRuntime.items = gameRuntime.items.filter(item => !item.collected && item.life > 0);

      for (const pt of gameRuntime.particles) {
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vx *= 0.96;
        pt.vy *= 0.96;
        pt.life--;
      }
      gameRuntime.particles = gameRuntime.particles.filter(pt => pt.life > 0);

      for (const ft of gameRuntime.floatingTexts) {
        ft.y -= 0.55;
        ft.life--;
      }
      gameRuntime.floatingTexts = gameRuntime.floatingTexts.filter(ft => ft.life > 0);

      if(gameRuntime.state.hp<=0)gameRuntime.v3?.content.preventDeath();
      if (gameRuntime.state.hp <= 0) gameRuntime.endGame(false);
      else if (Number.isFinite(gameRuntime.state.winTime) && gameRuntime.state.time >= gameRuntime.state.winTime) gameRuntime.endGame(true);

      // Replacing identical text nodes still invalidates layout on every physics step.
      for (const [element,value] of [
        [gameRuntime.hpEl,Math.max(0,Math.ceil(gameRuntime.state.hp))],
        [gameRuntime.scoreEl,gameRuntime.state.score],
        [gameRuntime.levelEl,gameRuntime.state.level],
        [gameRuntime.expEl,Math.floor((gameRuntime.state.exp/gameRuntime.expNeed())*100)],
        [gameRuntime.weaponLevelEl,gameRuntime.state.weaponLevel],
        [gameRuntime.comboEl,gameRuntime.state.combo],
        [gameRuntime.shieldEl,gameRuntime.state.shield],
        [gameRuntime.timeEl,Math.floor(gameRuntime.state.time)]
      ]) { const text=String(value);if(element.textContent!==text)element.textContent=text; }
    }

function loop(now) {
      gameRuntime.v3?.battle.frame(now-gameRuntime.last);
      gameRuntime.accumulator += Math.min(100, now - gameRuntime.last); gameRuntime.last = now;
      while (gameRuntime.accumulator >= 1000/60) {
        if (gameRuntime.state.running && !gameRuntime.state.paused) { gameRuntime.clock += 1000/60; gameRuntime.update(1000/60, gameRuntime.gameNow()); }
        gameRuntime.accumulator -= 1000/60;
      }
      gameRuntime.draw(); requestAnimationFrame(gameRuntime.loop);
    }

function quitGame() {
      if (!gameRuntime.state.running) return;
      gameRuntime.state.paused = false;
      gameRuntime.state.levelUpPending = false;
      gameRuntime.state.levelUpQueue = 0;
      gameRuntime.levelUpPanel.classList.remove("show");
      gameRuntime.questionBox.style.display = "none";
      gameRuntime.showToast("게임을 종료했습니다.");
      gameRuntime.endGame(false, true);
    }

function returnToMainMenu() {
      if(gameRuntime.state.running)gameRuntime.v2.interrupt();
      gameRuntime.state.missionDue=null;
      gameRuntime.state.running = false;
      document.body.classList.remove("game-running");
      gameRuntime.stopJoystick();
      gameRuntime.keys[" "] = false;
      gameRuntime.state.paused = false;
      gameRuntime.state.levelUpPending = false;
      gameRuntime.state.levelUpQueue = 0;
      gameRuntime.state.quizActive = false;

      gameRuntime.enemies = [];
      gameRuntime.projectiles = [];
      gameRuntime.particles = [];
      gameRuntime.answerOrbs = [];
      gameRuntime.items = [];
      gameRuntime.expDrops = [];
      gameRuntime.floatingTexts = [];

      gameRuntime.hud.classList.add("hidden");
      gameRuntime.mainMenuBtn.classList.add("hidden");
      gameRuntime.quitGameBtn.classList.add("hidden");
      gameRuntime.gameOverPanel.classList.add("hidden");
      gameRuntime.startPanel.classList.remove("hidden");
      gameRuntime.startPanel.scrollTop = 0;
      gameRuntime.levelUpPanel.classList.remove("show");
      gameRuntime.questionBox.style.display = "none";
      gameRuntime.activeItems.innerHTML = "";
      gameRuntime.missionInfo.textContent = "🎯 오늘의 미션 준비 중";
      gameRuntime.achievementPop.classList.remove("show");

      gameRuntime.showToast("메인 메뉴로 돌아왔습니다.");
      gameRuntime.updateWeaponInfo();
    }
return { gameNow, syncCanvasViewport, rand, randint, clamp, distance, worldToScreenX, worldToScreenY, isNearScreen, updateCamera, randomPointAroundPlayer, randomVisiblePoint, resetGame, update, loop, quitGame, returnToMainMenu };
}
