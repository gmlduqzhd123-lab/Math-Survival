import {createDungeon} from './dungeon.js';
import {createSurvival} from './survival.js';
import {createWeapons} from './weapons.js';
import {createMathCombat} from './math-combat.js';
import {createContent} from './content.js';
import {dailySeed,createProgress} from './progress.js';
import {createProgressUI} from './progress-ui.js';
import {createModes} from './modes.js';
export function createV3(r,settings){const battle=createSurvival(r,settings),weapons=createWeapons(r,battle),math=createMathCombat(r),content=createContent(r,battle,weapons),progress=createProgress(),modes=createModes(r),ui=createProgressUI(r,progress),dungeon=createDungeon(r);let runId='',settled=true,seen=new Set(),lastRegen=0;
 function finish(outcome){if(settled)return false;settled=true;math.hide();content.closeShop();const saved=progress.settle({id:runId,mode:modes.variant,outcome,seconds:Math.round(r.state.time),gold:content.runGold,kills:r.state.kills,correct:r.state.correct,bosses:r.state.bossKills,evolutions:Object.keys(weapons.evolved).length,seen:{weapons:Object.keys(weapons.levels),characters:[r.state.character],pets:[content.pet],monsters:[...seen],worlds:[...content.cleared].filter(id=>id!=='midBoss').concat([r.state.currentMapKey])}});ui.render();return saved;}
 return {battle,weapons,math,content,progress,modes,ui,dungeon,finish,killed(e){if(e.species)seen.add(e.species);content.killed(e);battle.killed(e);},mount(){math.mount();ui.mount();},start(config){ui.reset();battle.reset(config.gameMode==='daily'?dailySeed().seed:null);r.state.startWeapon=config.weapon;weapons.start();math.start(config);modes.start(config);content.start(config);dungeon.start(config);runId=crypto.randomUUID();settled=false;seen=new Set();lastRegen=0;const u=progress.data.upgrades;r.state.maxHp+=8*(u.health||0);r.state.hp=r.state.maxHp;r.state.attackPower+=1.5*(u.might||0);r.player.speed+=.08*(u.speed||0);},tick(dt,now){for(const e of r.enemies)if(e.boss)math.attachBoss(e);modes.tick(now);battle.tick(dt,now);weapons.tick(now);content.tick(now);if(now-lastRegen>5000){lastRegen=now;r.state.hp=Math.min(r.state.maxHp,r.state.hp+(progress.data.upgrades.regen||0));}ui.hud(now);},draw(now){battle.draw();weapons.draw(now);content.draw(now);modes.draw();},get runId(){return runId;}};
}
