const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict');
const root=process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/';
async function answer(page){const value=await page.evaluate(()=>__game.state.problem.answer);await page.locator('#popupOptions').getByRole('button',{name:String(value),exact:true}).tap();await page.locator('#popupContinue').tap();}
(async()=>{
 for(const engine of (process.env.ENGINES||'chromium').split(',')){
  const browser=await ({chromium,webkit})[engine].launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),errors=[];page.on('pageerror',e=>errors.push(e.message));
   await page.goto(root+'?qa=1');await page.waitForFunction(()=>window.__game);await require('./home-settings.cjs')(page);
   await page.selectOption('#questionMode','popup');await page.selectOption('#mode','survival');await page.locator('#startBtn').tap();await answer(page);
   // A due question and a nearby experience gem can occur in one normal update.
   const opening=await page.evaluate(()=>{const r=__game;r.enemies=[];r.items=[];r.expDrops=[];r.state.exp=r.expNeed()-1;r.state.lastQuiz=r.clock-30001;r.spawnExpDrops(r.player.x,r.player.y,20,1);for(const d of r.expDrops){d.x=r.player.x;d.y=r.player.y;d.vx=d.vy=0;}r.update(1000/60,r.clock);return {popup:r.state.mathPopup,paused:r.state.paused,level:r.state.levelUpPending,gemCollected:r.expDrops.some(d=>d.collected)};});
   assert(opening.popup&&opening.paused,'due question did not pause');
   assert.equal(opening.level,false,'same tick collected EXP and opened upgrade behind math popup');
   assert.equal(opening.gemCollected,false,'paused combat collected gem');
   await answer(page);await page.waitForFunction(()=>__game.state.levelUpPending);
   const clock=await page.evaluate(()=>__game.clock);await page.waitForTimeout(300);
   assert(await page.evaluate(()=>__game.state.paused&&!__game.state.mathPopup),'combat resumed under upgrade selection');
   assert.equal(await page.evaluate(()=>__game.clock),clock,'clock advances under upgrade cards');
   await page.locator('#upgradeChoices button').first().tap();await page.waitForFunction(c=>__game.clock>c,clock);
   assert(await page.evaluate(()=>!__game.state.levelUpPending&&!__game.state.paused));
   // If a pending reward already exists, dismissing a math explanation must keep it paused.
   await page.evaluate(()=>{__game.spawnQuiz();__game.state.levelUpQueue=1;__game.openLevelUpPanel();});
   await answer(page);assert(await page.evaluate(()=>__game.state.levelUpPending&&__game.state.paused));
   await page.locator('#upgradeChoices button').first().tap();assert(await page.evaluate(()=>!__game.state.paused));
   assert.deepEqual(errors,[]);console.log('PASS '+engine+' same-frame question/EXP pause ordering and pending reward pause');
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exit(1);});
