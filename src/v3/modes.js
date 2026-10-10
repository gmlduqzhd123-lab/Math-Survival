import {dailySeed} from './progress.js';
export const MODES={timed:{name:'타임 서바이벌',base:'survival'},defense:{name:'웨이브 디펜스',base:'survival'},dungeon:{name:'수학 던전',base:'explore'},endless:{name:'무한 도전',base:'survival'},daily:{name:'오늘의 도전',base:'survival'}};
export const baseMode=mode=>MODES[mode]?.base||mode;
export function createModes(r){let variant='survival',wave=0,nextWave=0,day=null,defenseHealth=100;
 function start(config){variant=config.gameMode||config.mode;wave=0;nextWave=0;defenseHealth=100;day=dailySeed();if(variant==='timed')r.state.winTime=config.duration*60;if(variant==='daily'){r.state.winTime=480;r.state.dailySeed=day.seed;const keys=['forest','desert','library','ocean','clockwork','sky'];const key=keys[day.seed%keys.length];r.state.currentMapKey=key;r.state.map=r.MAPS[key];r.state.worldW=r.state.map.worldW;r.state.worldH=r.state.map.worldH;r.player.x=r.state.worldW/2;r.player.y=r.state.worldH/2;r.makeDecorations();r.makePortals();r.updateCamera();}if(variant==='dungeon')r.state.dungeonRooms=1;}
 function tick(now){const s=r.state;if(variant==='defense'){if(!wave||!r.enemies.length&&now>=nextWave){wave++;nextWave=now+3000;if(wave>20){r.endGame(true);return;}for(let i=0;i<Math.min(40,5+wave*2);i++)r.v3.battle.spawn();r.showToast('🏰 방어 웨이브 '+wave+'/20');}for(const e of r.enemies)if(!e.boss&&Math.hypot(e.x-s.worldW/2,e.y-s.worldH/2)<45){defenseHealth=Math.max(0,defenseHealth-3);e.escaped=true;e.hp=0;}if(defenseHealth<=0)r.endGame(false);}
 if(variant==='endless'&&now>=nextWave&&s.time>180&&!r.enemies.some(e=>e.boss)){nextWave=now+120000;r.spawnBoss();}
 }
 function answer(){r.v3.dungeon.answer();}
 function draw(){if(variant!=='defense')return;const ctx=r.ctx,x=r.worldToScreenX(r.state.worldW/2),y=r.worldToScreenY(r.state.worldH/2);ctx.fillStyle='#89c9b7';ctx.fillRect(x-26,y-26,52,52);ctx.fillStyle='#fff';ctx.font='13px Jua';ctx.textAlign='center';ctx.fillText('수학 성문 '+defenseHealth,x,y-32);}
 return {start,tick,answer,draw,get variant(){return variant;},get wave(){return wave;},get day(){return day;},get defenseHealth(){return defenseHealth;}};
}
