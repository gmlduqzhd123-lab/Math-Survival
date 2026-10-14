const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 for(const width of [390,1440]){
  const context=await browser.newContext({viewport:{width,height:900}}),page=await context.newPage();
  let release;const gate=new Promise(resolve=>release=resolve);
  await page.route('**/src/main.js*',async route=>{await gate;await route.continue();});
  await page.goto((process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/')+'?qa=1',{waitUntil:'domcontentloaded'});
  await page.waitForTimeout(150);
  assert(await page.locator('#loadingPanel').isVisible());
  assert.equal(await page.locator('#startPanel').isVisible(),false);
  assert.equal(await page.locator('#joystickZone').isVisible(),false);
  assert.equal(await page.locator('#startBtn').isVisible(),false);
  release();await page.waitForFunction(()=>!document.body.classList.contains('app-booting'));
  assert.equal(await page.locator('#loadingPanel').count(),0);
  assert(await page.locator('#quickStart').isVisible());assert(await page.locator('#homeSettings').isVisible());
  assert(await page.locator('#startBtn').isEnabled());
  await page.click('#startBtn');assert(await page.evaluate(()=>__game.state.running));
  console.log('PASS first paint '+width+'px: no unfinished menu/control flash, ready and playable');
  await context.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
