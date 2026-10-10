import {seeded} from '../math-engine.js';
import {SpatialGrid,ObjectPool,mergeGems,waveFor,performanceTier} from './performance.js';
import {MONSTERS,advanceMonster} from './monsters.js';
export function createSurvival(r,settings){
 const grid=new SpatialGrid(128),enemies=new ObjectPool(240),shots=new ObjectPool(100);let bullets=[],pending=[],samples=[],lastWave=0,tier='normal',lastMerge=0,rng=Math.random;
 const budget=()=>settings.low||tier==='low'?90:220;
 function reset(seed){rng=seed==null?Math.random:seeded(seed);enemies.clear();shots.clear();bullets=[];pending=[];samples=[];lastWave=0;lastMerge=0;tier='normal';}
 function spawn(species,point,small=false){if(r.state.mode==='explore'||r.enemies.length>=budget())return null;const w=waveFor(r.state.time,r.state.difficulty),keys=Object.keys(MONSTERS);species??=keys[Math.floor(rng()*w.types)];const spec=MONSTERS[species],pos=point||r.randomPointAroundPlayer(Math.max(520,Math.min(850,r.canvas.width/2+90)),Math.max(760,Math.min(1100,r.canvas.width/2+250))),elite=!small&&rng()<w.eliteChance,difficulty={easy:.7,normal:1,hard:1.25}[r.state.difficulty];const hp=spec.hp*w.health*(elite?2.1:small?.4:1);
 const e=enemies.take({...pos,species,name:spec.name,r:small?10:spec.r,hp,maxHp:hp,speed:spec.speed*difficulty*(small?1.2:1),damage:spec.damage*difficulty,elite,tiny:small,wobble:Math.random()*10,nextAction:r.gameNow()+1400});if(e)r.enemies.push(e);return e;
 }
 function move(e,dt,now){if(now<r.state.freezeUntil)return;const visible=r.isNearScreen(e.x,e.y,250);if(!visible&&now-(e.lastAI||0)<100)return;const scale=visible?1:Math.min(6,(now-(e.lastAI||now-100))/(1000/60));e.lastAI=now;const action=advanceMonster(e,r.v3?.modes.variant==='defense'?{x:r.state.worldW/2,y:r.state.worldH/2}:r.player,now,scale*(now<(e.slowUntil||0)?.45:1));
 e.x=r.clamp(e.x,e.r,r.state.worldW-e.r);e.y=r.clamp(e.y,e.r,r.state.worldH-e.r);
 if(action==='shoot'){const a=Math.atan2(r.player.y-e.y,r.player.x-e.x),shot=shots.take({x:e.x,y:e.y,vx:Math.cos(a)*3.4,vy:Math.sin(a)*3.4,r:6,damage:e.damage,life:3600,frost:e.species==='frost'});if(shot)bullets.push(shot);}
 if(action==='summon')for(let i=0;i<2;i++)pending.push({species:'sprout',point:{x:e.x+i*22,y:e.y+35},small:true});
 if(action==='heal')for(const other of grid.near(e.x,e.y,150))if(!other.boss)other.hp=Math.min(other.maxHp,other.hp+8);
 }
 function killed(e){if(!e.escaped&&e.species==='jelly'&&!e.tiny)for(let i=0;i<2;i++)pending.push({species:'jelly',point:{x:e.x+(i?15:-15),y:e.y},small:true});enemies.release(e);}
 function tick(dt,now){for(const child of pending.splice(0,12))spawn(child.species,child.point,child.small);grid.rebuild(r.enemies);
 if(r.state.mode!=='explore'&&r.v3?.modes.variant!=='defense'){const w=waveFor(r.state.time,r.state.difficulty);if(w.wave!==lastWave){lastWave=w.wave;r.showToast('🌊 웨이브 '+w.wave+' · '+MONSTERS[Object.keys(MONSTERS)[w.types-1]].name+' 등장');}if(now-r.state.lastSpawn>w.delay){r.state.lastSpawn=now;for(let i=0;i<w.batch;i++)spawn();}}
 for(const shot of bullets){shot.x+=shot.vx;shot.y+=shot.vy;shot.life-=dt;if(Math.hypot(shot.x-r.player.x,shot.y-r.player.y)<shot.r+r.player.r){if(r.player.invincible<=0){if(r.state.shield>0)r.state.shield--;else r.state.hp-=shot.damage;r.player.invincible=850;if(shot.frost)r.state.slowUntil=now+500;}shot.life=0;}}
 bullets=bullets.filter(shot=>{if(shot.life<=0||!r.isNearScreen(shot.x,shot.y,450)){shots.release(shot);return false;}return true;});
 if(now-lastMerge>500){lastMerge=now;r.expDrops=mergeGems(r.expDrops,settings.low||tier==='low'?70:140);}
 r.projectiles=r.projectiles.slice(-(settings.low||tier==='low'?110:280));r.particles=r.particles.slice(-(settings.low||tier==='low'?70:240));r.floatingTexts=r.floatingTexts.slice(-50);r.items=r.items.slice(-90);
 }
 function frame(milliseconds){samples.push(milliseconds);if(samples.length>180)samples.shift();const next=performanceTier(samples,settings.low);if(next==='low'&&tier!=='low'){tier='low';r.showToast('화면 효과와 적 수를 자동으로 줄였습니다.');}}
 function draw(){const ctx=r.ctx;for(const shot of bullets){ctx.fillStyle=shot.frost?'#a6defa':'#ed9c9c';ctx.beginPath();ctx.arc(r.worldToScreenX(shot.x),r.worldToScreenY(shot.y),shot.r,0,Math.PI*2);ctx.fill();}}
 return {reset,spawn,move,killed,tick,draw,frame,grid,enemiesPool:enemies,shotPool:shots,get bullets(){return bullets;},get tier(){return tier;},get wave(){return lastWave;}};
}
