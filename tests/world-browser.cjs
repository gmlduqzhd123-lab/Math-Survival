const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
(async()=>{
 const b=await chromium.launch({headless:true}),reports=[];fs.mkdirSync('test-results/world',{recursive:true});
 try{for(const [name,width,height,dpr] of [['desktop',1440,1000,1],['phone',390,844,3],['tablet',820,1180,2]]){
  const context=await b.newContext({viewport:{width,height},deviceScaleFactor:dpr,isMobile:name!=='desktop',hasTouch:name!=='desktop'}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.addInitScript(data=>localStorage.setItem('math-survival-3.progress.v1',JSON.stringify(data)),require('./v3-fixture.cjs'));
  await p.goto((process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/')+'?qa=1');await p.waitForFunction(()=>window.__game);await require('./home-settings.cjs')(p);await p.selectOption('#mode','survival');await p.selectOption('#mapSelect','forest');await p.click('#startBtn');
  const result=await p.evaluate(()=>{
   const r=__game;r.state.paused=true;const w=r.v3.world;assertion(w.active,'overworld active');localStorage.setItem('math-survival-2.learning.v2',JSON.stringify({mapTest:'existing saved learning bytes',sessions:[{id:'preserve-me'}]}));const before=localStorage.getItem('math-survival-2.learning.v2'),growthBefore=localStorage.getItem('math-survival-3.progress.v1');
   for(const z of w.layout.regions){r.player.x=z.cx+340;r.player.y=z.cy+230;r.updateCamera();w.tick();r.drawBackground(0);}assertion(w.visited.size===9,'all regions discovered');
   const treasure=w.sites.find(e=>e.type==='treasure'),count=r.items.length;r.v3.content.interact(treasure);assertion(r.items.length===count+1,'treasure reward');r.v3.content.interact(treasure);assertion(r.items.length===count+1,'one reward only');
   const altar=w.sites.find(e=>e.type==='altar');r.state.mathEnergy=20;const power=r.state.attackPower;r.v3.content.interact(altar);assertion(r.state.attackPower===power+7&&r.state.mathEnergy===0,'altar reward');
   const merchant=w.sites.find(e=>e.type==='merchant');r.v3.content.killed({boss:true,midBoss:true});r.state.hp=r.state.maxHp-50;r.v3.content.interact(merchant);assertion(r.v3.content.purchase('heal'),'merchant purchase');
   const portal=w.sites.find(e=>e.type==='secret');r.v3.content.interact(portal);assertion(Math.hypot(r.player.x-portal.destination.x,r.player.y-portal.destination.y)<1,'remote secret destination');const caches=w.cacheSize;assertion(caches.chunks<=40&&caches.landmarks<=4,'bounded caches');assertion(localStorage.getItem('math-survival-2.learning.v2')===before,'learning data unchanged');assertion(localStorage.getItem('math-survival-3.progress.v1')===growthBefore,'growth data unchanged');
   r.player.x=3600;r.player.y=2940;r.updateCamera();r.draw();return {caches,visited:w.visited.size};function assertion(ok,message){if(!ok)throw Error(message);}
  });await p.evaluate(()=>{__game.state.paused=false;__game.state.hp=1e8;__game.state.exp=-1e6;});await p.screenshot({path:'test-results/world/'+name+'.png'});
  if(name==='desktop'){await p.evaluate(()=>{__game.state.paused=false;__game.state.hp=1e8;__game.state.exp=-1e6;});const x=await p.evaluate(()=>__game.player.x);await p.keyboard.down('d');await p.waitForTimeout(400);await p.keyboard.up('d');assert(await p.evaluate(x=>__game.player.x>x+10,x));}
  assert.deepEqual(errors,[]);reports.push({name,...result});await context.close();
 }
 const p=await b.newPage();await p.addInitScript(data=>localStorage.setItem('math-survival-3.progress.v1',JSON.stringify(data)),require('./v3-fixture.cjs'));await p.goto((process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/')+'?qa=1');await p.waitForFunction(()=>window.__game);await require('./home-settings.cjs')(p);
 for(const key of ['forest','desert','library','ocean','clockwork','sky']){await p.selectOption('#mapSelect',key);await p.click('#startBtn');assert(await p.evaluate(key=>{const r=__game;r.state.paused=true;r.draw();return r.v3.world.active&&r.v3.world.layout.key===key&&r.v3.world.sites.length===9;},key));await p.keyboard.press('Escape');await p.click('#mainMenuBtn');}
 await p.selectOption('#mode','dungeon');await p.click('#startBtn');assert(await p.evaluate(()=>__game.v3.dungeon.active&&!__game.v3.world.active&&__game.state.worldW===1000&&__game.v3.world.sites.length===0));
 fs.writeFileSync('test-results/world/report.json',JSON.stringify(reports,null,2));console.log('PASS nine regions, four site rewards, no duplicate payout, secret travel, six worlds, dungeon, desktop/phone/tablet');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
