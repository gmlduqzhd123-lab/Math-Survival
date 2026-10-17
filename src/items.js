// Original item registry, extracted without changing its rewards.
import {ITEM_SPRITES} from './sprites.js';
export function createItemTypes(gameRuntime){ const types = {
      heart: {
        icon: "❤️", name: "회복하트", color: "#fb7185",
        desc: "체력을 32 회복해요",
        apply(now) {
          gameRuntime.state.hp = gameRuntime.clamp(gameRuntime.state.hp + 32 + gameRuntime.state.healBonus, 0, gameRuntime.state.maxHp);
          gameRuntime.scorePlus(25);
          gameRuntime.showToast("회복하트! 체력이 넉넉하게 회복되었습니다.");
          gameRuntime.sfx("heal");
        }
      },
      shield: {
        icon: "🛡️", name: "보호막", color: "#38bdf8",
        desc: "공격을 막는 보호막 2개를 얻어요",
        apply(now) {
          gameRuntime.state.shield = Math.min(8, gameRuntime.state.shield + 2);
          gameRuntime.scorePlus(25);
          gameRuntime.showToast("보호막 획득! 더 안전해졌습니다.");
          gameRuntime.sfx("shield");
        }
      },
      freeze: {
        icon: "❄️", name: "시간얼음", color: "#67e8f9",
        desc: "몬스터를 잠깐 멈춰요",
        apply(now) {
          gameRuntime.state.freezeUntil = now + 5200;
          gameRuntime.showToast("시간얼음! 몬스터가 잠시 멈춥니다.");
          gameRuntime.sfx("freeze");
          gameRuntime.burst(gameRuntime.player.x, gameRuntime.player.y, "#67e8f9", 34, 4.5);
        }
      },
      magnet: {
        icon: "🧲", name: "자석", color: "#f97316",
        desc: "아이템과 구슬이 가까이 와요",
        apply(now) {
          gameRuntime.state.magnetUntil = now + 10000;
          gameRuntime.showToast("자석 발동! 아이템과 정답 구슬이 가까이 옵니다.");
          gameRuntime.sfx("item");
        }
      },
      bomb: {
        icon: "💣", name: "연산폭탄", color: "#facc15",
        desc: "주변 몬스터를 크게 공격해요",
        apply(now) {
          gameRuntime.explode(gameRuntime.player.x, gameRuntime.player.y, 240, 95, true);
          gameRuntime.showToast("연산폭탄! 주변 몬스터를 크게 공격했습니다.");
          gameRuntime.sfx("boom");
        }
      },
      star: {
        icon: "⭐", name: "별사탕", color: "#fde047",
        desc: "잠깐 동안 점수를 두 배로 받아요",
        apply(now) {
          gameRuntime.state.doubleScoreUntil = now + 11000;
          gameRuntime.showToast("별사탕! 11초 동안 점수 2배입니다.");
          gameRuntime.sfx("level");
        }
      },
      book: {
        icon: "📘", name: "연산노트", color: "#818cf8",
        desc: "정답을 찾는 힌트를 보여 줘요",
        apply(now) {
          gameRuntime.state.hintUntil = now + 15000;
          gameRuntime.showToast("연산노트! 정답 구슬 힌트가 반짝입니다.");
          gameRuntime.sfx("correct");
        }
      },
      speed: {
        icon: "⚡", name: "번개신발", color: "#bef264",
        desc: "잠깐 동안 더 빠르게 움직여요",
        apply(now) {
          gameRuntime.state.speedUntil = now + 9000;
          gameRuntime.showToast("번개신발! 9초 동안 더 빠르게 움직입니다.");
          gameRuntime.sfx("speed");
        }
      },
      expBook: {
        icon: "📗", name: "경험치책", color: "#4ade80",
        desc: "경험치를 45 얻어 레벨을 올려요",
        apply(now) {
          gameRuntime.state.exp += 45;
          gameRuntime.scorePlus(35);
          gameRuntime.showToast("경험치책! 레벨업에 가까워졌습니다.");
          gameRuntime.sfx("correct");
          gameRuntime.checkLevelUp();
        }
      },
      rainbow: {
        icon: "🌈", name: "무지개연필", color: "#f0abfc",
        desc: "가지고 있는 무기들을 강하게 해요",
        apply(now) {
          gameRuntime.state.rainbowUntil = now + 9000;
          gameRuntime.state.attackPower += 3;
          gameRuntime.state.projectileSpeed += 0.15;
          gameRuntime.state.fireRate = Math.max(180, gameRuntime.state.fireRate - 20);
          gameRuntime.showToast("무지개연필! 잠시 모든 무기가 더 강해집니다.");
          gameRuntime.sfx("level");
        }
      },
      eraser: {
        icon: "🧽", name: "지우개", color: "#cbd5e1",
        desc: "화면 근처 몬스터의 체력을 줄여요",
        apply(now) {
          for (const e of gameRuntime.enemies) {
            if (gameRuntime.isNearScreen(e.x, e.y, 80)) e.hp *= 0.45;
          }
          gameRuntime.state.eraserUntil = now + 3500;
          gameRuntime.showToast("지우개! 화면 근처 몬스터의 체력이 크게 줄었습니다.");
          gameRuntime.sfx("boom");
          gameRuntime.burst(gameRuntime.player.x, gameRuntime.player.y, "#e5e7eb", 44, 5);
        }
      },
      clock: {
        icon: "⏰", name: "집중시계", color: "#93c5fd",
        desc: "몬스터를 멈추고 힌트 시간을 늘려요",
        apply(now) {
          gameRuntime.state.freezeUntil = now + 3500;
          gameRuntime.state.hintUntil = now + 9000;
          gameRuntime.showToast("집중시계! 몬스터가 느려지고 힌트 시간이 늘어납니다.");
          gameRuntime.sfx("freeze");
        }
      },
      chest: {
        icon: "🎁", name: "보물상자", color: "#fbbf24",
        desc: "상자를 열면 여러 보상 중 하나를 받아요",
        apply(now) {
          gameRuntime.giveChestReward(now);
          gameRuntime.showToast("보물상자 개봉! 랜덤 보상을 얻었습니다.");
          gameRuntime.sfx("level");
        }
      },
      clover: {
        icon: "🍀", name: "행운클로버", color: "#86efac",
        desc: "잠깐 동안 아이템이 더 자주 나와요",
        apply(now) {
          gameRuntime.state.luckyUntil = now + 12000;
          gameRuntime.scorePlus(40);
          gameRuntime.showToast("행운클로버! 12초 동안 아이템이 더 잘 나옵니다.");
          gameRuntime.sfx("item");
        }
      },
      gem: {
        icon: "💎", name: "수학보석", color: "#67e8f9",
        desc: "점수와 경험치를 함께 얻어요",
        apply(now) {
          gameRuntime.state.exp += 28;
          gameRuntime.scorePlus(180);
          gameRuntime.showToast("수학보석! 점수와 경험치를 얻었습니다.");
          gameRuntime.sfx("correct");
          gameRuntime.checkLevelUp();
        }
      },
      bossTreasure: {
        icon: "👑", name: "보스 왕관", color: "#facc15", special: true,
        desc: "보스를 쓰러뜨리면 나와요. 최대 체력·공격력·경험치가 크게 올라요",
        apply(now, item) {
          const mid = item?.power === "mid", hp = mid ? 12 : 25, attack = mid ? 2 : 4, exp = mid ? 60 : 120;
          gameRuntime.state.maxHp += hp;
          gameRuntime.state.hp = gameRuntime.state.maxHp;
          gameRuntime.state.attackPower += attack;
          gameRuntime.state.exp += exp;
          gameRuntime.scorePlus(mid ? 150 : 300);
          gameRuntime.showToast(`👑 보스 왕관! 최대 체력 +${hp}(가득 회복) · 공격력 +${attack} · 경험치 +${exp}`, true);
          gameRuntime.sfx("level");
          gameRuntime.burst(gameRuntime.player.x, gameRuntime.player.y, "#facc15", 40, 5);
          gameRuntime.floatingTexts.push({ x: gameRuntime.player.x, y: gameRuntime.player.y - 70, text: `체력 +${hp} · 공격력 +${attack} · 경험치 +${exp}`, life: 150, color: "#ffd971" });
          // Let the reward message show before a level-up card covers the screen.
          gameRuntime.state.levelCheckAt = now + 2500;
        }
      },
      feather: {
        icon: "🪶", name: "순간이동깃털", color: "#ddd6fe",
        desc: "다른 곳으로 순간 이동해요",
        apply(now) {
          const p = gameRuntime.randomPointAroundPlayer(360, 620);
          gameRuntime.player.x = p.x;
          gameRuntime.player.y = p.y;
          gameRuntime.player.invincible = Math.max(gameRuntime.player.invincible, 900);
          gameRuntime.updateCamera();
          gameRuntime.burst(gameRuntime.player.x, gameRuntime.player.y, "#ddd6fe", 34, 4.2);
          gameRuntime.showToast("순간이동깃털! 안전한 곳으로 이동했습니다.");
          gameRuntime.sfx("dash");
        }
      }
    };for(const [key,sprite] of Object.entries(ITEM_SPRITES))types[key].sprite=sprite;return types; }
