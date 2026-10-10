const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const root=process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/',out='test-results/sprites';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const results=[];
 for(const engine of process.env.CI?['chromium']:['chromium','webkit']){
  const browser=await(engine==='chromium'?chromium:webkit).launch({headless:true,...(engine==='chromium'&&!process.env.CI?{channel:'msedge'}:{})});
  for(const [width,height]of [[320,568],[390,844],[768,1024],[1920,1080]]){
   const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:3,hasTouch:true,isMobile:width<900}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.goto(root+'?qa=1');await p.waitForFunction(()=>window.__game);await require('./home-settings.cjs')(p);await p.evaluate(()=>__game.sprites.ready);
   const status=await p.evaluate(()=>__game.sprites.status());assert.equal(status.ready.length,12);assert.deepEqual(status.failed,[]);assert.equal(status.renderSize,128);
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   for(const id of ['explorer','mage','guardian']){await p.selectOption('#character',id);assert((await p.locator('#equipmentPreviews img').first().getAttribute('src')).includes({explorer:'pencil-sword',mage:'knowledge-staff',guardian:'invincibility-shield'}[id]));}
   for(const id of ['storm','compass','fraction','lightning']){await p.selectOption('#startingWeapon',id);assert((await p.locator('#equipmentPreviews img').nth(1).getAttribute('src')).includes({storm:'knowledge-staff',compass:'math-boomerang',fraction:'invincibility-shield',lightning:'knowledge-staff'}[id]));}
   await p.selectOption('#character','mage');await p.selectOption('#startingWeapon','compass');
   await p.screenshot({path:`${out}/${engine}-${width}-menu.png`,fullPage:true});
   await p.locator('.originalHelp summary').click();await p.locator('#tabBtn2').click();
   assert.equal(await p.locator('.spriteGuide img').count(),11);
   assert(await p.locator('.spriteGuide img').evaluateAll(images=>images.every(i=>i.complete&&i.naturalWidth===256)));
   await p.locator('.originalHelp summary').click();await p.selectOption('#mode','survival');await p.locator('#startBtn').click();
   const checked=await p.evaluate(()=>{
    const r=__game,ctx=r.ctx,draw=ctx.drawImage,seen=new Set();ctx.drawImage=function(image,...args){if(image.dataset?.sprite)seen.add(image.dataset.sprite);return draw.call(this,image,...args);};
    r.enemies=[];r.items=[];r.state.hp=r.state.maxHp=1e6;r.state.exp=-1e6;r.state.mission=null;r.state.bossIndex=3;
    for(const [type,item]of Object.entries(r.itemTypes).filter(([,i])=>i.sprite)){
     r.items=[{type,x:r.state.cameraX+r.canvas.width/2+65,y:r.state.cameraY+r.canvas.height/2,r:24,life:10000,pulse:0}];r.draw();
     if(!seen.has(item.sprite))throw Error('Item sprite not rendered: '+type);
    }
    for(const id of ['explorer','mage','guardian']){r.state.character=id;r.drawCutePlayer(r.clock);}
    r.projectiles=[{kind:'boomerang',x:r.player.x+50,y:r.player.y,r:16,life:100,angle:0},{kind:'chalk',x:r.player.x+60,y:r.player.y,r:10,life:100}];r.draw();
    r.state.newWeapons.fraction=1;r.v2.draw(r.clock);ctx.drawImage=draw;
    const types=Object.keys(r.itemTypes).filter(t=>r.itemTypes[t].sprite),cols=r.canvas.width>600?4:2,rows=r.canvas.width>600?3:2;
    r.items=types.slice(0,cols*rows).map((type,i)=>({type,x:r.state.cameraX+(i%cols+.5)*r.canvas.width/cols,y:r.state.cameraY+(Math.floor(i/cols)+.5)*r.canvas.height/rows,r:24,life:20000,pulse:0}));
    r.state.character='mage';r.draw();return [...seen];
   });assert.equal(checked.length,12);
   await p.screenshot({path:`${out}/${engine}-${width}-game.png`});
   await p.evaluate(()=>{__game.openLevelUpPanel();});assert(await p.locator('#upgradeChoices button').count()>0);
   await p.locator('#upgradeChoices button').first().click();assert(await p.evaluate(()=>!__game.state.paused));
   assert.deepEqual(errors,[]);results.push({engine,width,height,pass:true,rendered:checked});console.log('PASS sprites '+engine+' '+width);await context.close();
  }
  // A missing image must leave a playable game with the original canvas fallback.
  const context=await browser.newContext(),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.route('**/assets/sprites/*.png',r=>r.abort());await p.goto(root+'?qa=1');await p.waitForFunction(()=>window.__game);await require('./home-settings.cjs')(p);await p.evaluate(()=>__game.sprites.ready);assert.equal((await p.evaluate(()=>__game.sprites.status())).failed.length,12);
  await p.locator('#startBtn').click();await p.waitForFunction(()=>__game.clock>100);assert(await p.evaluate(()=>__game.state.running));assert.deepEqual(errors,[]);await context.close();await browser.close();
 }
 fs.writeFileSync(out+'/report.json',JSON.stringify({url:root,results},null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
