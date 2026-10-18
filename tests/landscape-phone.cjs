// Phones play sideways: an upright phone pauses behind a rotate notice, and landscape gives the field the full height.
const {chromium}=require('playwright'),assert=require('node:assert/strict');
const url=(process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/')+'?qa=1';
const overlap=(a,b)=>a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1;
(async()=>{
 const browser=await chromium.launch({headless:true,...(!process.env.CI?{channel:'msedge'}:{})});
 try{
  for(const [width,height]of [[390,844],[320,568]]){
   const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true});
   // Automated browsers skip the rotate notice by default; opt in like a real phone.
   await context.addInitScript(()=>localStorage.setItem('math-survival.ui.v1',JSON.stringify({landscapeOnly:true})));
   const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
   await p.goto(url);await p.waitForFunction(()=>window.__game);
   assert(!await p.locator('#rotateGuard').isVisible(),'rotate notice on the home screen');
   await p.locator('#startBtn').tap();await p.waitForFunction(()=>document.getElementById('rotateGuard')?.open);
   assert(await p.locator('#rotateGuard').isVisible());assert.equal(await p.locator('#rotateGuard h2').textContent(),'휴대폰을 가로로 돌려 주세요');
   const clock=await p.evaluate(()=>__game.clock);await p.waitForTimeout(400);
   assert(await p.evaluate(c=>__game.state.paused&&__game.clock===c,clock),'game kept running behind the rotate notice');
   await p.setViewportSize({width:height,height:width});
   await p.waitForFunction(()=>!document.getElementById('rotateGuard').open&&!__game.state.paused&&!document.getElementById('playMenu').open);
   const resumed=await p.evaluate(()=>__game.clock);await p.waitForTimeout(300);assert(await p.evaluate(c=>__game.clock>c,resumed),'game did not resume after rotating');
   // Turning back upright while the menu is open keeps the menu once the phone is sideways again.
   await p.locator('#pauseBtn').tap();await p.setViewportSize({width,height});await p.waitForFunction(()=>document.getElementById('rotateGuard').open);
   await p.setViewportSize({width:height,height:width});await p.waitForFunction(()=>!document.getElementById('rotateGuard').open);
   assert(await p.evaluate(()=>__game.state.paused&&document.getElementById('playMenu').open));await p.locator('#resumePlay').tap();
   await p.evaluate(()=>{__game.state.lastQuiz=-1e9;});await p.waitForFunction(()=>__game.state.quizActive);await p.waitForTimeout(300);
   const m=await p.evaluate(()=>{const box=id=>document.getElementById(id).getBoundingClientRect().toJSON(),field=box('game'),map=__game.miniMapRect();
    return {w:innerWidth,h:innerHeight,top:__game.viewport.top,field,header:box('gameHeader'),hud:box('hud'),pause:box('pauseBtn'),mapBtn:box('mapToggle'),learning:box('learningArea'),joy:box('joystickZone'),dash:box('dashBtn'),label:__game.areaLabelBox,
     map:map&&{left:field.left+map.x,right:field.left+map.x+map.w,top:field.top+map.y,bottom:field.top+map.y+map.h},scroll:[document.documentElement.scrollWidth,document.documentElement.scrollHeight]};});
   assert(m.scroll[0]<=m.w+1&&m.scroll[1]<=m.h+1,'page overflow '+JSON.stringify(m.scroll));
   assert(m.field.height>=m.h-16,'field is not full height '+m.field.height);
   assert(m.header.bottom-m.field.top<=56&&m.header.top>=m.field.top,'health/level strip is not a thin strip over the field');
   assert(m.top>=m.header.bottom-m.field.top,'canvas overlays ignore the strip');assert(m.label.y>=m.top,'area name under the strip');
   assert(m.map&&m.map.top>=m.header.bottom,'minimap under the strip');assert(m.map.right>m.field.right-40,'minimap not at the top right');
   assert(m.learning.left>=m.field.right&&m.learning.width<=Math.max(181,0.3*m.w+1),'question column too wide '+m.learning.width);
   assert(m.joy.left<m.w/4&&m.joy.bottom>m.h-80,'joystick not bottom-left');assert(m.dash.right>m.w-60&&m.dash.bottom>m.h-80,'dash not bottom-right');
   for(const [a,b]of [['hud','mapBtn'],['hud','pause'],['mapBtn','pause'],['joy','dash'],['map','mapBtn'],['map','joy'],['map','dash'],['map','pause']])assert(!overlap(m[a],m[b]),a+' overlaps '+b);
   assert.deepEqual(errors,[]);console.log('PASS landscape phone '+width+'x'+height);await context.close();
  }
  // Tablets keep playing upright.
  const context=await browser.newContext({viewport:{width:768,height:1024},isMobile:true,hasTouch:true});
  await context.addInitScript(()=>localStorage.setItem('math-survival.ui.v1',JSON.stringify({landscapeOnly:true})));
  const p=await context.newPage();await p.goto(url);await p.waitForFunction(()=>window.__game);await p.locator('#startBtn').tap();await p.waitForFunction(()=>__game.clock>300);
  assert(await p.evaluate(()=>!document.getElementById('rotateGuard').open&&!__game.state.paused),'tablet asked to rotate');console.log('PASS tablet portrait');await context.close();
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
