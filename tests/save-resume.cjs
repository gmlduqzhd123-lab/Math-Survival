const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const url=process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/';
const out='test-results/save-resume';fs.mkdirSync(out,{recursive:true});
const run=()=>__game.state.running&&!__game.state.paused;
// Plays a little, levels up and answers so the save has something worth keeping.
async function play(p){
 await p.waitForFunction(()=>__game.clock>1500);
 await p.evaluate(()=>{const s=__game.state;s.score=1234;s.hp=77;__game.v3.weapons.gain('dice');__game.v3.weapons.gain('dice');});
 const correct=await p.evaluate(()=>__game.answerOrbs.findIndex(x=>x.correct));
 await p.evaluate(i=>{const orb=__game.answerOrbs[i];__game.resolveAnswer(orb);},correct);
 await p.waitForFunction(()=>__game.v2.answers.length===1);
}
const snapshot=p=>p.evaluate(()=>({level:__game.state.level,score:__game.state.score,hp:__game.state.hp,time:Math.floor(__game.state.time),answers:__game.v2.answers.length,session:__game.v2.result?.sessionId||__game.v2.store.data.checkpoint?.sessionId,dice:__game.v3.weapons.levels.dice,runId:__game.v3.runId,map:__game.state.currentMapKey,enemies:__game.enemies.length,px:Math.round(__game.player.x)}));
(async()=>{
 const browser=await chromium.launch({headless:true});
 const results=[];
 for(const [name,width,height,touch]of [['desktop',1280,800,false],['phone',390,844,true]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch});
  const p=await context.newPage(),errors=[];p.setDefaultTimeout(8000);p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url+'?qa=1');await p.waitForFunction(()=>window.__game);
  assert.equal(await p.locator('#continueBox').isVisible(),false,'no continue button before any save');
  await p.fill('#studentNo','12');await p.locator('#studentNo').dispatchEvent('change');
  await require('./home-settings.cjs')(p);await p.selectOption('#mapSelect','desert');
  await p.click('#startBtn');await play(p);
  // Save from the pause menu.
  await p.click('#pauseBtn');const before=await snapshot(p);assert(await p.locator('#saveExitBtn').isVisible());await p.screenshot({path:`${out}/${name}-menu.png`});
  await p.click('#saveExitBtn');
  assert(await p.locator('#startPanel').isVisible());assert.equal(await p.evaluate(()=>__game.state.running),false);
  assert(await p.locator('#continueBox').isVisible());assert.match(await p.locator('#continueInfo').textContent(),/12번/);
  assert.equal(await p.evaluate(id=>__game.v2.store.data.records.filter(x=>x.sessionId===id).length,before.session),1,'learning record kept once');
  assert.equal(await p.locator('#gameOverPanel').isVisible(),false,'no result screen when saving');
  // Another number has its own (empty) slot.
  await p.fill('#studentNo','5');await p.locator('#studentNo').dispatchEvent('change');assert.equal(await p.locator('#continueBox').isVisible(),false);
  await p.fill('#studentNo','12');await p.locator('#studentNo').dispatchEvent('change');assert(await p.locator('#continueBox').isVisible());
  // Coming back later: reload and continue.
  await p.reload();await p.waitForFunction(()=>window.__game);
  assert(await p.locator('#continueBox').isVisible());await p.screenshot({path:`${out}/${name}-home.png`});
  await p.click('#continueBtn');await p.waitForFunction(run);
  const after=await snapshot(p);
  for(const key of ['level','answers','dice','runId','map'])assert.deepEqual(after[key],before[key],key+' restored');
  assert(after.score>=before.score&&after.score<before.score+200,'score restored');assert(after.hp<=before.hp&&after.hp>before.hp-30,'health restored');
  assert(after.time>=before.time&&after.time<=before.time+1,'time restored');
  assert.equal(await p.evaluate(()=>__game.v2.store.data.checkpoint.sessionId),before.session,'same learning session continues');
  assert(await p.evaluate(()=>__game.state.quizActive&&__game.answerOrbs.length>0),'a fresh question is shown');
  await p.waitForTimeout(600);await p.screenshot({path:`${out}/${name}-resumed.png`});
  // Closing the tab keeps the latest progress too.
  await p.evaluate(()=>{__game.state.score=5555;});await p.reload();await p.waitForFunction(()=>window.__game);
  assert(await p.locator('#continueBox').isVisible());await p.click('#continueBtn');await p.waitForFunction(run);
  assert.equal(await p.evaluate(()=>__game.state.score),5555,'autosave on leaving the page');
  // Ending the run removes the save and keeps one learning record.
  await p.click('#pauseBtn');await p.click('#quitGameBtn');assert(await p.locator('#gameOverPanel').isVisible());
  assert.equal(await p.evaluate(id=>__game.v2.store.data.records.filter(x=>x.sessionId===id).length,before.session),1);
  await p.click('#toStartBtn');assert.equal(await p.locator('#continueBox').isVisible(),false,'save removed after the game ends');
  // Starting a new game replaces the save for that number.
  await p.click('#startBtn');await p.waitForFunction(()=>__game.clock>300);await p.click('#pauseBtn');await p.click('#saveExitBtn');assert(await p.locator('#continueBox').isVisible());
  await p.click('#startBtn');await p.waitForFunction(()=>__game.clock>300);await p.click('#pauseBtn');await p.click('#mainMenuBtn');assert.equal(await p.locator('#continueBox').isVisible(),false);
  assert.deepEqual(errors,[]);results.push({name,passed:true});await context.close();
 }
 // Boss and dungeon modes keep their mode state.
 {const context=await browser.newContext({viewport:{width:1280,height:800}}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));p.setDefaultTimeout(8000);
  await p.goto(url+'?qa=1');await p.waitForFunction(()=>window.__game);await require('./home-settings.cjs')(p);
  await p.selectOption('#mode','boss');await p.click('#startBtn');await p.waitForFunction(()=>__game.clock>500);
  const boss=await p.evaluate(()=>{const b=__game.enemies.find(e=>e.boss);b.hp=123;return b.name;});
  await p.click('#pauseBtn');await p.click('#saveExitBtn');await p.reload();await p.waitForFunction(()=>window.__game);await p.click('#continueBtn');await p.waitForFunction(run);
  const restored=await p.evaluate(()=>__game.enemies.filter(e=>e.boss).map(e=>({name:e.name,hp:Math.round(e.hp)})));
  assert.equal(restored.length,1);assert.equal(restored[0].name,boss);assert(restored[0].hp<=123,'boss health kept');
  await p.click('#pauseBtn');await p.click('#mainMenuBtn');await require('./home-settings.cjs')(p);
  await p.selectOption('#mode','dungeon');await p.fill('#target','12');await p.locator('#target').dispatchEvent('input');await p.click('#startBtn');await p.waitForFunction(()=>__game.clock>300);
  for(let i=0;i<3;i++){await p.evaluate(()=>{const orb=__game.answerOrbs.find(x=>x.correct);__game.resolveAnswer(orb);});await p.click('#continueQuestion');}
  const room=await p.evaluate(()=>__game.v3.dungeon.room);assert.equal(room,2);
  await p.click('#pauseBtn');await p.click('#saveExitBtn');await p.reload();await p.waitForFunction(()=>window.__game);await p.click('#continueBtn');await p.waitForFunction(()=>__game.state.running);
  assert.equal(await p.evaluate(()=>__game.v3.dungeon.room),2);assert.equal(await p.evaluate(()=>__game.v2.answers.length),3);assert.equal(await p.evaluate(()=>__game.state.worldW),1000);
  assert.deepEqual(errors,[]);results.push({name:'boss and dungeon',passed:true});await context.close();}
 await browser.close();console.log(JSON.stringify(results));
})().catch(e=>{console.error(e);process.exit(1);});
