const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{const browser=await chromium.launch({headless:true});try{
 for(const [width,height] of [[1440,1000],[390,844],[844,390]]){
  const mobile=width!==1440,context=await browser.newContext({viewport:{width,height},isMobile:mobile,hasTouch:mobile}),p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto((process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/')+'?qa=1');await p.waitForFunction(()=>window.__game);await p.locator('#startBtn').click();await p.evaluate(()=>document.fonts.ready);await p.waitForTimeout(250);
  // Keep combat running. Place the player near distant sites to test the final
  // approach with real keyboard/touch input rather than calling interact().
  async function approach(type){await p.evaluate(type=>{const r=__game;if(!window.chestProbe){window.chestProbe=true;window.chestsCreated=0;const spawn=r.spawnItem;Object.defineProperty(r,'spawnItem',{configurable:true,value:(x,y,type)=>{if(type==='chest')window.chestsCreated++;return spawn(x,y,type);}});}r.state.hp=r.state.maxHp=100000;r.state.exp=-10000;r.state.mission=null;r.state.quizActive=false;r.state.lastQuiz=1e12;r.state.paused=false;r.items=[];r.expDrops=[];r.answerOrbs=[];r.portals=[];const e=r.v3.world.sites.find(e=>e.type===type&&!e.used);r.player.x=e.x-110;r.player.y=e.y;r.updateCamera();r.v2.playUI.sync();},type);
   await p.waitForTimeout(150);let session;if(mobile){session=await context.newCDPSession(p);const box=await p.locator('#joystickZone').boundingBox();const point={id:1,x:box.x+box.width*0.9,y:box.y+box.height/2};await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});}else await p.keyboard.down('d');
   await p.waitForFunction(type=>__game.v3.world.sites.some(e=>e.type===type&&e.used),type,{timeout:5000}).catch(async e=>{console.log(await p.evaluate(()=>({p:__game.player,paused:__game.state.paused,level:__game.state.levelUpPending,keys:__game.keys})));throw e;});
   if(type==='merchant')assert(await p.evaluate(()=>!__game.isJoystickActive&&!Object.values(__game.keys).some(Boolean)),'shop must release held movement');if(mobile)await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});else await p.keyboard.up('d');
  }
  await approach('treasure');assert(await p.evaluate(()=>window.chestsCreated>=1));
  await approach('secret');assert(await p.evaluate(()=>{const r=__game,e=r.v3.world.sites.find(e=>e.type==='secret'&&e.used);return Math.hypot(r.player.x-e.destination.x,r.player.y-e.destination.y)<120;}));
  await approach('merchant');assert(await p.locator('#merchantPopup').isVisible());assert(await p.evaluate(()=>!__game.isJoystickActive&&!Object.values(__game.keys).some(Boolean)),'shop must release movement input');const before=await p.evaluate(()=>__game.clock);await p.waitForTimeout(100);assert.equal(await p.evaluate(()=>__game.clock),before);await p.locator('#closeMerchant').click();assert(await p.evaluate(()=>!__game.state.paused));
  // Move across a region boundary through the normal game loop.
  await p.evaluate(()=>{const r=__game;r.player.x=2390;r.player.y=2200;r.updateCamera();});await p.keyboard.down('d');await p.waitForTimeout(300);await p.keyboard.up('d');assert(await p.evaluate(()=>__game.player.x>2400&&__game.v3.world.visited.has(4)));
  assert.deepEqual(errors,[]);await context.close();console.log('PASS collision-driven treasure/secret/shop and movement '+width);
 }
 const context=await browser.newContext({viewport:{width:3840,height:2160}}),p=await context.newPage();await p.goto((process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/')+'?qa=1');await p.waitForFunction(()=>window.__game);await p.click('#startBtn');
 assert(await p.evaluate(()=>{const r=__game;r.state.paused=true;let created=0;const original=document.createElement.bind(document);document.createElement=(tag,...args)=>{if(tag==='canvas')created++;return original(tag,...args);};try{r.v3.world.start();r.drawBackground(0);created=0;r.drawBackground(0);return created===0;}finally{document.createElement=original;}}),'4K stationary redraw must reuse terrain rather than continuously rebake');await context.close();console.log('PASS 4K terrain cache reuse');
 }finally{await browser.close();}})().catch(e=>{console.error(e);process.exit(1);});
