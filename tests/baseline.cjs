const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true,channel:process.env.BROWSER_CHANNEL||'msedge'});const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4173/Math-Survival-2/original/');await page.click('#startBtn');
 const result=await page.evaluate(()=>{
  state.paused=true; const out={};out.started=state.running;const x=player.x;state.paused=false;keys.d=true;update(16,performance.now());keys.d=false;out.movement=player.x>x;
  enemies=[];spawnEnemy();out.spawn=enemies.length===1;shoot(performance.now()+1000);out.attack=projectiles.length>0;
  enemies=[{x:player.x,y:player.y,r:20,hp:99,maxHp:99,speed:0,damage:8,wobble:0}];player.invincible=0;state.shield=0;const hp=state.hp;update(16,performance.now());out.collision=state.hp<hp;
  spawnQuiz();out.quiz=answerOrbs.length===4;resolveAnswer(answerOrbs.find(o=>o.correct));out.correct=state.correct===1&&state.combo===1;
  spawnQuiz();resolveAnswer(answerOrbs.find(o=>!o.correct));out.wrong=state.wrong===1&&state.combo===0;
  spawnBoss();out.boss=enemies.some(e=>e.boss);state.exp=expNeed();checkLevelUp();out.level=state.level===2&&state.levelUpPending;chooseUpgrade(upgradeOptions()[0]);out.upgrade=!state.levelUpPending;
  spawnExpDrops(player.x,player.y,20,1);const xp=state.exp;collectExpDrop(expDrops[0]);out.experience=state.exp>xp;
  applyItem({type:'shield'},performance.now());out.item=state.shield>0;out.audio=audioReady;out.touch=!!joystickZone&&!!dashBtn;
  quitGame();out.end=!state.running;resetGame();out.restart=state.running&&state.correct===0&&state.level===1;
  return out;
 });
 fs.writeFileSync('docs/baseline-results.json',JSON.stringify({result,errors,limitations:['터치는 DOM 존재만 확인. 실제 터치 회귀는 2.0에서 수행.','사운드는 AudioContext 초기화 확인. 청취 검증 제외.']},null,2));console.log(JSON.stringify({result,errors},null,2));await browser.close();
 if(errors.length||Object.values(result).some(v=>!v))process.exitCode=1;
})();
