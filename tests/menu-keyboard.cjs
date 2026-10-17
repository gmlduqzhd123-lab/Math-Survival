const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const url=process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/';
(async()=>{
 const results=[];fs.mkdirSync('test-results/menu-keyboard',{recursive:true});
 for(const engine of process.env.ENGINES?process.env.ENGINES.split(','):process.env.CI?['chromium']:['chromium','webkit']){
  const browser=await (engine==='chromium'?chromium:webkit).launch({headless:true,...(engine==='chromium'&&!process.env.CI?{channel:'msedge'}:{})});
  for(const [width,height]of [[1440,900],[390,844]]){
   const context=await browser.newContext({viewport:{width,height}}),p=await context.newPage(),errors=[];
   p.on('pageerror',e=>errors.push(e.message));await p.goto(url+'?qa=1');await p.waitForFunction(()=>window.__game);await p.locator('#startBtn').waitFor({state:'visible'});
   await p.keyboard.press('ArrowDown');await p.locator('#startBtn').evaluate(e=>{if(document.activeElement!==e||!e.classList.contains('item-selected'))throw Error('home initial selection');});
   await p.keyboard.press('ArrowDown');await p.locator('#homeSettings>summary').evaluate(e=>{if(document.activeElement!==e)throw Error('home down');});
   await p.keyboard.down('Enter');assert(await p.locator('#homeSettings').evaluate(e=>e.open));await p.keyboard.down('Enter');assert(await p.locator('#homeSettings').evaluate(e=>e.open),'repeat Enter closed settings');await p.keyboard.up('Enter');await p.keyboard.press('Enter');assert.equal(await p.locator('#homeSettings').evaluate(e=>e.open),false);
   await p.keyboard.press('ArrowDown');await p.keyboard.press('Enter');assert(await p.locator('.originalHelp').evaluate(e=>e.open));await p.keyboard.press('Enter');assert.equal(await p.locator('.originalHelp').evaluate(e=>e.open),false);
   await p.keyboard.press('ArrowRight');await p.locator('#homeExtras>summary').evaluate(e=>{if(document.activeElement!==e)throw Error('home right');});await p.keyboard.press('ArrowLeft');await p.locator('.originalHelp>summary').evaluate(e=>{if(document.activeElement!==e)throw Error('home left');});
   await p.locator('.qrChip').focus();await p.keyboard.press('Enter');await p.locator('.yq-close').waitFor({state:'visible'});await p.keyboard.press('ArrowDown');await p.locator('.yq-close').evaluate(e=>{if(document.activeElement!==e)throw Error('home navigation escaped QR dialog');});await p.keyboard.press('Enter');assert.equal(await p.locator('.yq-close').count(),0);await p.locator('.originalHelp>summary').focus();
   await p.keyboard.press('ArrowUp');await p.keyboard.press('ArrowUp');await p.locator('#startBtn').evaluate(e=>{if(document.activeElement!==e)throw Error('home up');});
   await p.keyboard.press('Shift+Tab');assert.equal(await p.locator('#studentNo').evaluate(e=>document.activeElement===e),true,'student number before start');await p.keyboard.press('Shift+Tab');assert.equal(await p.locator('#grade').evaluate(e=>document.activeElement===e),true,'native form tab order');const before=await p.inputValue('#grade');await p.keyboard.press('ArrowDown');assert.equal(await p.locator('#grade').evaluate(e=>document.activeElement===e),true,'native select key hijacked');await p.keyboard.press('Tab');await p.keyboard.press('Tab');await p.locator('#startBtn').evaluate(e=>{if(document.activeElement!==e)throw Error('Tab exits select');});
   await p.screenshot({path:`test-results/menu-keyboard/${engine}-${width}-home.png`});
   await p.keyboard.down('Enter');assert(await p.evaluate(()=>__game.state.running));await p.keyboard.down('Enter');assert.equal(await p.evaluate(()=>__game.v2.answers.length),0);await p.keyboard.up('Enter');
   await p.keyboard.press('p');await p.locator('#resumePlay').evaluate(e=>{if(document.activeElement!==e||!e.classList.contains('item-selected'))throw Error('pause initial selection');});
   const clock=await p.evaluate(()=>__game.clock);await p.keyboard.press('ArrowDown');await p.locator('#playSound').evaluate(e=>{if(document.activeElement!==e)throw Error('pause down');});
   const muted=await p.evaluate(()=>__game.muted);await p.keyboard.press('Enter');assert.equal(await p.evaluate(()=>__game.muted),!muted);assert(await p.locator('#playMenu').isVisible());
   await p.locator('#playPreferences>summary').focus();await p.keyboard.press('Enter');assert(await p.locator('#playPreferences').evaluate(e=>e.open));await p.keyboard.press('Tab');assert.equal(await p.locator('#autoSkillToggle').evaluate(e=>document.activeElement===e),true);const auto=await p.locator('#autoSkillToggle').isChecked();await p.keyboard.press('Space');assert.equal(await p.locator('#autoSkillToggle').isChecked(),!auto);
   await p.locator('#playPreferences>summary').focus();await p.keyboard.press('Enter');assert.equal(await p.locator('#playPreferences').evaluate(e=>e.open),false);await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>__game.clock),clock);
   await p.locator('#resumePlay').focus();await p.screenshot({path:`test-results/menu-keyboard/${engine}-${width}-pause.png`});await p.keyboard.down('Enter');assert.equal(await p.locator('#playMenu').isVisible(),false);await p.keyboard.down('Enter');assert.equal(await p.locator('#playMenu').isVisible(),false,'held Enter reopened pause');await p.keyboard.up('Enter');
   await p.keyboard.press('p');await p.keyboard.press('Escape');assert.equal(await p.locator('#playMenu').isVisible(),false);
   await p.keyboard.press('p');await p.locator('#mainMenuBtn').focus();await p.keyboard.press('Enter');assert(await p.locator('#startPanel').isVisible());await p.keyboard.press('ArrowDown');assert(await p.evaluate(()=>document.getElementById('startPanel').contains(document.activeElement)));
   assert.deepEqual(errors,[]);results.push({engine,width,height,passed:true});console.log(`PASS menu keyboard ${engine} ${width}`);await context.close();
  }await browser.close();
 }fs.writeFileSync('test-results/menu-keyboard/report.json',JSON.stringify({url,results},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
