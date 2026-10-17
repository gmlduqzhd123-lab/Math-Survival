// One saved run per student number (or one shared slot without a number) in this browser.
// Learning records stay in storage.js; this only keeps what is needed to continue a run.
export const SAVE_KEY='math-survival-3.saves.v1',SAVE_VERSION=1;
// Fields that describe the moment of saving (open windows, the current question) and restart cleanly.
const TRANSIENT=['running','paused','map','cameraX','cameraY','levelUpPending','quizActive','currentAnswer','problem','mathPopup','explanationPending','merchantOpen','dashRequested'];
const encode=value=>JSON.stringify(value,(k,v)=>typeof v==='number'&&!Number.isFinite(v)?(v>0?'Infinity':v<0?'-Infinity':null):v);
const decode=text=>JSON.parse(text,(k,v)=>v==='Infinity'?Infinity:v==='-Infinity'?-Infinity:v);
export const slotFor=studentNo=>studentNo?String(studentNo):'guest';
export function createSaves(storage){
 // Some browsers block storage entirely; then saving is simply unavailable.
 if(storage===undefined)try{storage=globalThis.localStorage;}catch{storage=null;}
 function readAll(){try{if(!storage)throw Error('no storage');const data=decode(storage.getItem(SAVE_KEY)||'null');return data&&data.version===SAVE_VERSION&&data.slots&&typeof data.slots==='object'?data:{version:SAVE_VERSION,slots:{}};}catch{return {version:SAVE_VERSION,slots:{}};}}
 function writeAll(data){try{if(!storage)return false;if(Object.keys(data.slots).length)storage.setItem(SAVE_KEY,encode(data));else storage.removeItem(SAVE_KEY);return true;}catch{return false;}}
 return {
  get(slot){const save=readAll().slots[slot];return save&&save.version===SAVE_VERSION?save:null;},
  put(slot,save){const data=readAll();data.slots[slot]=save;return writeAll(data);},
  remove(slot){const data=readAll();if(!(slot in data.slots))return true;delete data.slots[slot];return writeAll(data);}
 };
}
export function captureRun(r,v2State){
 const state=Object.fromEntries(Object.entries(r.state).filter(([key])=>!TRANSIENT.includes(key)));
 return structuredClone({version:SAVE_VERSION,savedAt:new Date().toISOString(),clock:r.clock,state,
  player:{x:r.player.x,y:r.player.y,speed:r.player.speed,invincible:r.player.invincible},
  enemies:r.enemies.filter(e=>e.hp>0),items:r.items,expDrops:r.expDrops,portals:r.portals,
  v2:v2State,v3:r.v3.save()});
}
// Runs after the normal start for the saved settings, then puts the saved run back on top of it.
export function applyRun(r,save){
 r.clock=save.clock;Object.assign(r.state,save.state);
 r.state.map=r.MAPS[r.state.currentMapKey];r.state.worldW=r.state.map.worldW;r.state.worldH=r.state.map.worldH;
 Object.assign(r.player,save.player,{dashSteps:0,dashUntil:0,dashTrail:[]});
 r.projectiles=[];r.particles=[];r.answerOrbs=[];r.floatingTexts=[];
 r.items=save.items;r.expDrops=save.expDrops;r.v3.load(save.v3,save.enemies);
 r.makeDecorations();r.portals=r.v3.dungeon.active?[]:save.portals;r.updateCamera();
}
export function describe(save){
 const c=save.v2.config,s=save.state,minutes=Math.floor((s.time||0)/60),seconds=Math.floor((s.time||0)%60);
 const when=new Date(save.savedAt);
 return {grade:c.grade+'학년',level:'레벨 '+s.level,time:(minutes?minutes+'분 ':'')+seconds+'초',saved:Number.isFinite(when.getTime())?(when.getMonth()+1)+'월 '+when.getDate()+'일 '+String(when.getHours()).padStart(2,'0')+':'+String(when.getMinutes()).padStart(2,'0'):''};
}
