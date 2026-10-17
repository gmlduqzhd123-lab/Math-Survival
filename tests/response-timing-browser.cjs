const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict');
const root=process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/';
// A correct answer grants experience, so a reward card can open after the explanation; pick it to keep playing.
async function clearRewards(page){while(await page.evaluate(()=>__game.state.levelUpPending))await page.locator('#upgradeChoices button').first().tap();}
async function submit(page){const answer=await page.evaluate(()=>__game.state.problem.answer);await page.locator('#popupOptions').getByRole('button',{name:String(answer),exact:true}).tap();return page.evaluate(()=>__game.v2.answers.at(-1).responseMs);}
(async()=>{
 for(const engine of (process.env.ENGINES||'chromium').split(',')){
  const browser=await ({chromium,webkit})[engine].launch({headless:true});
  try{
   const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.goto(root+'?qa=1');await page.waitForFunction(()=>window.__game);await require('./home-settings.cjs')(page);
   await page.selectOption('#mode','survival');await page.selectOption('#questionMode','popup');await page.locator('#startBtn').tap();
   await page.waitForFunction(()=>__game.state.mathPopup&&__game.state.paused);
   const firstShown=await page.evaluate(()=>performance.now()),clock=await page.evaluate(()=>__game.clock);
   await page.waitForTimeout(350);
   const hiddenAt=await page.evaluate(()=>{window.responseHidden=true;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.responseHidden});document.dispatchEvent(new Event('visibilitychange'));return performance.now();});
   await page.waitForTimeout(1100);
   const visibleAt=await page.evaluate(()=>{window.responseHidden=false;document.dispatchEvent(new Event('visibilitychange'));return performance.now();});
   await page.waitForTimeout(350);
   const blurredAt=await page.evaluate(()=>{window.dispatchEvent(new Event('blur'));return performance.now();});
   await page.waitForTimeout(1100);
   const focusedAt=await page.evaluate(()=>{window.dispatchEvent(new Event('focus'));return performance.now();});
   await page.waitForTimeout(350);
   assert.equal(await page.evaluate(()=>__game.clock),clock,'combat clock remains paused while solving');
   const first=await submit(page),submittedAt=await page.evaluate(()=>performance.now());
   const visibleElapsed=submittedAt-firstShown-(visibleAt-hiddenAt)-(focusedAt-blurredAt);
   assert(first>=900,'popup did not record visible thinking time: '+first);
   assert(Math.abs(first-visibleElapsed)<500,'hidden/unfocused time included: '+first+' vs '+visibleElapsed);
   await page.waitForTimeout(300);
   await page.evaluate(()=>__game.v2.record({value:__game.state.problem.answer,correct:true}));
   assert.equal(await page.evaluate(()=>__game.v2.answers.length),1,'duplicate answer recorded');
   assert.equal(await page.evaluate(()=>__game.v2.answers[0].responseMs),first,'duplicate changed recorded time');
   await page.locator('#popupContinue').tap();await clearRewards(page);
   await page.evaluate(()=>__game.spawnQuiz());
   await page.waitForTimeout(180);
   const second=await submit(page);
   assert(second>=150&&second<first,'new question did not reset duration');
   await page.locator('#popupContinue').tap();await clearRewards(page);await page.locator('#pauseBtn').tap();await page.locator('#mainMenuBtn').tap();
   await page.locator('#startBtn').tap();await page.waitForTimeout(180);
   const restart=await submit(page);
   assert.equal(await page.evaluate(()=>__game.v2.answers.length),1,'restart kept prior answers');
   assert(restart>=150&&restart<first,'restart did not reset duration');
   assert.deepEqual(errors,[]);console.log('PASS '+engine+' popup visible response time, background/focus exclusion, duplicate protection and restart');
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exit(1);});
