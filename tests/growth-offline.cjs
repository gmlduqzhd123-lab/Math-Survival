const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.BUILD_URL||'http://127.0.0.1:4174/Math-Survival/')+'?qa=1');
  await page.waitForFunction(()=>window.__game);await page.evaluate(()=>navigator.serviceWorker.ready);
  await page.waitForFunction(()=>navigator.serviceWorker.controller);
  const learning=await page.evaluate(()=>localStorage.getItem('math-survival-2.learning.v2'));
  await context.setOffline(true);await page.reload();await page.waitForFunction(()=>window.__game);
  await require('./home-settings.cjs')(page);
  // Reveal the nested growth section through its normal disclosure control.
  const growth=page.locator('#gameRestore').locator('xpath=ancestor::details[1]');
  if(!await growth.evaluate(e=>e.open))await growth.locator(':scope > summary').tap();
  const backup=await page.evaluate(()=>structuredClone(__game.v3.progress.data));
  backup.coins=73;backup.totalGold=Math.max(73,backup.totalGold);backup.audio={master:.3,music:.2,effects:.4};
  await page.locator('#gameRestore').setInputFiles({name:'growth.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(backup))});
  await page.waitForFunction(()=>document.getElementById('gameRestorePreview').textContent);
  assert(await page.locator('#gameRestoreApply').isVisible(),await page.locator('#gameRestorePreview').textContent());
  await page.locator('#gameRestoreApply').tap();
  assert.equal(await page.evaluate(()=>__game.v3.progress.data.coins),73);
  assert.equal(await page.locator('#masterVolume').inputValue(),'0.3');
  assert.equal(await page.evaluate(()=>localStorage.getItem('math-survival-2.learning.v2')),learning);
  await page.locator('#startBtn').tap();assert(await page.evaluate(()=>__game.state.running));
  assert.deepEqual(errors,[]);console.log('PASS built offline growth file restore, volume settings, preserved learning and game start');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
