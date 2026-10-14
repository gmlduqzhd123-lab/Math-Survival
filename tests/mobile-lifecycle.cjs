const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const b=await chromium.launch({headless:true});
 try{
  const cx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:true}),p=await cx.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));
  await p.goto((process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/')+'?qa=1');await p.waitForFunction(()=>window.__game);
  await p.locator('#startBtn').tap();await p.waitForFunction(()=>__game.musicTimer?.status==='playing');
  await p.evaluate(()=>{
   window.firstMobileAudio=__game.audioCtx;window.firstMobileMusic=__game.musicTimer;
   // Simulate the browser visibility notification used when switching apps.
   Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.mobileHidden});window.mobileHidden=true;
   document.dispatchEvent(new Event('visibilitychange'));
  });
  await p.waitForFunction(()=>__game.state.paused&&__game.audioCtx.state==='suspended');
  assert(await p.evaluate(()=>!__game.isJoystickActive&&Object.values(__game.keys).every(x=>!x)));
  await p.evaluate(()=>{window.mobileHidden=false;document.dispatchEvent(new Event('visibilitychange'));});
  assert(await p.evaluate(()=>__game.state.paused));
  await p.locator('#resumePlay').tap();await p.waitForFunction(()=>__game.audioCtx.state==='running');
  assert(await p.evaluate(()=>!__game.state.paused&&__game.audioCtx===firstMobileAudio&&__game.musicTimer===firstMobileMusic));
  // An ended audio device/context must be recreated on the next trusted gesture.
  await p.evaluate(()=>__game.audioCtx.close());await p.locator('#pauseBtn').tap();
  await p.waitForFunction(()=>__game.audioCtx!==firstMobileAudio&&__game.musicTimer?.status==='playing',{},{timeout:5000});
  assert(await p.evaluate(()=>__game.audioCtx.state==='running'&&__game.musicTimer.starts===1));
  await p.locator('#resumePlay').tap();assert(await p.evaluate(()=>__game.state.running&&!__game.state.paused));
  assert.deepEqual(errors,[]);console.log('PASS mobile app-switch pause, gesture audio resume and closed-device recovery');
 }finally{await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
