const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const url=process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/';
(async()=>{
 const results=[];fs.mkdirSync('test-results/item-keyboard',{recursive:true});
 for(const engine of process.env.ENGINES?process.env.ENGINES.split(','):process.env.CI?['chromium']:['chromium','webkit']){
  const browser=await (engine==='chromium'?chromium:webkit).launch({headless:true,...(engine==='chromium'&&!process.env.CI?{channel:'msedge'}:{})});
  for(const [width,height]of [[1440,900],[390,844]]){
   const context=await browser.newContext({viewport:{width,height}}),p=await context.newPage(),errors=[];
   p.on('pageerror',e=>errors.push(e.message));await p.goto(url+'?qa=1');await p.waitForFunction(()=>window.__game);await p.locator('#startBtn').click();
   await p.keyboard.down('ArrowRight');
   await p.evaluate(()=>{const r=__game;r.state.levelUpQueue=2;r.openLevelUpPanel();window.choiceClicks=[];r.upgradeChoices.addEventListener('click',e=>{const b=e.target.closest('button');if(b)choiceClicks.push(b.textContent);},true);});
   assert(await p.evaluate(()=>!__game.keys.ArrowRight&&!__game.keys.arrowright),'movement keys must clear when cards open');
   await p.keyboard.up('ArrowRight');
   const cards=p.locator('#upgradeChoices button');assert.equal(await cards.count(),3);await cards.first().evaluate(e=>{if(document.activeElement!==e||!e.classList.contains('item-selected'))throw Error('first card not selected');});
   await p.keyboard.press('ArrowRight');await cards.nth(1).evaluate(e=>{if(document.activeElement!==e)throw Error('right navigation');});
   await p.keyboard.press('ArrowLeft');await p.keyboard.press('ArrowLeft');await cards.last().evaluate(e=>{if(document.activeElement!==e)throw Error('left wrap');});
   await p.keyboard.press('ArrowDown');await cards.first().evaluate(e=>{if(document.activeElement!==e)throw Error('down wrap');});
   await p.keyboard.press('ArrowUp');await cards.last().evaluate(e=>{if(document.activeElement!==e)throw Error('up navigation');});
   await p.screenshot({path:`test-results/item-keyboard/${engine}-${width}.png`});
   const clock=await p.evaluate(()=>__game.clock);await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>__game.clock),clock);
   await p.keyboard.down('Enter');assert.equal(await p.evaluate(()=>choiceClicks.length),1);assert.equal(await p.evaluate(()=>__game.state.levelUpQueue),1);
   await p.keyboard.down('Enter');assert.equal(await p.evaluate(()=>choiceClicks.length),1,'held Enter selected second card');
   await p.keyboard.up('Enter');await p.keyboard.press('Enter');assert.equal(await p.evaluate(()=>choiceClicks.length),2);assert(await p.evaluate(()=>!__game.state.levelUpPending&&!__game.state.paused));
   await p.keyboard.press('Enter');assert.equal(await p.evaluate(()=>choiceClicks.length),2,'hidden card selected again');
   await p.evaluate(()=>{__game.state.levelUpQueue=1;__game.openLevelUpPanel();});await cards.nth(1).click();assert.equal(await p.evaluate(()=>choiceClicks.length),3);assert(await p.evaluate(()=>!__game.state.levelUpPending));
   // Actual shop rewards; unaffordable/unavailable buttons are skipped.
   await p.evaluate(()=>{const r=__game;r.state.hp=r.state.maxHp;r.state.shield=0;r.state.mathEnergy=0;for(let i=0;i<100;i++)r.v3.content.killed({elite:false});r.v3.content.interact(r.v3.content.spawnEvent('merchant'));});
   assert(await p.locator('#merchantPopup [data-good="heal"]').isDisabled());
   // The shop floats over the game in the middle of the screen; the page must not scroll down to it.
   const shop=await p.evaluate(()=>({scroll:scrollY,doc:document.documentElement.scrollHeight,card:document.querySelector('#merchantPopup .card').getBoundingClientRect().toJSON()}));
   assert.equal(shop.scroll,0);assert(shop.doc<=height,'page grew under the shop: '+JSON.stringify(shop));
   assert(shop.card.top>=0&&shop.card.bottom<=height&&Math.abs(shop.card.left+shop.card.width/2-width/2)<2,'shop card not centered: '+JSON.stringify(shop));
   await p.locator('#merchantPopup [data-good="shield"]').evaluate(e=>{if(document.activeElement!==e||!e.classList.contains('item-selected'))throw Error('shop initial focus');});
   await p.keyboard.press('ArrowRight');await p.locator('#merchantPopup [data-good="energy"]').evaluate(e=>{if(document.activeElement!==e)throw Error('shop navigation');});
   const gold=await p.evaluate(()=>__game.v3.content.runGold);await p.keyboard.press('Enter');assert.equal(await p.locator('#merchantPopup').count(),0);assert.equal(await p.evaluate(()=>__game.state.mathEnergy),25);assert.equal(await p.evaluate(()=>__game.v3.content.runGold),gold-25);
   await p.evaluate(()=>{const r=__game;r.v3.content.interact(r.v3.content.spawnEvent('merchant'));});await p.locator('#closeMerchant').focus();await p.keyboard.press('Enter');assert.equal(await p.locator('#merchantPopup').count(),0);
   assert.deepEqual(errors,[]);results.push({engine,width,height,passed:true});console.log(`PASS item keyboard ${engine} ${width}`);await context.close();
  }await browser.close();
 }fs.writeFileSync('test-results/item-keyboard/report.json',JSON.stringify({url,results},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
