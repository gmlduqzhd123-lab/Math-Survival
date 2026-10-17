// The first screen fills the window on every device, and its "quit" button keeps the saved run,
// leaves fullscreen, tries to close the tab and otherwise shows a goodbye screen.
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const url=process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/';
const out='test-results/home-exit';fs.mkdirSync(out,{recursive:true});
const devices=[['desktop',1920,1080,false],['laptop',1366,768,false],['tablet',820,1180,true],['phone',390,844,true],['small-phone',360,640,true],['phone-landscape',844,390,true]];
(async()=>{
 const browser=await chromium.launch({headless:true});
 for(const [name,width,height,touch]of devices){
  const context=await browser.newContext({viewport:{width,height},hasTouch:touch,isMobile:touch});
  // Pretend the page is fullscreen and the browser refuses window.close(), as most do for a tab the user opened.
  await context.addInitScript(()=>{let full=true;window.__closeCalls=0;window.close=()=>{window.__closeCalls++;};
   Object.defineProperty(document,'fullscreenElement',{configurable:true,get:()=>full?document.documentElement:null});
   document.exitFullscreen=()=>{full=false;window.__exitedFullscreen=true;return Promise.resolve();};});
  const p=await context.newPage(),errors=[];p.setDefaultTimeout(8000);p.on('pageerror',e=>errors.push(e.message));
  await p.goto(url+'?qa=1');await p.waitForFunction(()=>window.__game);
  const box=await p.evaluate(()=>{const r=document.querySelector('#startPanel .card').getBoundingClientRect(),s=getComputedStyle(document.querySelector('#startPanel .card'));
   return {x:r.x,y:r.y,w:r.width,h:r.height,radius:s.borderTopLeftRadius,border:s.borderTopWidth,scroll:document.documentElement.scrollWidth};});
  assert.deepEqual([box.x,box.y,box.w],[0,0,width],`${name}: home fills the width`);
  assert(box.h>=height,`${name}: home fills the height`);assert.equal(box.radius,'0px');assert.equal(box.border,'0px');assert.equal(box.scroll,width,`${name}: no sideways scroll`);
  const chips=await p.evaluate(()=>[...document.querySelectorAll('#startPanel .topChips button')].filter(b=>b.offsetParent).map(b=>{const r=b.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom,b.textContent];}));
  const quit=chips.find(c=>/게임 종료/.test(c[4]));assert(quit,`${name}: quit button shown`);
  assert(quit[0]>=0&&quit[2]<=width&&quit[1]>=0,`${name}: quit button on screen`);
  for(const c of chips)if(c!==quit)assert(c[2]<=quit[0]||c[0]>=quit[2]||c[3]<=quit[1]||c[1]>=quit[3],`${name}: chips do not overlap`);
  const pals=await p.evaluate(()=>{const r=document.querySelector('#startPanel .homePals').getBoundingClientRect();return r.width?[r.left,r.top,r.right,r.bottom]:null;});
  if(pals)for(const c of chips)assert(c[2]<=pals[0]||c[0]>=pals[2]||c[3]<=pals[1]||c[1]>=pals[3],`${name}: chips clear the characters`);
  await p.screenshot({path:`${out}/${name}-home.png`});
  if(name==='desktop'||name==='phone'){
   // Leave a saved run, then quit from the first screen.
   await require('./home-settings.cjs')(p);await p.click('#startBtn');await p.waitForFunction(()=>__game.state.running&&__game.clock>1000);
   await p.click('#pauseBtn');await p.click('#saveExitBtn');assert(await p.locator('#continueBox').isVisible());
   await p.click('#exitAppBtn');
   await p.waitForFunction(()=>window.__closeCalls>0);
   assert(await p.evaluate(()=>window.__exitedFullscreen),`${name}: fullscreen left`);
   assert(await p.locator('#exitPanel').isVisible(),`${name}: goodbye screen shown`);assert.equal(await p.locator('#startPanel').isVisible(),false);
   assert.match(await p.locator('#exitPanel').textContent(),/탭을 닫아도 돼요/);assert(await p.locator('#exitSaved').isVisible(),`${name}: says the run is saved`);
   await p.screenshot({path:`${out}/${name}-goodbye.png`});
   await p.click('#exitBackBtn');assert(await p.locator('#startPanel').isVisible());assert(await p.locator('#continueBox').isVisible(),`${name}: run still saved`);
  }
  if(name==='laptop'){
   // Without a saved run the goodbye screen does not claim one.
   await p.click('#exitAppBtn');assert(await p.locator('#exitPanel').isVisible());assert.equal(await p.locator('#exitSaved').isVisible(),false);await p.click('#exitBackBtn');
  }
  assert.deepEqual(errors,[]);await context.close();console.log('home-exit ok',name);
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exit(1);});
