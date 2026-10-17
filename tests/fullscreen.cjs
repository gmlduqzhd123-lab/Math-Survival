const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const url=process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/';
const out='test-results/fullscreen';fs.mkdirSync(out,{recursive:true});
const profiles=[['phone',390,844,true],['phone-landscape',844,390,true],['tablet',768,1024,true],['desktop',1366,768,false]];
const isFull=p=>p.evaluate(()=>!!document.fullscreenElement);
(async()=>{
 const browser=await chromium.launch({headless:true,...(!process.env.CI?{channel:'msedge'}:{})});
 for(const [name,width,height,mobile]of profiles){
  const context=await browser.newContext({viewport:{width,height},hasTouch:mobile,isMobile:mobile});
  await context.addInitScript(()=>{if(!localStorage.getItem('math-survival.ui.v1'))localStorage.setItem('math-survival.ui.v1',JSON.stringify({fullscreen:true}));});
  const p=await context.newPage(),errors=[];p.setDefaultTimeout(8000);p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url+'?qa=1');await p.waitForFunction(()=>window.__game);await require('./home-settings.cjs')(p);
  await p.selectOption('#mode','survival');await p.evaluate(()=>document.fonts.ready);
  await p.locator('#startBtn').click();await p.waitForFunction(()=>__game.clock>200);
  await p.waitForFunction(()=>!!document.fullscreenElement);
  const layout=await p.evaluate(()=>({w:document.documentElement.scrollWidth,h:document.documentElement.scrollHeight,wrap:document.querySelector('#wrap').getBoundingClientRect().toJSON()}));
  assert(layout.w<=width&&layout.h<=height,'page overflows in fullscreen: '+JSON.stringify(layout));
  assert(Math.round(layout.wrap.width)===width&&Math.round(layout.wrap.height)===height,'game does not fill the screen: '+JSON.stringify(layout));
  await p.screenshot({path:`${out}/${name}.png`});
  // The menu turns fullscreen off, and the choice is kept for the next start.
  await p.locator('#pauseBtn').click();await p.waitForFunction(()=>document.querySelector('#fullscreenBtn').textContent==='↙ 전체화면 끄기');
  await p.screenshot({path:`${out}/${name}-menu.png`});
  await p.locator('#fullscreenBtn').click();await p.waitForFunction(()=>!document.fullscreenElement);
  await p.waitForFunction(()=>document.querySelector('#fullscreenBtn').textContent==='⛶ 전체화면');assert(await p.locator('#playMenu').isVisible());
  await p.locator('#mainMenuBtn').click();await p.locator('#startBtn').click();await p.waitForFunction(()=>__game.clock>200);
  await p.waitForTimeout(150);assert.equal(await isFull(p),false);
  await p.locator('#pauseBtn').click();await p.locator('#fullscreenBtn').click();await p.waitForFunction(()=>!!document.fullscreenElement);
  assert.equal(JSON.parse(await p.evaluate(()=>localStorage.getItem('math-survival.ui.v1'))).fullscreen,true);
  await p.locator('#resumePlay').click();assert(await p.evaluate(()=>__game.state.running&&!__game.state.paused));
  assert.deepEqual(errors,[]);await context.close();console.log('PASS',name);
 }
 // Browsers without page fullscreen (iPhone Safari) get a tip instead of a button that does nothing.
 const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
 await context.addInitScript(()=>{delete Element.prototype.requestFullscreen;delete Element.prototype.webkitRequestFullscreen;});
 const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(url+'?qa=1');await p.waitForFunction(()=>window.__game);await require('./home-settings.cjs')(p);
 await p.selectOption('#mode','survival');await p.locator('#startBtn').click();await p.waitForFunction(()=>__game.clock>200);
 const wrap=await p.evaluate(()=>document.querySelector('#wrap').getBoundingClientRect().toJSON());assert(Math.round(wrap.height)===844&&Math.round(wrap.width)===390);
 await p.locator('#pauseBtn').click();assert.equal(await p.locator('#fullscreenBtn').count(),0);assert(await p.locator('#fullscreenTip').isVisible());
 await p.screenshot({path:`${out}/no-fullscreen-menu.png`});
 assert.deepEqual(errors,[]);await context.close();console.log('PASS no-fullscreen');
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
