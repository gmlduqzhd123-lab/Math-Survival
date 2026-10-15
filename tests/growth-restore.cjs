const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict');
const ROOT=process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/';
const GROWTH='math-survival-3.progress.v1',LEARNING='math-survival-2.learning.v2';
const upload=(page,data)=>page.locator('#gameRestore').setInputFiles({name:'growth.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(data))});
const ready=async page=>{await page.goto(ROOT+'?qa=1');await page.waitForFunction(()=>window.__game);};
const openGrowth=async page=>{
 await page.locator('#homeExtras > summary').click();
 await page.locator('#homeCollection > summary').click();
 await page.locator('#gameRestore').evaluate(el=>el.closest('details').open=true);
};
(async()=>{
 const engine=process.env.ENGINE==='webkit'?webkit:chromium,browser=await engine.launch({headless:true});
 try{
  for(const viewport of [{width:390,height:844},{width:1280,height:800}]){
   const context=await browser.newContext({viewport,hasTouch:viewport.width===390,isMobile:viewport.width===390}),page=await context.newPage(),errors=[];
   page.on('pageerror',e=>errors.push(e.message));await ready(page);await openGrowth(page);
   const hasAudio=await page.evaluate(()=>!!(window.AudioContext||window.webkitAudioContext));
   if(hasAudio)await page.waitForFunction(()=>__game.musicTimer?.status==='playing');
   const learningBefore=await page.evaluate(key=>localStorage.getItem(key),LEARNING);
   const backup=await page.evaluate(()=>structuredClone(__game.v3.progress.data));backup.audio={master:0,music:.15,effects:.25};
   await page.evaluate(()=>window.beforeRestoreMusic=__game.musicTimer);
   await upload(page,backup);await page.locator('#gameRestoreApply').click();
   assert.deepEqual(await page.locator('#masterVolume,#musicVolume,#effectsVolume').evaluateAll(els=>els.map(el=>Number(el.value))),[0,.15,.25]);
   if(hasAudio){
    const gains=await page.evaluate(()=>[__game.masterGain.gain.value,__game.musicGain.gain.value,__game.sfxGain.gain.value]);
    for(const [i,expected]of [0,.018,.055].entries())assert(Math.abs(gains[i]-expected)<1e-6);
    assert(await page.evaluate(()=>__game.musicTimer===beforeRestoreMusic));
   }
   const savedBefore=await page.evaluate(key=>localStorage.getItem(key),GROWTH);
   await upload(page,{...backup,history:[null]});await page.waitForFunction(()=>gameRestorePreview.textContent.includes('게임 기록 형식 오류'));
   assert(await page.locator('#gameRestoreApply').isHidden());
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),GROWTH),savedBefore);
   assert.equal(await page.evaluate(key=>localStorage.getItem(key),LEARNING),learningBefore);
   await page.reload();await page.waitForFunction(()=>window.__game);
   assert.equal(await page.locator('#masterVolume').inputValue(),'0');assert.deepEqual(errors,[]);
   await context.close();console.log(`PASS growth import: ${viewport.width}px live volume, invalid-file rejection, unchanged learning records and reload`);
  }
  const context=await browser.newContext(),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  const fixture=structuredClone(require('./v3-fixture.cjs'));fixture.history=[null];const corrupted=JSON.stringify(fixture);
  await context.addInitScript(({key,raw})=>localStorage.setItem(key,raw),{key:GROWTH,raw:corrupted});
  await ready(page);assert(await page.evaluate(()=>__game.v3.progress.blocked));
  await page.locator('#startBtn').click();assert(await page.evaluate(()=>__game.state.running));
  assert.equal(await page.evaluate(key=>localStorage.getItem(key),GROWTH),corrupted);assert.deepEqual(errors,[]);
  await context.close();console.log('PASS damaged saved growth remains untouched while the game starts safely');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
