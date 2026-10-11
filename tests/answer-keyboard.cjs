const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const url=process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/';
(async()=>{
 const results=[];fs.mkdirSync('test-results/answer-keyboard',{recursive:true});
 for(const engine of process.env.CI?['chromium']:['chromium','webkit']){
  const browser=await (engine==='chromium'?chromium:webkit).launch({headless:true,...(engine==='chromium'&&!process.env.CI?{channel:'msedge'}:{})});
  for(const [width,height]of [[1440,900],[390,844]])for(const mode of ['explore','popup','buttons','orbs']){
   const context=await browser.newContext({viewport:{width,height}}),p=await context.newPage(),errors=[];
   p.on('pageerror',e=>errors.push(e.message));
   if(mode==='buttons')await context.addInitScript(()=>localStorage.setItem('math-survival.ui.v1',JSON.stringify({answers:'buttons',autoSkill:true,map:false})));
   await p.goto(url+'?qa=1');await p.waitForFunction(()=>window.__game);await require('./home-settings.cjs')(p);
   await p.selectOption('#mode',mode==='explore'?'explore':'survival');await p.selectOption('#questionMode',mode==='popup'?'popup':'orbs');if(mode==='explore')await p.fill('#target','3');
   await p.locator('#startBtn').click();
   const root=mode==='popup'?'#popupOptions':'#answerAccess',buttons=p.locator(root+' button');
   await p.evaluate(()=>{__game.items=[];__game.expDrops=[];__game.enemies=[];__game.state.mission=null;__game.answerOrbs.forEach((o,i)=>{o.x=__game.player.x+1200+i*100;o.y=__game.player.y+1200;});});
   if(mode==='orbs'){
    assert.equal(await p.locator('#answerBar').isVisible(),false);const x=await p.evaluate(()=>__game.player.x);await p.keyboard.down('ArrowRight');await p.waitForFunction(x=>__game.player.x>x,x);await p.keyboard.up('ArrowRight');
   }else{
    await buttons.first().evaluate(e=>{if(document.activeElement!==e||!e.classList.contains('item-selected'))throw Error('first answer focus');});
    const x=await p.evaluate(()=>__game.player.x);await p.keyboard.press('ArrowRight');await buttons.nth(1).evaluate(e=>{if(document.activeElement!==e)throw Error('right selection');});await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>__game.player.x),x,'arrow selection moved player');
    if(mode==='buttons'){await p.keyboard.down('d');await p.waitForFunction(x=>__game.player.x>x,x);await p.keyboard.up('d');await buttons.nth(1).evaluate(e=>{if(document.activeElement!==e)throw Error('WASD changed answer selection');});}
    await p.keyboard.press('ArrowLeft');await p.keyboard.press('ArrowLeft');await buttons.last().evaluate(e=>{if(document.activeElement!==e)throw Error('left wrap');});
    await p.keyboard.press('ArrowUp');assert(await p.evaluate(root=>document.querySelector(root).contains(document.activeElement),root));await p.keyboard.press('ArrowDown');
    if(mode==='popup'){await p.locator('#popupHint').focus();await p.keyboard.press('Enter');assert(await p.evaluate(()=>__game.state.problem.hintUsed),'hint Enter was intercepted');}
    const target=await p.evaluate(()=>__game.state.problem.options.findIndex(value=>__game.v2.isCorrect(value,__game.state.problem.answer)));
    await buttons.first().focus();for(let i=0;i<target;i++)await p.keyboard.press('ArrowRight');
    await p.screenshot({path:`test-results/answer-keyboard/${engine}-${width}-${mode}.png`});
    const clock=await p.evaluate(()=>__game.clock);if(mode==='popup'){await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>__game.clock),clock);}
    await p.keyboard.down('Enter');assert.equal(await p.evaluate(()=>__game.v2.answers.length),1);assert.equal(await p.evaluate(()=>__game.state.correct),1);
    await p.keyboard.down('Enter');assert.equal(await p.evaluate(()=>__game.v2.answers.length),1);assert(await p.evaluate(()=>!__game.state.quizActive),'held Enter answered or advanced twice');await p.keyboard.up('Enter');
    if(mode==='explore'||mode==='popup'){
     const next=mode==='popup'?'#popupContinue':'#continueQuestion';await p.locator(next).evaluate(e=>{if(document.activeElement!==e)throw Error('explanation continue focus');});await p.keyboard.press('Enter');
     if(mode==='popup')assert(await p.evaluate(()=>!__game.state.mathPopup&&!__game.state.paused));
     else {
      await buttons.first().evaluate(e=>{if(document.activeElement!==e)throw Error('next answer focus');});
      const wrong=await p.evaluate(()=>__game.state.problem.options.findIndex(value=>!__game.v2.isCorrect(value,__game.state.problem.answer)));for(let i=0;i<wrong;i++)await p.keyboard.press('ArrowRight');await p.keyboard.press('Enter');assert.equal(await p.evaluate(()=>__game.v2.answers.length),2);assert.equal(await p.evaluate(()=>__game.state.correct),1);assert(await p.locator('#explanation').isVisible());
     }
    }else {assert(await p.locator('#explanation').isVisible());await p.evaluate(()=>{__game.player.x=__game.state.worldW/2;__game.player.y=__game.state.worldH/2;});const x=await p.evaluate(()=>__game.player.x);await p.keyboard.down('ArrowRight');await p.waitForFunction(x=>__game.player.x>x,x);await p.keyboard.up('ArrowRight');}
   }
   assert.deepEqual(errors,[]);results.push({engine,width,height,mode,passed:true});console.log(`PASS answer keyboard ${engine} ${width} ${mode}`);await context.close();
  }await browser.close();
 }fs.writeFileSync('test-results/answer-keyboard/report.json',JSON.stringify({url,results},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
