const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const url=process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/';
const out='test-results/simple-play';fs.mkdirSync(out,{recursive:true});
const profiles=[['small-phone',320,568],['phone',390,844],['landscape',844,390],['tablet',768,1024],['tablet-wide',1024,768],['desktop',1920,1080]];
(async()=>{
 const results=[];
 for(const engine of process.env.CI?['chromium']:['chromium','webkit']){
  const browser=await (engine==='chromium'?chromium:webkit).launch({headless:true,...(engine==='chromium'&&!process.env.CI?{channel:'msedge'}:{})});
  for(const [name,width,height]of profiles){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:name!=='desktop'});
   const p=await context.newPage(),errors=[];p.setDefaultTimeout(8000);p.on('pageerror',e=>errors.push(e.message));
   await p.goto(url+'?qa=1');await p.waitForFunction(()=>window.__game);await require('./home-settings.cjs')(p);
   await p.selectOption('#mode','survival');await p.selectOption('#unit','g3-div');await p.evaluate(()=>document.fonts.ready);await p.locator('#startBtn').tap();await p.waitForFunction(()=>__game.clock>200);
   assert(await p.locator('#healthMeter').isVisible());assert(await p.locator('#experienceMeter').isVisible());
   assert.equal(await p.locator('#answerBar').isVisible(),false);assert.equal(await p.locator('#skillBtn').isVisible(),false);
   assert.equal(await p.locator('#mainMenuBtn').isVisible(),false);
   const layout=await p.evaluate(()=>({w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight,field:document.querySelector('#game').getBoundingClientRect().toJSON()}));
   assert(layout.w<=width&&layout.h<=height);assert(layout.field.height>(name==='landscape'?130:height*.5),'calculation field too small: '+JSON.stringify(layout));
   await p.screenshot({path:`${out}/${engine}-${name}.png`});
   await p.locator('#mapToggle').tap();assert.equal(await p.evaluate(()=>__game.v2.playUI.mapVisible),true);
   await p.locator('#pauseBtn').tap();assert(await p.locator('#playMenu').isVisible());
   const time=await p.evaluate(()=>__game.clock);await p.waitForTimeout(150);assert.equal(await p.evaluate(()=>__game.clock),time);
   await p.locator('#playPreferences summary').tap();await p.locator('#autoSkillToggle').uncheck();await p.selectOption('#combatAnswerMode','buttons');
   await p.locator('#menuReduced').check();assert(await p.locator('#reducedMotion').isChecked());
   await p.locator('#resumePlay').tap();assert.equal(await p.locator('#playMenu').isVisible(),false);assert(await p.locator('#skillBtn').isVisible());assert(await p.locator('#answerBar').isVisible());
   if(engine==='chromium'){
    const box=await p.locator('#joystickZone').boundingBox(),x=box.x+box.width/2,y=box.y+box.height/2,before=await p.evaluate(()=>__game.player.x);
    const cdp=await context.newCDPSession(p);await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x,y}]});await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:x+22,y}]});await p.waitForTimeout(130);await cdp.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert(await p.evaluate(v=>__game.player.x>v&&!__game.isJoystickActive,before));
   }
   await p.locator('#dashBtn').tap();await p.waitForFunction(()=>__game.player.dashCooldown>0);
   const correct=await p.evaluate(()=>__game.answerOrbs.findIndex(x=>x.correct));await p.locator('#answerAccess button').nth(correct).tap();assert.equal(await p.locator('#answerBar').isVisible(),false);assert(await p.locator('#explanation').isVisible());
   await p.keyboard.press('p');assert(await p.locator('#playMenu').isVisible());await p.keyboard.press('Escape');assert.equal(await p.locator('#playMenu').isVisible(),false);assert(await p.evaluate(()=>__game.state.running&&!__game.state.paused));
   await p.locator('#pauseBtn').tap();await p.locator('#mainMenuBtn').tap();assert.equal(await p.locator('#playMenu').isVisible(),false);
   assert.equal(await p.evaluate(()=>__game.v2.store.data.records.length),1);
   await p.reload();await p.waitForFunction(()=>window.__game);await require('./home-settings.cjs')(p);assert.equal(await p.evaluate(()=>__game.v2.store.data.records.length),1);
   await p.selectOption('#mode','explore');await p.locator('#startBtn').tap();assert(await p.locator('#answerAccess').isVisible());
   const i=await p.evaluate(()=>__game.answerOrbs.findIndex(x=>x.correct));await p.locator('#answerAccess button').nth(i).tap();assert(await p.locator('#continueQuestion').isVisible());await p.locator('#continueQuestion').tap();assert(await p.locator('#answerAccess').isVisible());
   await p.locator('#pauseBtn').tap();await p.locator('#mainMenuBtn').tap();
   await p.selectOption('#mode','boss');await p.locator('#startBtn').tap();await p.locator('#bossHUD').waitFor({state:'visible'});await p.locator('#pauseBtn').tap();await p.locator('#quitGameBtn').tap();assert.equal(await p.evaluate(()=>__game.v2.result.outcome),'quit');
   await p.locator('#restartBtn').tap();await p.locator('#pauseBtn').tap();await p.locator('#mainMenuBtn').tap();
   // Graph questions reserve additional readable space; measure them separately from short calculations.
   await p.selectOption('#mode','survival');await p.selectOption('#unit','g3-data');await p.locator('#startBtn').tap();
   await p.locator('#pauseBtn').tap();await p.locator('#playPreferences summary').tap();await p.selectOption('#combatAnswerMode','orbs');await p.locator('#resumePlay').tap();
   assert(await p.locator('#questionVisual').isVisible());
   const graph=await p.evaluate(()=>({w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight,field:document.querySelector('#game').getBoundingClientRect().toJSON(),visual:document.querySelector('#questionVisual').getBoundingClientRect().toJSON(),area:document.querySelector('#learningArea').getBoundingClientRect().toJSON()}));
   assert(graph.w<=width&&graph.h<=height);assert(graph.field.height>(name==='landscape'?130:height*.4),'graph field too small: '+JSON.stringify(graph));
   assert(graph.visual.left>=graph.area.left&&graph.visual.right<=graph.area.right,'graph clipped horizontally');assert(graph.visual.bottom<=graph.area.bottom+1,'graph clipped vertically');
   await p.locator('#pauseBtn').tap();await p.locator('#mainMenuBtn').tap();
   await p.selectOption('#unit','g3-div');await p.selectOption('#mode','survival');await p.selectOption('#questionMode','popup');await p.locator('#startBtn').tap();assert(await p.locator('#mathPopup').isVisible());assert.equal(await p.locator('#answerBar').isVisible(),false);
   assert.deepEqual(errors,[]);results.push({engine,profile:name,width,height,passed:true,layout,graph});console.log(`PASS ${engine} ${name}`);await context.close();
  }await browser.close();
 }
 fs.writeFileSync(`${out}/report.json`,JSON.stringify({timestamp:new Date().toISOString(),url,scope:'Desktop browser engines with viewport and touch emulation; no physical device certification',results},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
