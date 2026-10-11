const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
(async()=>{
 const browser=await chromium.launch({headless:true});
 for(const width of [1440,390]){
  const context=await browser.newContext({viewport:{width,height:900},hasTouch:width===390,isMobile:width===390,acceptDownloads:true});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/')+'?qa=1');
  await page.waitForFunction(()=>window.__game);await require('./home-settings.cjs')(page);
  await page.selectOption('#mode','explore');await page.fill('#target','2');
  const play=async(wrong)=>{
   await page.click('#startBtn');
   for(const correct of [!wrong,true]){
    await page.evaluate(c=>__game.resolveAnswer(__game.answerOrbs.find(o=>o.correct===c)),correct);
    await page.click('#continueQuestion');
   }
  };
  await play(false);assert(await page.locator('#exportCSV').isDisabled());
  assert((await page.locator('#exportTableHelp').textContent()).includes('틀린 문제가 없어'));
  await page.click('#toStartBtn');await play(true);
  assert.equal(await page.locator('#exportJSON').count(),0);
  assert.equal(await page.locator('#exportCSV').textContent(),'틀린 문제와 해설 저장');
  assert(await page.locator('#exportCSV').isEnabled());
  const review=await page.evaluate(()=>__game.v2.result.reviewProblems);
  assert.equal(review.length,1);assert.equal(await page.locator('.reviewRow').count(),1);
  const event=page.waitForEvent('download');
  if(width===390)await page.locator('#exportCSV').tap();else await page.click('#exportCSV');
  const download=await event,csv=fs.readFileSync(await download.path(),'utf8');
  assert(download.suggestedFilename().startsWith('틀린-문제와-해설-'));
  assert(csv.startsWith('\uFEFF"문제","내 답","정답","해설"'));
  for(const value of [review[0].text,review[0].selected,review[0].answer,review[0].explain])assert(csv.includes(String(value).replaceAll('"','""')));
  assert.deepEqual(errors,[]);console.log('PASS review export '+width+'px: correct-only, retry, wrong explanation download');
  await context.close();
 }
 await browser.close();
})().catch(e=>{console.error(e);process.exitCode=1;});
