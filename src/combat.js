// Extracted from upstream. Cross-system state is supplied by the shared runtime.
export function createSystem(gameRuntime) {
function giveChestReward(now) {
      const rewards = [
        () => { gameRuntime.state.exp += 65; gameRuntime.floatingTexts.push({x:gameRuntime.player.x,y:gameRuntime.player.y-50,text:"경험치 +65",life:60,color:"#86efac"}); },
        () => { gameRuntime.state.shield = Math.min(8, gameRuntime.state.shield + 2); gameRuntime.floatingTexts.push({x:gameRuntime.player.x,y:gameRuntime.player.y-50,text:"보호막 +2",life:60,color:"#93c5fd"}); },
        () => { gameRuntime.state.attackPower += 4; gameRuntime.state.weaponLevel++; gameRuntime.floatingTexts.push({x:gameRuntime.player.x,y:gameRuntime.player.y-50,text:"무기 강화!",life:60,color:"#fde047"}); },
        () => { gameRuntime.state.hp = gameRuntime.clamp(gameRuntime.state.hp + 45 + gameRuntime.state.healBonus, 0, gameRuntime.state.maxHp); gameRuntime.floatingTexts.push({x:gameRuntime.player.x,y:gameRuntime.player.y-50,text:"대회복!",life:60,color:"#fb7185"}); },
        () => { gameRuntime.spawnItem(gameRuntime.player.x + gameRuntime.rand(-120,120), gameRuntime.player.y + gameRuntime.rand(-120,120), "gem"); gameRuntime.spawnItem(gameRuntime.player.x + gameRuntime.rand(-120,120), gameRuntime.player.y + gameRuntime.rand(-120,120), "clover"); }
      ];
      rewards[gameRuntime.randint(0, rewards.length - 1)]();
      gameRuntime.checkLevelUp();
      gameRuntime.updateWeaponInfo();
    }

function expNeed() { return 90 + gameRuntime.state.level * 34; }

function checkLevelUp() {
      let need = gameRuntime.expNeed();
      while (gameRuntime.state.exp >= need) {
        gameRuntime.state.exp -= need;
        gameRuntime.state.level++;
        gameRuntime.state.levelUpQueue++;
        need = gameRuntime.expNeed();
      }
      if (gameRuntime.state.levelUpQueue > 0 && !gameRuntime.state.levelUpPending) gameRuntime.openLevelUpPanel();
    }

function upgradeOptions() {
      const options = [
        { emoji:"🐹", title:"캐릭터 성장", desc:"최대 체력 +15, 현재 체력 +25, 이동 속도 증가", apply(){ gameRuntime.state.maxHp+=15; gameRuntime.state.hp=gameRuntime.clamp(gameRuntime.state.hp+25+gameRuntime.state.healBonus,0,gameRuntime.state.maxHp); gameRuntime.player.speed+=0.12; } },
        { emoji:"❤️", title:"회복력 강화", desc:"정답과 하트 아이템 회복량 증가, 보호막 +1", apply(){ gameRuntime.state.healBonus+=4; gameRuntime.state.shield=Math.min(8,gameRuntime.state.shield+1); gameRuntime.state.hp=gameRuntime.clamp(gameRuntime.state.hp+18,0,gameRuntime.state.maxHp); } },
        { emoji:"🔮", title:"마법구 강화", desc:"기본 무기 레벨 +1, 공격력과 탄속 증가", apply(){ gameRuntime.state.weaponLevel++; gameRuntime.state.attackPower+=5; gameRuntime.state.projectileSpeed+=0.35; } },
        { emoji:"🏹", title:"다중 발사", desc:"한 번에 발사하는 마법구 수 증가", apply(){ gameRuntime.state.weaponLevel++; gameRuntime.state.weaponSpread=Math.min(5,gameRuntime.state.weaponSpread+1); gameRuntime.state.attackPower+=2; } },
        { emoji:"💥", title:"관통 마법", desc:"마법구가 몬스터를 더 많이 관통", apply(){ gameRuntime.state.weaponLevel++; gameRuntime.state.weaponPierce=Math.min(4,gameRuntime.state.weaponPierce+1); gameRuntime.state.attackPower+=3; } },
        { emoji:"⚡", title:"연사 강화", desc:"공격 간격 감소, 탄속 증가", apply(){ gameRuntime.state.weaponLevel++; gameRuntime.state.fireRate=Math.max(175,gameRuntime.state.fireRate-42); gameRuntime.state.projectileSpeed+=0.22; } },
        { emoji:"🪐", title:"회전 위성", desc:"캐릭터 주변을 도는 수학 위성 추가 또는 강화", apply(){ gameRuntime.state.satelliteLevel=Math.min(5,gameRuntime.state.satelliteLevel+1); gameRuntime.state.weaponLevel++; } },
        { emoji:"📏", title:"수학 레이저", desc:"가장 가까운 적을 향해 긴 직선 레이저 발사", apply(){ gameRuntime.state.laserLevel=Math.min(4,gameRuntime.state.laserLevel+1); gameRuntime.state.weaponLevel++; gameRuntime.state.attackPower+=2; } },
        { emoji:"📋", title:"부메랑 칠판", desc:"앞뒤로 돌아오는 칠판 무기 추가 또는 강화", apply(){ gameRuntime.state.boomerangLevel=Math.min(4,gameRuntime.state.boomerangLevel+1); gameRuntime.state.weaponLevel++; } },
        { emoji:"✏️", title:"분필 비", desc:"하늘에서 분필이 떨어져 여러 적을 공격", apply(){ gameRuntime.state.chalkRainLevel=Math.min(4,gameRuntime.state.chalkRainLevel+1); gameRuntime.state.weaponLevel++; } },
        { emoji:"🦉", title:"수학요정 강화", desc:"따라다니는 펫의 공격 속도와 공격력 증가", apply(){ gameRuntime.state.petLevel=Math.min(5,gameRuntime.state.petLevel+1); gameRuntime.state.weaponLevel++; } }
      ];
      return [...options, ...gameRuntime.v2.upgrades()].sort(() => Math.random() - 0.5).slice(0, 3);
    }

function chooseUpgrade(option) {
      option.apply();
      gameRuntime.state.levelUpQueue--;
      gameRuntime.state.levelUpPending = false;
      gameRuntime.levelUpPanel.classList.remove("show");
      gameRuntime.updateWeaponInfo();
      if (gameRuntime.state.weaponLevel >= 3) gameRuntime.unlockAchievement("weapon3", "무기 레벨 3");
      if (gameRuntime.state.level >= 5) gameRuntime.unlockAchievement("level5", "레벨 5");
      gameRuntime.sfx("correct");
      gameRuntime.showToast(`${option.title} 선택! 더 강해졌습니다.`);
      if (gameRuntime.state.levelUpQueue > 0) {
        gameRuntime.openLevelUpPanel();
      } else {
        gameRuntime.state.paused = false;
      }
    }

function spawnExpDrops(x, y, totalValue, count = 1) {
      const pieces = Math.max(1, count);
      for (let i = 0; i < pieces; i++) {
        const a = gameRuntime.rand(0, Math.PI * 2);
        const spread = gameRuntime.rand(12, 42);
        const value = Math.max(1, Math.round(totalValue / pieces));
        gameRuntime.expDrops.push({
          x: gameRuntime.clamp(x + Math.cos(a) * spread, 30, gameRuntime.state.worldW - 30),
          y: gameRuntime.clamp(y + Math.sin(a) * spread, 30, gameRuntime.state.worldH - 30),
          vx: Math.cos(a) * gameRuntime.rand(0.5, 1.8),
          vy: Math.sin(a) * gameRuntime.rand(0.5, 1.8),
          r: 9 + Math.min(7, value * 0.18),
          value,
          life: 17000,
          pulse: Math.random() * 6,
          color: value >= 25 ? "#fef08a" : value >= 10 ? "#86efac" : "#93c5fd"
        });
      }
    }

function collectExpDrop(drop) {
      drop.collected = true;
      gameRuntime.state.exp += drop.value;
      gameRuntime.scorePlus(6 + drop.value);
      gameRuntime.floatingTexts.push({
        x: drop.x,
        y: drop.y - 20,
        text: `EXP +${drop.value}`,
        life: 46,
        color: drop.color
      });
      gameRuntime.burst(drop.x, drop.y, drop.color, 10, 2.8);
      gameRuntime.playTone(760 + Math.min(400, drop.value * 8), .045, "triangle", .07);
      gameRuntime.checkLevelUp();
    }

function spawnItem(x = null, y = null, forcedType = null) {
      const keys = Object.keys(gameRuntime.itemTypes);
      const type = forcedType || keys[gameRuntime.randint(0, keys.length - 1)];
      const spec = gameRuntime.itemTypes[type];
      const p = x == null ? gameRuntime.randomVisiblePoint() : {x, y};
      gameRuntime.items.push({
        type,
        x: gameRuntime.clamp(p.x, 42, gameRuntime.state.worldW - 42),
        y: gameRuntime.clamp(p.y, 42, gameRuntime.state.worldH - 42),
        r: 20,
        born: gameRuntime.gameNow(),
        life: 15500,
        pulse: Math.random() * 6,
        color: spec.color,
        icon: spec.icon,
        name: spec.name
      });
    }

function applyItem(item, now) {
      gameRuntime.itemTypes[item.type].apply(now);
      gameRuntime.updateMission("collect", 1);
      gameRuntime.burst(item.x, item.y, item.color, 22, 3.4);
      gameRuntime.floatingTexts.push({ x: item.x, y: item.y - 28, text: item.name, life: 55, color: item.color });
    }

function shoot(now) {
      const effectiveFireRate = now < gameRuntime.state.feverUntil ? gameRuntime.state.fireRate * 0.58 : gameRuntime.state.fireRate;
      if (now - gameRuntime.state.lastShot < effectiveFireRate) return;
      if (gameRuntime.enemies.length === 0) return;
      gameRuntime.state.lastShot = now;

      let target = gameRuntime.enemies[0], best = Infinity;
      for (const e of gameRuntime.enemies) {
        const d = gameRuntime.distance(gameRuntime.player, e);
        if (d < best) { best = d; target = e; }
      }

      const powerMul = now < gameRuntime.state.rainbowUntil ? 1.22 : 1;
      const baseAng = Math.atan2(target.y - gameRuntime.player.y, target.x - gameRuntime.player.x);
      const count = gameRuntime.state.weaponSpread;
      const gap = 0.17;
      for (let i = 0; i < count; i++) {
        const offset = (i - (count - 1) / 2) * gap;
        const ang = baseAng + offset;
        gameRuntime.projectiles.push({
          kind: "orb",
          x: gameRuntime.player.x, y: gameRuntime.player.y,
          vx: Math.cos(ang) * gameRuntime.state.projectileSpeed,
          vy: Math.sin(ang) * gameRuntime.state.projectileSpeed,
          r: 6 + Math.min(3, gameRuntime.state.weaponLevel * 0.28),
          damage: gameRuntime.state.attackPower * powerMul,
          life: 86,
          pierce: gameRuntime.state.weaponPierce,
          color: "#fef08a"
        });
      }
      gameRuntime.playTone(520 + gameRuntime.state.weaponLevel * 18, .045, "square", .045);
    }

function fireLaser(now) {
      if (gameRuntime.state.laserLevel <= 0 || gameRuntime.enemies.length === 0) return;
      const delay = Math.max(1150, 3600 - gameRuntime.state.laserLevel * 420);
      if (now - gameRuntime.state.lastLaser < delay) return;
      gameRuntime.state.lastLaser = now;

      let target = gameRuntime.enemies[0], best = Infinity;
      for (const e of gameRuntime.enemies) {
        const d = gameRuntime.distance(gameRuntime.player, e);
        if (d < best) { best = d; target = e; }
      }

      const ang = Math.atan2(target.y - gameRuntime.player.y, target.x - gameRuntime.player.x);
      const length = 760 + gameRuntime.state.laserLevel * 80;
      const damage = 62 + gameRuntime.state.laserLevel * 24;

      gameRuntime.projectiles.push({
        kind: "laser",
        x: gameRuntime.player.x, y: gameRuntime.player.y,
        angle: ang,
        length,
        r: 12 + gameRuntime.state.laserLevel * 2,
        damage,
        life: 16,
        color: "#93c5fd"
      });

      for (const e of gameRuntime.enemies) {
        const dx = e.x - gameRuntime.player.x;
        const dy = e.y - gameRuntime.player.y;
        const along = dx * Math.cos(ang) + dy * Math.sin(ang);
        const side = Math.abs(-dx * Math.sin(ang) + dy * Math.cos(ang));
        if (along > 0 && along < length && side < 28 + gameRuntime.state.laserLevel * 4) {
          e.hp -= damage;
        }
      }
      gameRuntime.sfx("speed");
    }

function fireBoomerang(now) {
      if (gameRuntime.state.boomerangLevel <= 0) return;
      const delay = Math.max(1250, 3600 - gameRuntime.state.boomerangLevel * 380);
      if (now - gameRuntime.state.lastBoomerang < delay) return;
      gameRuntime.state.lastBoomerang = now;

      const dir = Math.atan2(
        (gameRuntime.keys["ArrowDown"] || gameRuntime.keys["s"] ? 1 : 0) - (gameRuntime.keys["ArrowUp"] || gameRuntime.keys["w"] ? 1 : 0),
        (gameRuntime.keys["ArrowRight"] || gameRuntime.keys["d"] ? 1 : 0) - (gameRuntime.keys["ArrowLeft"] || gameRuntime.keys["a"] ? 1 : 0)
      );
      const angle = Number.isFinite(dir) ? dir : gameRuntime.rand(0, Math.PI * 2);
      gameRuntime.projectiles.push({
        kind: "boomerang",
        x: gameRuntime.player.x, y: gameRuntime.player.y,
        ox: gameRuntime.player.x, oy: gameRuntime.player.y,
        angle,
        speed: 7.4 + gameRuntime.state.boomerangLevel * 0.55,
        t: 0,
        r: 16 + gameRuntime.state.boomerangLevel * 2,
        damage: 36 + gameRuntime.state.boomerangLevel * 12,
        life: 95,
        pierce: 99,
        color: "#fbbf24"
      });
      gameRuntime.sfx("item");
    }

function fireChalkRain(now) {
      if (gameRuntime.state.chalkRainLevel <= 0) return;
      const delay = Math.max(1550, 4300 - gameRuntime.state.chalkRainLevel * 460);
      if (now - gameRuntime.state.lastChalkRain < delay) return;
      gameRuntime.state.lastChalkRain = now;

      const count = 4 + gameRuntime.state.chalkRainLevel * 2;
      for (let i = 0; i < count; i++) {
        const p = gameRuntime.randomPointAroundPlayer(80, 420);
        gameRuntime.projectiles.push({
          kind: "chalk",
          x: p.x + gameRuntime.rand(-60, 60),
          y: p.y - 330,
          vx: gameRuntime.rand(-0.8, 0.8),
          vy: 8 + gameRuntime.rand(0, 2),
          r: 7,
          damage: 26 + gameRuntime.state.chalkRainLevel * 8,
          life: 62,
          pierce: 1,
          color: "#f8fafc"
        });
      }
      gameRuntime.sfx("dash");
    }

function burst(x, y, color, count = 20, speed = 3) {
      count = gameRuntime.v2?.settings.reduced ? 0 : gameRuntime.v2?.settings.low ? Math.min(count, 5) : count;
      for (let i = 0; i < count; i++) {
        const a = gameRuntime.rand(0, Math.PI * 2);
        const s = gameRuntime.rand(0.7, speed);
        gameRuntime.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: gameRuntime.rand(1.5, 4.5), life: gameRuntime.randint(18, 45), color });
      }
    }

function explode(x, y, radius, damage, big) {
      gameRuntime.burst(x, y, big ? "#facc15" : "#93c5fd", big ? 54 : 24, big ? 6 : 4);
      for (const e of gameRuntime.enemies) {
        const d = Math.hypot(e.x - x, e.y - y);
        if (d < radius) e.hp -= damage * (1 - d / radius * 0.35);
      }
    }
return { giveChestReward, expNeed, checkLevelUp, upgradeOptions, chooseUpgrade, spawnExpDrops, collectExpDrop, spawnItem, applyItem, shoot, fireLaser, fireBoomerang, fireChalkRain, burst, explode };
}
