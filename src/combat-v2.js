export const CHARACTERS={
 explorer:{name:'용감한 탐험가',icon:'🐹',color:'#f6b875',hp:140,speed:4.8,attack:24,rate:490,description:'체력 140 · 빠른 이동 · 탐험 폭발'},
 mage:{name:'번개 마법사',icon:'🧙',color:'#a59dfb',hp:100,speed:4.35,attack:26,rate:350,description:'체력 100 · 빠른 공격 · 시간 번개'},
 guardian:{name:'수학 수호자',icon:'🛡️',color:'#65cdb5',hp:170,speed:3.9,attack:22,rate:510,description:'체력 170 · 보호막 2 · 수호 회복'}
};
export const WEAPONS={storm:{name:'숫자 폭풍',icon:'🌀',evolution:'무한 숫자 폭풍'},compass:{name:'황금 컴퍼스',icon:'📐',evolution:'태양 컴퍼스'},fraction:{name:'분수 방패',icon:'🛡️',evolution:'완전 분수 방패'},lightning:{name:'연산 번개',icon:'⚡',evolution:'연쇄 연산 번개'}};
export function hazardContains(h,p){if(h.shape==='circle')return Math.hypot(p.x-h.x,p.y-h.y)<h.r+p.r;if(h.shape==='ring'){const d=Math.hypot(p.x-h.x,p.y-h.y);return Math.abs(d-h.r)<h.width+p.r;}if(h.shape==='rect')return Math.abs(p.x-h.x)<h.w/2+p.r&&Math.abs(p.y-h.y)<h.h/2+p.r;
 const dx=p.x-h.x,dy=p.y-h.y,c=Math.cos(h.angle),s=Math.sin(h.angle),along=dx*c+dy*s,across=-dx*s+dy*c;return along>-p.r&&along<h.length+p.r&&Math.abs(across)<h.width+p.r;}
