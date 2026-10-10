const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const base=process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/';
(async()=>{
 const results=[];fs.mkdirSync('test-results/compact-home',{recursive:true});
 for(const engine of process.env.CI?['chromium']:['chromium','webkit']){
  const browser=await (engine==='webkit'?webkit:chromium).launch({headless:true,...(engine==='chromium'&&!process.env.CI?{channel:'msedge'}:{})});
  for(const [width,height]of [[320,568],[390,844],[768,1024],[1920,1080]]){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));await page.goto(base+'?qa=1');await page.waitForFunction(()=>window.__game);await page.evaluate(()=>document.fonts.ready);
   assert.equal(await page.locator('#curriculumInfo,.curriculumNote').count(),0);
   assert.equal(await page.locator('#homeSettings').evaluate(e=>e.open),false);
   assert.equal(await page.locator('#startPanel select:visible').count(),1);
   const bounds=await page.locator('#startBtn').boundingBox();assert(bounds.y>=0&&bounds.y+bounds.height<=height,'start must fit the first portrait screen');
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   await page.screenshot({path:`test-results/compact-home/${engine}-${width}.png`});
   await page.selectOption('#grade','4');await page.locator('#startBtn').tap();assert.equal(await page.evaluate(()=>__game.v2.config.grade),4);
   await page.locator('#pauseBtn').tap();await page.locator('#mainMenuBtn').tap();
   await page.locator('#homeSettings > summary').tap();await page.selectOption('#mode','explore');await page.fill('#target','2');await page.selectOption('#questionMode','popup');
   assert((await page.locator('#quickSummary').textContent()).includes('수학 탐험'));
   await page.locator('#homeSettings > summary').tap();await page.locator('#startBtn').tap();assert.equal(await page.evaluate(()=>__game.v2.config.target),2);
   await page.locator('#pauseBtn').tap();await page.locator('#mainMenuBtn').tap();await page.reload();await page.waitForFunction(()=>window.__game);
   assert.equal(await page.locator('#homeSettings').evaluate(e=>e.open),false);assert.equal(await page.inputValue('#mode'),'explore');assert.equal(await page.inputValue('#target'),'2');
   assert.deepEqual(errors,[]);results.push({engine,width,height,passed:true});await context.close();console.log(`PASS compact home ${engine} ${width}`);
  }await browser.close();
 }fs.writeFileSync('test-results/compact-home/report.json',JSON.stringify({base,results,scope:'Browser viewport emulation, not physical-device testing'},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
