// Extracted from upstream. Cross-system state is supplied by the shared runtime.
import {drawSprite,CHARACTER_GEAR} from './sprites.js';
export function createSystem(gameRuntime) {
function makePortals() {
      gameRuntime.portals = [];
      const colors = ["#f0abfc", "#67e8f9", "#fde047"];
      for (let i = 0; i < 3; i++) {
        const a = { x: gameRuntime.rand(180, gameRuntime.state.worldW - 180), y: gameRuntime.rand(180, gameRuntime.state.worldH - 180), color: colors[i], pair: i * 2 + 1, pulse: gameRuntime.rand(0, 6) };
        const b = { x: gameRuntime.rand(180, gameRuntime.state.worldW - 180), y: gameRuntime.rand(180, gameRuntime.state.worldH - 180), color: colors[i], pair: i * 2, pulse: gameRuntime.rand(0, 6) };
        gameRuntime.portals.push(a, b);
      }
    }

function checkPortals(now) {
      gameRuntime.state.portalCooldown = Math.max(0, gameRuntime.state.portalCooldown - (1000 / 60));
      if (gameRuntime.state.portalCooldown > 0) return;
      for (let i = 0; i < gameRuntime.portals.length; i++) {
        const p = gameRuntime.portals[i];
        if (Math.hypot(gameRuntime.player.x - p.x, gameRuntime.player.y - p.y) < 36) {
          const target = gameRuntime.portals[p.pair];
          if (!target) return;
          gameRuntime.player.x = gameRuntime.clamp(target.x + gameRuntime.rand(-55,55), gameRuntime.player.r, gameRuntime.state.worldW - gameRuntime.player.r);
          gameRuntime.player.y = gameRuntime.clamp(target.y + gameRuntime.rand(-55,55), gameRuntime.player.r, gameRuntime.state.worldH - gameRuntime.player.r);
          gameRuntime.player.invincible = Math.max(gameRuntime.player.invincible, 900);
          gameRuntime.state.portalCooldown = 1100;
          gameRuntime.updateCamera();
          gameRuntime.burst(gameRuntime.player.x, gameRuntime.player.y, p.color, 42, 5);
          gameRuntime.showToast("포털 이동! 새로운 위치로 순간이동했습니다.");
          gameRuntime.sfx("dash");
          return;
        }
      }
    }

function spawnBoss() {
      const p = gameRuntime.randomPointAroundPlayer(650, 820);
      const names = ["구구단 골렘", "분수 드래곤", "도형 마왕"];
      gameRuntime.enemies.push({
        x: p.x, y: p.y,
        r: 45,
        hp: 420 + gameRuntime.state.level * 55 + gameRuntime.state.bossIndex * 120,
        maxHp: 420 + gameRuntime.state.level * 55 + gameRuntime.state.bossIndex * 120,
        speed: 0.58 + gameRuntime.state.bossIndex * 0.06,
        damage: 18 + gameRuntime.state.bossIndex * 2,
        elite: true,
        tiny: false,
        boss: true,
        name: names[({forest:0,desert:1,library:2})[gameRuntime.state.currentMapKey]],
        bossType: gameRuntime.state.currentMapKey, nextPattern: gameRuntime.gameNow() + 1800, patternIndex: 0,
        wobble: Math.random() * 10
      });
      gameRuntime.state.bossIndex++;
      gameRuntime.showToast("⚠️ 수학 보스 등장! 무기와 아이템을 활용하세요!");
      gameRuntime.sfx("boom");
    }

function updatePet(now) {
      if (!gameRuntime.state.running || gameRuntime.state.paused) return;
      if (now - gameRuntime.state.lastPetShot < Math.max(520, 1150 - gameRuntime.state.petLevel * 120)) return;
      if (gameRuntime.enemies.length === 0) return;
      gameRuntime.state.lastPetShot = now;

      const pet = gameRuntime.petPosition(now);
      let target = gameRuntime.enemies[0], best = Infinity;
      for (const e of gameRuntime.enemies) {
        const d = Math.hypot(pet.x - e.x, pet.y - e.y);
        if (d < best) { best = d; target = e; }
      }
      const a = Math.atan2(target.y - pet.y, target.x - pet.x);
      gameRuntime.projectiles.push({
        kind: "pet",
        x: pet.x, y: pet.y,
        vx: Math.cos(a) * 8.4,
        vy: Math.sin(a) * 8.4,
        r: 5,
        damage: 12 + gameRuntime.state.petLevel * 5,
        life: 58,
        pierce: 0,
        color: "#f0abfc"
      });
    }

function petPosition(now) {
      return {
        x: gameRuntime.player.x - 54 + Math.sin(now / 420) * 8,
        y: gameRuntime.player.y - 42 + Math.cos(now / 360) * 7
      };
    }

function makeDecorations() {
      gameRuntime.decorations = [];
      gameRuntime.stars = [];
      const m = gameRuntime.state.map;
      for (let i = 0; i < (gameRuntime.v2?.settings.low ? 45 : 150); i++) {
        gameRuntime.decorations.push({
          x: gameRuntime.rand(80, gameRuntime.state.worldW - 80),
          y: gameRuntime.rand(80, gameRuntime.state.worldH - 80),
          icon: m.deco[gameRuntime.randint(0, m.deco.length - 1)],
          size: gameRuntime.randint(21, 36),
          alpha: gameRuntime.rand(0.35, 0.82),
          rot: gameRuntime.rand(-0.18, 0.18)
        });
      }
      for (let i = 0; i < (gameRuntime.v2?.settings.low ? 25 : 180); i++) {
        gameRuntime.stars.push({
          x: Math.random() * gameRuntime.state.worldW,
          y: Math.random() * gameRuntime.state.worldH,
          r: Math.random() * 1.7 + 0.3,
          a: Math.random() * 0.5 + 0.16,
          tw: Math.random() * 6
        });
      }
    }

function spawnEnemy() {
      if (gameRuntime.state.mode === "explore") return;
      const p = gameRuntime.randomPointAroundPlayer(520, 760);
      const t = gameRuntime.state.time;
      const elite = Math.random() < Math.min(0.18, 0.03 + t / 1050);
      const tiny = !elite && Math.random() < 0.14;
      gameRuntime.enemies.push({
        x: p.x, y: p.y,
        r: elite ? 21 : tiny ? 12 : 16,
        hp: elite ? 58 + gameRuntime.state.level * 7 : tiny ? 18 + gameRuntime.state.level * 3 : 30 + gameRuntime.state.level * 4,
        maxHp: elite ? 58 + gameRuntime.state.level * 7 : tiny ? 18 + gameRuntime.state.level * 3 : 30 + gameRuntime.state.level * 4,
        speed: ((elite ? 0.96 : tiny ? 1.55 : 1.25) + Math.min(0.78, t / 180)) * ({easy:.7,normal:1,hard:1.25})[gameRuntime.state.difficulty],
        damage: (elite ? 13 : tiny ? 5 : 8) * ({easy:.65,normal:1,hard:1.4})[gameRuntime.state.difficulty],
        elite, tiny,
        wobble: Math.random() * 10
      });
    }

function drawBackground(now) {
      const m = gameRuntime.state.map;
      gameRuntime.ctx.fillStyle = m.base;
      gameRuntime.ctx.fillRect(0, 0, gameRuntime.canvas.width, gameRuntime.canvas.height);

      for (const s of gameRuntime.stars) {
        if (!gameRuntime.isNearScreen(s.x, s.y, 20)) continue;
        s.tw = gameRuntime.v2.settings.reduced ? s.tw : now / 800;
        gameRuntime.ctx.globalAlpha = s.a + Math.sin(s.tw) * 0.05;
        gameRuntime.ctx.fillStyle = "#ffffff";
        gameRuntime.ctx.beginPath();
        gameRuntime.ctx.arc(gameRuntime.worldToScreenX(s.x), gameRuntime.worldToScreenY(s.y), s.r, 0, Math.PI * 2);
        gameRuntime.ctx.fill();
      }
      gameRuntime.ctx.globalAlpha = 1;

      gameRuntime.ctx.save();
      gameRuntime.ctx.strokeStyle = m.grid;
      gameRuntime.ctx.lineWidth = 1;
      const grid = 80;
      const startX = Math.floor(gameRuntime.state.cameraX / grid) * grid;
      const endX = gameRuntime.state.cameraX + gameRuntime.canvas.width + grid;
      const startY = Math.floor(gameRuntime.state.cameraY / grid) * grid;
      const endY = gameRuntime.state.cameraY + gameRuntime.canvas.height + grid;
      gameRuntime.ctx.beginPath();
      for (let x = startX; x < endX; x += grid) {
        gameRuntime.ctx.moveTo(x - gameRuntime.state.cameraX, 0);
        gameRuntime.ctx.lineTo(x - gameRuntime.state.cameraX, gameRuntime.canvas.height);
      }
      for (let y = startY; y < endY; y += grid) {
        gameRuntime.ctx.moveTo(0, y - gameRuntime.state.cameraY);
        gameRuntime.ctx.lineTo(gameRuntime.canvas.width, y - gameRuntime.state.cameraY);
      }
      gameRuntime.ctx.stroke();
      gameRuntime.ctx.restore();

      gameRuntime.ctx.save();
      for (const d of gameRuntime.decorations) {
        if (!gameRuntime.isNearScreen(d.x, d.y, 60)) continue;
        // Bake the rotated emoji once; moving the camera only copies the sprite.
        const scale=Math.min(2,gameRuntime.viewport.dpr);
        if(!d.sprite||d.spriteScale!==scale){
          const side=Math.ceil(d.size*2),sprite=document.createElement('canvas');
          sprite.width=sprite.height=Math.ceil(side*scale);
          const context=sprite.getContext('2d');context.scale(scale,scale);
          context.translate(side/2,side/2);context.rotate(d.rot);
          context.font=`${d.size}px Apple Color Emoji, Segoe UI Emoji, Jua, Malgun Gothic, sans-serif`;
          context.textAlign='center';context.textBaseline='middle';context.fillText(d.icon,0,0);
          d.sprite=sprite;d.spriteScale=scale;d.spriteSide=side;
        }
        gameRuntime.ctx.globalAlpha = d.alpha;
        gameRuntime.ctx.drawImage(d.sprite,gameRuntime.worldToScreenX(d.x)-d.spriteSide/2,gameRuntime.worldToScreenY(d.y)-d.spriteSide/2,d.spriteSide,d.spriteSide);
      }
      gameRuntime.ctx.restore();
      gameRuntime.ctx.globalAlpha = 1;

      // world border when visible
      gameRuntime.ctx.strokeStyle = "rgba(255,255,255,.28)";
      gameRuntime.ctx.lineWidth = 6;
      gameRuntime.ctx.strokeRect(-gameRuntime.state.cameraX, -gameRuntime.state.cameraY, gameRuntime.state.worldW, gameRuntime.state.worldH);
    }

function drawCutePlayer(now) {
      gameRuntime.ctx.save();
      gameRuntime.ctx.translate(gameRuntime.worldToScreenX(gameRuntime.player.x), gameRuntime.worldToScreenY(gameRuntime.player.y));

      if (gameRuntime.player.invincible > 0) gameRuntime.ctx.globalAlpha = gameRuntime.v2.settings.reduced ? 0.75 : 0.42 + Math.sin(now / 38) * 0.26;

      if (gameRuntime.state.shield > 0) {
        gameRuntime.ctx.strokeStyle = "rgba(125, 211, 252, .82)";
        gameRuntime.ctx.lineWidth = 5;
        gameRuntime.ctx.beginPath();
        gameRuntime.ctx.arc(0, 0, gameRuntime.player.r + 13 + Math.sin(now / 150) * 2, 0, Math.PI * 2);
        gameRuntime.ctx.stroke();

        gameRuntime.ctx.fillStyle = "#e0f2fe";
        gameRuntime.ctx.font = "900 15px Jua, Malgun Gothic, sans-serif";
        gameRuntime.ctx.textAlign = "center";
        gameRuntime.ctx.fillText("×" + gameRuntime.state.shield, 0, -39);
      }

      gameRuntime.ctx.fillStyle = ({explorer:"#f6b875",mage:"#a59dfb",guardian:"#65cdb5"})[gameRuntime.state.character] || "#60a5fa";
      gameRuntime.ctx.beginPath();
      gameRuntime.ctx.moveTo(-13, 15);
      gameRuntime.ctx.quadraticCurveTo(0, 31, 15, 15);
      gameRuntime.ctx.lineTo(8, 7);
      gameRuntime.ctx.lineTo(-8, 7);
      gameRuntime.ctx.closePath();
      gameRuntime.ctx.fill();

      gameRuntime.ctx.fillStyle = "#fbbf24";
      gameRuntime.ctx.beginPath();
      gameRuntime.ctx.arc(-14, -14, 9, 0, Math.PI * 2);
      gameRuntime.ctx.arc(14, -14, 9, 0, Math.PI * 2);
      gameRuntime.ctx.fill();

      gameRuntime.ctx.fillStyle = "#fde68a";
      gameRuntime.ctx.beginPath();
      gameRuntime.ctx.arc(-14, -14, 4.5, 0, Math.PI * 2);
      gameRuntime.ctx.arc(14, -14, 4.5, 0, Math.PI * 2);
      gameRuntime.ctx.fill();

      const grad = gameRuntime.ctx.createRadialGradient(-7, -8, 4, 0, 0, gameRuntime.player.r + 4);
      grad.addColorStop(0, "#fff7ed");
      grad.addColorStop(0.45, "#fcd34d");
      grad.addColorStop(1, "#f59e0b");
      gameRuntime.ctx.fillStyle = grad;
      gameRuntime.ctx.beginPath();
      gameRuntime.ctx.arc(0, 0, gameRuntime.player.r + 4, 0, Math.PI * 2);
      gameRuntime.ctx.fill();

      gameRuntime.ctx.fillStyle = gameRuntime.state.character === "guardian" ? "#0d9488" : gameRuntime.state.character === "explorer" ? "#c2853c" : "#7c3aed";
      gameRuntime.ctx.beginPath();
      gameRuntime.ctx.moveTo(-9, -22);
      gameRuntime.ctx.lineTo(0, -42);
      gameRuntime.ctx.lineTo(10, -22);
      gameRuntime.ctx.closePath();
      gameRuntime.ctx.fill();

      gameRuntime.ctx.fillStyle = "#fef3c7";
      gameRuntime.ctx.fillRect(-10, -24, 20, 5);

      const blink = Math.sin(gameRuntime.player.blink) > 0.96 ? 1 : 0;
      gameRuntime.ctx.strokeStyle = "#111827";
      gameRuntime.ctx.lineWidth = 2.4;
      if (blink) {
        gameRuntime.ctx.beginPath(); gameRuntime.ctx.moveTo(-8, -4); gameRuntime.ctx.lineTo(-3, -4); gameRuntime.ctx.stroke();
        gameRuntime.ctx.beginPath(); gameRuntime.ctx.moveTo(3, -4); gameRuntime.ctx.lineTo(8, -4); gameRuntime.ctx.stroke();
      } else {
        gameRuntime.ctx.fillStyle = "#111827";
        gameRuntime.ctx.beginPath();
        gameRuntime.ctx.arc(-7, -5, 3.2, 0, Math.PI * 2);
        gameRuntime.ctx.arc(7, -5, 3.2, 0, Math.PI * 2);
        gameRuntime.ctx.fill();

        gameRuntime.ctx.fillStyle = "#ffffff";
        gameRuntime.ctx.beginPath();
        gameRuntime.ctx.arc(-8, -6, 1.1, 0, Math.PI * 2);
        gameRuntime.ctx.arc(6, -6, 1.1, 0, Math.PI * 2);
        gameRuntime.ctx.fill();
      }

      gameRuntime.ctx.fillStyle = "rgba(244,114,182,.65)";
      gameRuntime.ctx.beginPath();
      gameRuntime.ctx.arc(-13, 3, 4, 0, Math.PI * 2);
      gameRuntime.ctx.arc(13, 3, 4, 0, Math.PI * 2);
      gameRuntime.ctx.fill();

      gameRuntime.ctx.strokeStyle = "#7c2d12";
      gameRuntime.ctx.lineWidth = 2.2;
      gameRuntime.ctx.beginPath();
      gameRuntime.ctx.arc(-3, 4, 4, 0.15, Math.PI - 0.15);
      gameRuntime.ctx.arc(3, 4, 4, 0.15, Math.PI - 0.15);
      gameRuntime.ctx.stroke();

      if (!drawSprite(gameRuntime.ctx,CHARACTER_GEAR[gameRuntime.state.character||'explorer'],28,-9,58)) {
      gameRuntime.ctx.strokeStyle = "#92400e";
      gameRuntime.ctx.lineWidth = 4;
      gameRuntime.ctx.beginPath();
      gameRuntime.ctx.moveTo(17, 10);
      gameRuntime.ctx.lineTo(28, -10);
      gameRuntime.ctx.stroke();

      gameRuntime.ctx.fillStyle = "#fde047";
      gameRuntime.ctx.beginPath();
      gameRuntime.ctx.arc(30, -13, 5, 0, Math.PI * 2);
      gameRuntime.ctx.fill();
      }

      gameRuntime.ctx.globalAlpha = 1;
      gameRuntime.ctx.restore();
    }

function drawEnemy(e, now) {
      const sx = gameRuntime.worldToScreenX(e.x), sy = gameRuntime.worldToScreenY(e.y);
      if (sx < -60 || sx > gameRuntime.canvas.width + 60 || sy < -60 || sy > gameRuntime.canvas.height + 60) return;

      gameRuntime.ctx.save();
      gameRuntime.ctx.translate(sx, sy);
      if (now < gameRuntime.state.freezeUntil) gameRuntime.ctx.globalAlpha = 0.72;

      if (e.boss) {
        gameRuntime.ctx.fillStyle = "rgba(250,204,21,.22)";
        gameRuntime.ctx.beginPath();
        gameRuntime.ctx.arc(0, 0, e.r + 18 + Math.sin(now/180)*4, 0, Math.PI * 2);
        gameRuntime.ctx.fill();
      }

      gameRuntime.ctx.fillStyle = e.boss ? gameRuntime.state.map.accent : e.elite ? "#ec725f" : e.tiny ? "#45bba0" : gameRuntime.state.map.accent2;
      gameRuntime.ctx.beginPath();
      gameRuntime.ctx.arc(0, 0, e.r, 0, Math.PI * 2);
      gameRuntime.ctx.fill();

      gameRuntime.ctx.fillStyle = e.elite ? "#fecaca" : "#c4b5fd";
      gameRuntime.ctx.beginPath();
      gameRuntime.ctx.moveTo(-e.r * 0.7, -e.r * 0.55);
      gameRuntime.ctx.lineTo(-e.r * 0.35, -e.r * 1.15);
      gameRuntime.ctx.lineTo(-e.r * 0.05, -e.r * 0.55);
      gameRuntime.ctx.moveTo(e.r * 0.7, -e.r * 0.55);
      gameRuntime.ctx.lineTo(e.r * 0.35, -e.r * 1.15);
      gameRuntime.ctx.lineTo(e.r * 0.05, -e.r * 0.55);
      gameRuntime.ctx.fill();

      gameRuntime.ctx.fillStyle = e.elite ? "#fecaca" : "#ddd6fe";
      gameRuntime.ctx.beginPath();
      gameRuntime.ctx.arc(-e.r * 0.32, -e.r * 0.18, e.r * 0.17, 0, Math.PI * 2);
      gameRuntime.ctx.arc(e.r * 0.32, -e.r * 0.18, e.r * 0.17, 0, Math.PI * 2);
      gameRuntime.ctx.fill();

      gameRuntime.ctx.fillStyle = "#111827";
      gameRuntime.ctx.beginPath();
      gameRuntime.ctx.arc(-e.r * 0.32, -e.r * 0.18, e.r * 0.07, 0, Math.PI * 2);
      gameRuntime.ctx.arc(e.r * 0.32, -e.r * 0.18, e.r * 0.07, 0, Math.PI * 2);
      gameRuntime.ctx.fill();

      gameRuntime.ctx.fillStyle = "#fee2e2";
      gameRuntime.ctx.beginPath();
      gameRuntime.ctx.moveTo(-5, 5); gameRuntime.ctx.lineTo(-1, 12); gameRuntime.ctx.lineTo(2, 5); gameRuntime.ctx.lineTo(5, 12); gameRuntime.ctx.lineTo(8, 5);
      gameRuntime.ctx.fill();

      if (e.boss) {
        gameRuntime.ctx.fillStyle = "#facc15";
        gameRuntime.ctx.font = "900 26px Apple Color Emoji, Segoe UI Emoji, Jua, Malgun Gothic, sans-serif";
        gameRuntime.ctx.textAlign = "center";
        gameRuntime.ctx.fillText(({forest:"🗿",desert:"🐉",library:"👾"})[gameRuntime.state.currentMapKey], 0, -e.r - 18);
        gameRuntime.ctx.font = "900 14px Jua, Malgun Gothic, sans-serif";
        gameRuntime.ctx.strokeStyle = "rgba(0,0,0,.7)";
        gameRuntime.ctx.lineWidth = 4;
        gameRuntime.ctx.strokeText(e.name, 0, e.r + 24);
        gameRuntime.ctx.fillStyle = "#fff7ed";
        gameRuntime.ctx.fillText(e.name, 0, e.r + 24);
      }

      if (now < gameRuntime.state.freezeUntil) {
        gameRuntime.ctx.fillStyle = "rgba(191, 219, 254, .55)";
        gameRuntime.ctx.beginPath();
        gameRuntime.ctx.arc(0, 0, e.r + 4, 0, Math.PI * 2);
        gameRuntime.ctx.fill();
      }
      gameRuntime.ctx.restore();

      const w = e.r * 2;
      gameRuntime.ctx.fillStyle = "rgba(0,0,0,.35)";
      gameRuntime.ctx.fillRect(sx - e.r, sy - e.r - 10, w, 5);
      gameRuntime.ctx.fillStyle = e.elite ? "#fb7185" : e.tiny ? "#34d399" : "#a78bfa";
      gameRuntime.ctx.fillRect(sx - e.r, sy - e.r - 10, w * gameRuntime.clamp(e.hp / e.maxHp, 0, 1), 5);
    }

function drawPet(now) {
      const pet = gameRuntime.petPosition(now);
      const sx = gameRuntime.worldToScreenX(pet.x), sy = gameRuntime.worldToScreenY(pet.y);
      gameRuntime.ctx.save();
      gameRuntime.ctx.translate(sx, sy);
      gameRuntime.ctx.fillStyle = "#c4b5fd";
      gameRuntime.ctx.beginPath();
      gameRuntime.ctx.arc(0, 0, 14, 0, Math.PI * 2);
      gameRuntime.ctx.fill();
      gameRuntime.ctx.fillStyle = "#fef3c7";
      gameRuntime.ctx.beginPath();
      gameRuntime.ctx.arc(-5, -2, 4, 0, Math.PI * 2);
      gameRuntime.ctx.arc(5, -2, 4, 0, Math.PI * 2);
      gameRuntime.ctx.fill();
      gameRuntime.ctx.fillStyle = "#111827";
      gameRuntime.ctx.beginPath();
      gameRuntime.ctx.arc(-5, -2, 1.4, 0, Math.PI * 2);
      gameRuntime.ctx.arc(5, -2, 1.4, 0, Math.PI * 2);
      gameRuntime.ctx.fill();
      gameRuntime.ctx.fillStyle = "#facc15";
      gameRuntime.ctx.beginPath();
      gameRuntime.ctx.moveTo(0, 2);
      gameRuntime.ctx.lineTo(-4, 7);
      gameRuntime.ctx.lineTo(4, 7);
      gameRuntime.ctx.closePath();
      gameRuntime.ctx.fill();
      gameRuntime.ctx.font = "900 11px Jua, Malgun Gothic, sans-serif";
      gameRuntime.ctx.fillStyle = "#fff";
      gameRuntime.ctx.textAlign = "center";
      gameRuntime.ctx.strokeStyle = "rgba(0,0,0,.55)";
      gameRuntime.ctx.lineWidth = 3;
      gameRuntime.ctx.strokeText("요정 Lv." + gameRuntime.state.petLevel, 0, -22);
      gameRuntime.ctx.fillText("요정 Lv." + gameRuntime.state.petLevel, 0, -22);
      gameRuntime.ctx.restore();
    }

function drawMiniMap() {
      if(gameRuntime.canvas.height<220)return;
      const w = Math.min(156,gameRuntime.canvas.width*.2), h = Math.min(104,gameRuntime.canvas.height*.2), x = gameRuntime.canvas.width - w - 16, y = gameRuntime.canvas.height - h - 16;
      gameRuntime.ctx.save();
      gameRuntime.ctx.globalAlpha = 0.86;
      gameRuntime.ctx.fillStyle = "rgba(15,23,42,.78)";
      gameRuntime.ctx.fillRect(x, y, w, h);
      gameRuntime.ctx.strokeStyle = "rgba(255,255,255,.35)";
      gameRuntime.ctx.lineWidth = 2;
      gameRuntime.ctx.strokeRect(x, y, w, h);

      const px = x + (gameRuntime.player.x / gameRuntime.state.worldW) * w;
      const py = y + (gameRuntime.player.y / gameRuntime.state.worldH) * h;
      gameRuntime.ctx.fillStyle = "#facc15";
      gameRuntime.ctx.beginPath(); gameRuntime.ctx.arc(px, py, 4.5, 0, Math.PI * 2); gameRuntime.ctx.fill();

      gameRuntime.ctx.fillStyle = "#fb7185";
      gameRuntime.enemies.slice(0, 50).forEach(e => {
        gameRuntime.ctx.fillRect(x + (e.x / gameRuntime.state.worldW) * w - 1, y + (e.y / gameRuntime.state.worldH) * h - 1, 2, 2);
      });

      gameRuntime.ctx.strokeStyle = "#93c5fd";
      gameRuntime.ctx.lineWidth = 1;
      gameRuntime.ctx.strokeRect(x + (gameRuntime.state.cameraX / gameRuntime.state.worldW) * w, y + (gameRuntime.state.cameraY / gameRuntime.state.worldH) * h,
                     (gameRuntime.canvas.width / gameRuntime.state.worldW) * w, (gameRuntime.canvas.height / gameRuntime.state.worldH) * h);
      gameRuntime.ctx.restore();
    }

function draw() {
      const now = gameRuntime.gameNow();
      gameRuntime.ctx.setTransform(gameRuntime.viewport.dpr,0,0,gameRuntime.viewport.dpr,0,0);
      gameRuntime.drawBackground(now);
      gameRuntime.v2.draw(now);

      for (const drop of gameRuntime.expDrops) {
        if (!gameRuntime.isNearScreen(drop.x, drop.y, 70)) continue;
        const sx = gameRuntime.worldToScreenX(drop.x), sy = gameRuntime.worldToScreenY(drop.y);
        const pulse = Math.sin(drop.pulse) * 3.5;
        const fade = drop.life < 2500 ? 0.48 + Math.sin(now / 75) * 0.32 : 1;

        gameRuntime.ctx.save();
        gameRuntime.ctx.globalAlpha = fade;
        gameRuntime.ctx.fillStyle = "rgba(255,255,255,.18)";
        gameRuntime.ctx.beginPath();
        gameRuntime.ctx.arc(sx, sy, drop.r + 9 + pulse, 0, Math.PI * 2);
        gameRuntime.ctx.fill();

        const grad = gameRuntime.ctx.createRadialGradient(sx - 4, sy - 5, 2, sx, sy, drop.r + 5);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.42, drop.color);
        grad.addColorStop(1, "rgba(34,197,94,.08)");
        gameRuntime.ctx.fillStyle = grad;
        gameRuntime.ctx.beginPath();
        gameRuntime.ctx.arc(sx, sy, drop.r + pulse * 0.25, 0, Math.PI * 2);
        gameRuntime.ctx.fill();

        gameRuntime.ctx.strokeStyle = "rgba(255,255,255,.78)";
        gameRuntime.ctx.lineWidth = 2.5;
        gameRuntime.ctx.stroke();

        gameRuntime.ctx.fillStyle = "#064e3b";
        gameRuntime.ctx.font = "900 11px Jua, Malgun Gothic, sans-serif";
        gameRuntime.ctx.textAlign = "center";
        gameRuntime.ctx.textBaseline = "middle";
        gameRuntime.ctx.fillText("EXP", sx, sy + 1);
        gameRuntime.ctx.restore();
      }

      for (const item of gameRuntime.items) {
        if (!gameRuntime.isNearScreen(item.x, item.y, 70)) continue;
        const spec = gameRuntime.itemTypes[item.type];
        const sx = gameRuntime.worldToScreenX(item.x), sy = gameRuntime.worldToScreenY(item.y);
        const pulse = Math.sin(item.pulse) * 4;
        const fade = item.life < 2500 ? 0.45 + Math.sin(now / 80) * 0.35 : 1;

        gameRuntime.ctx.save();
        gameRuntime.ctx.globalAlpha = fade;
        gameRuntime.ctx.fillStyle = spec.color + "55";
        gameRuntime.ctx.beginPath();
        gameRuntime.ctx.arc(sx, sy, item.r + 10 + pulse, 0, Math.PI * 2);
        gameRuntime.ctx.fill();

        gameRuntime.ctx.fillStyle = "rgba(255,255,255,.90)";
        gameRuntime.ctx.beginPath();
        gameRuntime.ctx.arc(sx, sy, item.r + 4, 0, Math.PI * 2);
        gameRuntime.ctx.fill();

        gameRuntime.ctx.strokeStyle = spec.color;
        gameRuntime.ctx.lineWidth = 4;
        gameRuntime.ctx.stroke();

        gameRuntime.ctx.font = "900 25px Apple Color Emoji, Segoe UI Emoji, Jua, Malgun Gothic, sans-serif";
        gameRuntime.ctx.textAlign = "center";
        gameRuntime.ctx.textBaseline = "middle";
        gameRuntime.ctx.fillStyle = "#111827";
        if(!drawSprite(gameRuntime.ctx,spec.sprite,sx,sy+1,52))gameRuntime.ctx.fillText(spec.icon, sx, sy + 1);

        gameRuntime.ctx.font = "900 12px Jua, Malgun Gothic, sans-serif";
        gameRuntime.ctx.fillStyle = "#ffffff";
        gameRuntime.ctx.strokeStyle = "rgba(0,0,0,.55)";
        gameRuntime.ctx.lineWidth = 4;
        gameRuntime.ctx.strokeText(spec.name, sx, sy + 38);
        gameRuntime.ctx.fillText(spec.name, sx, sy + 38);
        gameRuntime.ctx.restore();
      }

      for (const orb of gameRuntime.answerOrbs) {
        if (!gameRuntime.isNearScreen(orb.x, orb.y, 80)) continue;
        const sx = gameRuntime.worldToScreenX(orb.x), sy = gameRuntime.worldToScreenY(orb.y);
        const hint = gameRuntime.gameNow() < gameRuntime.state.hintUntil && orb.correct;
        const pulse = gameRuntime.v2.settings.reduced ? 0 : Math.sin(orb.pulse) * (hint ? 7 : 4);

        gameRuntime.ctx.fillStyle = hint ? "rgba(250,204,21,.25)" : "rgba(56,189,248,.20)";
        gameRuntime.ctx.beginPath();
        gameRuntime.ctx.arc(sx, sy, orb.r + 12 + pulse, 0, Math.PI * 2);
        gameRuntime.ctx.fill();

        const grad = gameRuntime.ctx.createRadialGradient(sx - 10, sy - 10, 4, sx, sy, orb.r);
        grad.addColorStop(0, "#ffffff");
        grad.addColorStop(0.35, hint ? "#fde68a" : "#bae6fd");
        grad.addColorStop(1, hint ? "#f59e0b" : "#38bdf8");
        gameRuntime.ctx.fillStyle = grad;
        gameRuntime.ctx.beginPath();
        gameRuntime.ctx.arc(sx, sy, orb.r + pulse * 0.3, 0, Math.PI * 2);
        gameRuntime.ctx.fill();

        gameRuntime.ctx.strokeStyle = hint ? "#fef3c7" : "rgba(255,255,255,.82)";
        gameRuntime.ctx.lineWidth = hint ? 5 : 3;
        gameRuntime.ctx.stroke();

        gameRuntime.ctx.fillStyle = "#082f49";
        const labelKey=`${orb.value}:${orb.r}:${gameRuntime.v2.settings.font}`;
        if(orb.labelKey!==labelKey){
          let size=Math.max(16,Math.min(24*gameRuntime.v2.settings.font,orb.r*.85));
          gameRuntime.ctx.font=`${size}px Jua, Malgun Gothic, sans-serif`;
          while(size>16&&gameRuntime.ctx.measureText(orb.value).width>orb.r*1.8){size=Math.max(16,size-1);gameRuntime.ctx.font=`${size}px Jua, Malgun Gothic, sans-serif`;}
          orb.labelSize=size;orb.labelKey=labelKey;
        }
        gameRuntime.ctx.font = `${orb.labelSize}px Jua, Malgun Gothic, sans-serif`;
        gameRuntime.ctx.textAlign = "center";
        gameRuntime.ctx.textBaseline = "middle";
        gameRuntime.ctx.fillText(orb.value, sx, sy);

        if (hint) {
          gameRuntime.ctx.font = "900 13px Jua, Malgun Gothic, sans-serif";
          gameRuntime.ctx.fillStyle = "#fff7ed";
          gameRuntime.ctx.strokeStyle = "rgba(0,0,0,.55)";
          gameRuntime.ctx.lineWidth = 4;
          gameRuntime.ctx.strokeText("힌트", sx, sy - 44);
          gameRuntime.ctx.fillText("힌트", sx, sy - 44);
        }
      }

      for (const e of gameRuntime.enemies) gameRuntime.drawEnemy(e, now);

      for (const p of gameRuntime.projectiles) {
        const sx = gameRuntime.worldToScreenX(p.x), sy = gameRuntime.worldToScreenY(p.y);
        if (p.kind === "laser") {
          gameRuntime.ctx.save();
          gameRuntime.ctx.translate(sx, sy);
          gameRuntime.ctx.rotate(p.angle);
          gameRuntime.ctx.globalAlpha = Math.min(1, p.life / 10);
          gameRuntime.ctx.strokeStyle = "rgba(147,197,253,.35)";
          gameRuntime.ctx.lineWidth = p.r * 2.5;
          gameRuntime.ctx.beginPath(); gameRuntime.ctx.moveTo(0, 0); gameRuntime.ctx.lineTo(p.length, 0); gameRuntime.ctx.stroke();
          gameRuntime.ctx.strokeStyle = "#dbeafe";
          gameRuntime.ctx.lineWidth = p.r;
          gameRuntime.ctx.beginPath(); gameRuntime.ctx.moveTo(0, 0); gameRuntime.ctx.lineTo(p.length, 0); gameRuntime.ctx.stroke();
          gameRuntime.ctx.restore();
          gameRuntime.ctx.globalAlpha = 1;
          continue;
        }

        if (!gameRuntime.isNearScreen(p.x, p.y, 120)) continue;
        if (p.kind === "boomerang") {
          if(drawSprite(gameRuntime.ctx,'math-boomerang',sx,sy,p.r*3.2,gameRuntime.v2.settings.reduced?0:now/95))continue;
          gameRuntime.ctx.save();
          gameRuntime.ctx.translate(sx, sy);
          gameRuntime.ctx.rotate(gameRuntime.v2.settings.reduced ? 0 : now / 95);
          gameRuntime.ctx.fillStyle = "#fbbf24";
          gameRuntime.ctx.fillRect(-p.r, -p.r * 0.45, p.r * 2, p.r * 0.9);
          gameRuntime.ctx.fillStyle = "#111827";
          gameRuntime.ctx.font = "900 14px Jua, Malgun Gothic, sans-serif";
          gameRuntime.ctx.textAlign = "center";
          gameRuntime.ctx.textBaseline = "middle";
          gameRuntime.ctx.fillText("÷", 0, 0);
          gameRuntime.ctx.restore();
        } else if (p.kind === "chalk") {
          if(drawSprite(gameRuntime.ctx,'pencil-sword',sx,sy,36))continue;
          gameRuntime.ctx.strokeStyle = "#f8fafc";
          gameRuntime.ctx.lineWidth = 5;
          gameRuntime.ctx.beginPath();
          gameRuntime.ctx.moveTo(sx, sy - 10);
          gameRuntime.ctx.lineTo(sx + 6, sy + 10);
          gameRuntime.ctx.stroke();
        } else {
          const grad = gameRuntime.ctx.createRadialGradient(sx, sy, 1, sx, sy, p.r + 9);
          grad.addColorStop(0, "#ffffff");
          grad.addColorStop(0.45, p.color || "#fef08a");
          grad.addColorStop(1, "rgba(250,204,21,0)");
          gameRuntime.ctx.fillStyle = grad;
          gameRuntime.ctx.beginPath();
          gameRuntime.ctx.arc(sx, sy, p.r + 9, 0, Math.PI * 2);
          gameRuntime.ctx.fill();
        }
      }

      for (const pt of gameRuntime.particles) {
        if (!gameRuntime.isNearScreen(pt.x, pt.y, 60)) continue;
        gameRuntime.ctx.globalAlpha = gameRuntime.clamp(pt.life / 38, 0, 1);
        gameRuntime.ctx.fillStyle = pt.color;
        gameRuntime.ctx.beginPath();
        gameRuntime.ctx.arc(gameRuntime.worldToScreenX(pt.x), gameRuntime.worldToScreenY(pt.y), pt.r, 0, Math.PI * 2);
        gameRuntime.ctx.fill();
      }
      gameRuntime.ctx.globalAlpha = 1;

      if (gameRuntime.state.satelliteLevel > 0) {
        for (let i = 0; i < gameRuntime.state.satelliteLevel; i++) {
          const ang = gameRuntime.state.satelliteAngle + (Math.PI * 2 / gameRuntime.state.satelliteLevel) * i;
          const sx = gameRuntime.worldToScreenX(gameRuntime.player.x + Math.cos(ang) * 50);
          const sy = gameRuntime.worldToScreenY(gameRuntime.player.y + Math.sin(ang) * 50);
          const grad = gameRuntime.ctx.createRadialGradient(sx - 4, sy - 4, 2, sx, sy, 12);
          grad.addColorStop(0, "#ffffff");
          grad.addColorStop(0.45, "#a5b4fc");
          grad.addColorStop(1, "rgba(99,102,241,.15)");
          gameRuntime.ctx.fillStyle = grad;
          gameRuntime.ctx.beginPath();
          gameRuntime.ctx.arc(sx, sy, 12, 0, Math.PI * 2);
          gameRuntime.ctx.fill();
          gameRuntime.ctx.fillStyle = "#312e81";
          gameRuntime.ctx.font = "900 13px Jua, Malgun Gothic, sans-serif";
          gameRuntime.ctx.textAlign = "center";
          gameRuntime.ctx.textBaseline = "middle";
          gameRuntime.ctx.fillText("+", sx, sy);
        }
      }

      gameRuntime.drawPet(now);
      gameRuntime.drawCutePlayer(now);

      for (const ft of gameRuntime.floatingTexts) {
        if (!gameRuntime.isNearScreen(ft.x, ft.y, 60)) continue;
        gameRuntime.ctx.globalAlpha = gameRuntime.clamp(ft.life / 45, 0, 1);
        const sx = gameRuntime.worldToScreenX(ft.x), sy = gameRuntime.worldToScreenY(ft.y);
        gameRuntime.ctx.font = "900 18px Jua, Malgun Gothic, sans-serif";
        gameRuntime.ctx.textAlign = "center";
        gameRuntime.ctx.strokeStyle = "rgba(0,0,0,.65)";
        gameRuntime.ctx.lineWidth = 5;
        gameRuntime.ctx.strokeText(ft.text, sx, sy);
        gameRuntime.ctx.fillStyle = ft.color;
        gameRuntime.ctx.fillText(ft.text, sx, sy);
      }
      gameRuntime.ctx.globalAlpha = 1;

      gameRuntime.drawMiniMap();

      if (!gameRuntime.state.running) {
        gameRuntime.ctx.save();
        gameRuntime.ctx.globalAlpha = 0.08;
        gameRuntime.ctx.fillStyle = "#ffffff";
        gameRuntime.ctx.font = "900 42px Jua, Malgun Gothic, sans-serif";
        gameRuntime.ctx.textAlign = "center";
        gameRuntime.ctx.fillText("매쓰 서바이벌", gameRuntime.canvas.width / 2, gameRuntime.canvas.height / 2);
        gameRuntime.ctx.restore();
      }

      if (gameRuntime.state.paused && !gameRuntime.state.levelUpPending) {
        gameRuntime.ctx.fillStyle = "rgba(0,0,0,.46)";
        gameRuntime.ctx.fillRect(0, 0, gameRuntime.canvas.width, gameRuntime.canvas.height);
        gameRuntime.ctx.fillStyle = "#fff";
        gameRuntime.ctx.textAlign = "center";
        gameRuntime.ctx.font = "900 54px Jua, Malgun Gothic, sans-serif";
        gameRuntime.ctx.fillText("일시정지", gameRuntime.canvas.width / 2, gameRuntime.canvas.height / 2);
        gameRuntime.ctx.font = "700 22px Jua, Malgun Gothic, sans-serif";
        gameRuntime.ctx.fillText("P 키를 누르면 계속합니다. 브금은 계속 유지됩니다.", gameRuntime.canvas.width / 2, gameRuntime.canvas.height / 2 + 44);
      }
    }
return { makePortals, checkPortals, spawnBoss, updatePet, petPosition, makeDecorations, spawnEnemy, drawBackground, drawCutePlayer, drawEnemy, drawPet, drawMiniMap, draw };
}