export function createCombatV2(r,settings){
 let hazards=[],lines=[],lastShield=0;const s=r.state,p=r.player;
 function reset(){hazards=[];lines=[];lastShield=0;s.newWeapons={storm:0,compass:0,fraction:0,lightning:0};s.weaponTimes={};s.evolved={};s.skillReady=0;s.bossKills=0;}
 function evolved(key){if(s.newWeapons[key]>=3&&s.bestCombo>=5){if(!s.evolved[key])r.showToast(WEAPONS[key].evolution+' 진화! (Lv.3 + 최고 5콤보)');s.evolved[key]=true;}return !!s.evolved[key];}
 function damage(amount){if(p.invincible>0)return;if(s.shield>0)s.shield--;else{s.hp-=amount;s.combo=0;}p.invincible=850;r.sfx('hit');}
 function skill(){if(!s.running||s.paused||r.gameNow()<s.skillReady)return;s.skillReady=r.gameNow()+14000;const id=s.character;
  if(id==='mage'){s.freezeUntil=r.gameNow()+3000;r.explode(p.x,p.y,350,90,true);}
  else if(id==='guardian'){s.hp=Math.min(s.maxHp,s.hp+45);s.shield=Math.min(8,s.shield+2);r.explode(p.x,p.y,160,50,true);}
  else{p.invincible=2000;r.explode(p.x,p.y,260,130,true);}r.showToast(CHARACTERS[id].name+' 특수 스킬!');r.sfx('level');}
 function add(h,now){hazards.push({...h,fireAt:now+1250,expireAt:now+2050,damage:({easy:10,normal:18,hard:26})[s.difficulty]});}
 function bossPatterns(now){for(const e of r.enemies.filter(e=>e.boss&&e.hp>0)){
  if(now<e.nextPattern||now<s.freezeUntil)continue;e.nextPattern=now+3800;const second=e.patternIndex++%2===1;
  if(e.bossType==='forest'){
   if(!second)add({shape:'circle',x:p.x,y:p.y,r:100,label:'골렘 내려찍기'},now);
   else for(let i=0;i<6;i++)add({shape:'beam',x:e.x,y:e.y,angle:i*Math.PI/3,length:650,width:20,label:'구구단 충격파'},now);
  }else if(e.bossType==='desert'){
   if(!second){const angle=Math.atan2(p.y-e.y,p.x-e.x);for(let i=-1;i<=1;i++)add({shape:'beam',x:e.x,y:e.y,angle:angle+i*.25,length:800,width:24,label:'분수 화염'},now);}
   else for(let i=0;i<3;i++)add({shape:'circle',x:p.x+(i-1)*140,y:p.y+(i-1)*80,r:70,label:'용의 운석'},now+i*180);
  }else{
   if(!second)add({shape:'rect',x:p.x,y:p.y,w:260,h:100,label:'사각형 봉인'},now);
   else add({shape:'ring',x:e.x,y:e.y,r:220,width:28,label:'도형 고리'},now);
  }
 }}
 function tick(now){
  bossPatterns(now);for(const h of hazards)if(now>=h.fireAt&&now<h.expireAt&&hazardContains(h,p))damage(h.damage);hazards=hazards.filter(h=>now<h.expireAt);
  lines=lines.filter(l=>now<l.until);
  for(const [key,lvl] of Object.entries(s.newWeapons)){
   if(!lvl)continue;const ev=evolved(key),mul=ev?2:1;
   if(key==='fraction'){
    if(now-lastShield>=1000){lastShield=now;for(const e of r.enemies){if(Math.hypot(e.x-p.x,e.y-p.y)<75+e.r)e.hp-=(12+lvl*5)*mul;}}
    if(now-(s.weaponTimes.fraction||0)>10000){s.shield=Math.min(8,s.shield+(ev?2:1));s.weaponTimes.fraction=now;}continue;
   }
   if(now-(s.weaponTimes[key]||0)<(key==='lightning'?1700:2200)/mul||!r.enemies.length)continue;s.weaponTimes[key]=now;
   if(key==='storm'){for(let i=0;i<6+lvl*2;i++){const angle=i*Math.PI*2/(6+lvl*2);r.projectiles.push({kind:'orb',x:p.x,y:p.y,vx:Math.cos(angle)*6,vy:Math.sin(angle)*6,r:8,damage:(15+lvl*5)*mul,life:75,pierce:ev?2:0,color:'#67e8f9'});}}
   if(key==='compass'){for(let i=0;i<(ev?4:2);i++)r.projectiles.push({kind:'boomerang',x:p.x,y:p.y,t:0,angle:i*Math.PI/2,speed:7,r:14,damage:(25+lvl*8)*mul,life:95,pierce:2,color:'#facc15'});}
   if(key==='lightning'){let from={x:p.x,y:p.y};const targets=[...r.enemies].sort((a,b)=>r.distance(a,p)-r.distance(b,p)).slice(0,lvl+(ev?3:0));for(const e of targets){e.hp-=(30+lvl*8)*mul;lines.push({x:from.x,y:from.y,tx:e.x,ty:e.y,until:now+250});from=e;}r.sfx('speed');}
  }
 }
 function draw(now){const ctx=r.ctx;
  if(!settings.low){ctx.save();ctx.globalAlpha=.3;ctx.font='20px Segoe UI Emoji';const icon={forest:'🍃',desert:'✨',library:'✦'}[s.currentMapKey];for(let i=0;i<8;i++){const t=settings.reduced?0:now/80;ctx.fillStyle=s.map.accent2;ctx.fillText(icon,(i*147+t)%r.canvas.width,(i*97+t*.25)%r.canvas.height);}ctx.restore();}
  for(const portal of r.portals){if(!r.isNearScreen(portal.x,portal.y,80))continue;ctx.save();ctx.translate(r.worldToScreenX(portal.x),r.worldToScreenY(portal.y));ctx.rotate(settings.reduced?0:now/900);ctx.strokeStyle=portal.color;ctx.lineWidth=4;ctx.globalAlpha=.7;ctx.beginPath();ctx.ellipse(0,0,24,36,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
  for(const h of hazards){ctx.save();ctx.translate(r.worldToScreenX(h.x),r.worldToScreenY(h.y));const active=now>=h.fireAt;ctx.fillStyle=active?'rgba(251,113,133,.6)':'rgba(250,204,21,.22)';ctx.strokeStyle=active?'#fb7185':'#fde047';ctx.lineWidth=3;ctx.setLineDash(active?[]:[9,6]);ctx.beginPath();
   if(h.shape==='circle')ctx.arc(0,0,h.r,0,Math.PI*2);
   else if(h.shape==='ring'){ctx.lineWidth=h.width*2;ctx.arc(0,0,h.r,0,Math.PI*2);}
   else if(h.shape==='rect')ctx.rect(-h.w/2,-h.h/2,h.w,h.h);
   else{ctx.rotate(h.angle);ctx.rect(0,-h.width,h.length,h.width*2);}if(h.shape!=='ring')ctx.fill();ctx.stroke();ctx.restore();
  }
  for(const l of lines){ctx.strokeStyle='#fde047';ctx.lineWidth=4;ctx.beginPath();ctx.moveTo(r.worldToScreenX(l.x),r.worldToScreenY(l.y));ctx.lineTo(r.worldToScreenX(l.tx),r.worldToScreenY(l.ty));ctx.stroke();}
  if(s.newWeapons.fraction){ctx.strokeStyle=s.evolved.fraction?'#facc15':'#7dd3fc';ctx.lineWidth=4;ctx.beginPath();ctx.arc(r.worldToScreenX(p.x),r.worldToScreenY(p.y),75,0,Math.PI*2);ctx.stroke();}
  ctx.strokeStyle=CHARACTERS[s.character||'explorer'].color;ctx.lineWidth=3;ctx.beginPath();ctx.arc(r.worldToScreenX(p.x),r.worldToScreenY(p.y),p.r+7,0,Math.PI*2);ctx.stroke();
 }
 function upgrades(){return Object.entries(WEAPONS).filter(([key])=>s.newWeapons[key]<3).map(([key,w])=>({emoji:w.icon,title:w.name+' Lv.'+(s.newWeapons[key]+1),desc:'Lv.3 + 최고 5콤보 → '+w.evolution,apply(){s.newWeapons[key]++;s.weaponLevel++;}}));}
 return {reset,tick,draw,skill,upgrades,hazards:()=>hazards,evolved};
}
