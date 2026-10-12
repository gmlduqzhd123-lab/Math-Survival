const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 for(const engine of (process.env.ENGINES||'chromium').split(',')){
  const browser=await (engine==='webkit'?webkit:chromium).launch({headless:true});
  for(const width of [1440,390]){
   const cx=await browser.newContext({viewport:{width,height:900},hasTouch:width===390,isMobile:width===390}),p=await cx.newPage(),errors=[];
   p.on('pageerror',e=>errors.push(e.message));
   await p.goto((process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/')+'?qa=1');await p.waitForFunction(()=>window.__game);
   assert.equal(await p.evaluate(()=>__game.audioReady),false);
   if(!await p.evaluate(()=>!!(window.AudioContext||window.webkitAudioContext))){
    await p.click('#startBtn');assert(await p.evaluate(()=>__game.state.running));assert.deepEqual(errors,[]);
    console.log('PASS game without Web Audio '+engine+' '+width+'; audio playback unavailable in this browser runtime');await cx.close();continue;
   }
   if(width===390)await p.locator('#homeSettings > summary').tap();else await p.click('#homeSettings > summary');
   await p.waitForFunction(()=>__game.musicTimer?.status==='playing');
   const initial=await p.evaluate(()=>{const r=__game;window.bgmFirst=r.musicTimer;window.bgmSource=r.musicTimer.source;window.bgmContext=r.audioCtx;window.bgmAnalyser=r.audioCtx.createAnalyser();r.musicGain.connect(bgmAnalyser);return {duration:bgmSource.buffer.duration,loop:r.musicTimer.loop,gain:r.musicGain.gain.value,time:r.audioCtx.currentTime};});
   assert(initial.duration>140&&initial.duration<155);assert.equal(initial.loop.crossfade,2);assert(initial.gain>0&&initial.gain<.1);
   await p.waitForTimeout(400);assert(await p.evaluate(t=>__game.audioCtx.currentTime>t+.1,initial.time));
   const power=async()=>p.evaluate(()=>{const d=new Float32Array(bgmAnalyser.fftSize);bgmAnalyser.getFloatTimeDomainData(d);return Math.sqrt(d.reduce((sum,v)=>sum+v*v,0)/d.length);});
   await p.waitForTimeout(600);assert(await power()>0,'real decoded audio must reach music output');
   await p.click('#muteBtn');await p.waitForTimeout(100);assert(await p.evaluate(()=>__game.masterGain.gain.value===0&&__game.muted));
   await p.click('#muteBtn');assert(await p.evaluate(()=>__game.masterGain.gain.value>0&&!__game.muted));
   await p.evaluate(()=>{const input=document.getElementById('musicVolume');input.value='0.25';input.dispatchEvent(new Event('input',{bubbles:true}));});
   assert(Math.abs(await p.evaluate(()=>__game.musicGain.gain.value)-.03)<1e-6);
   await p.click('#startBtn');await p.click('#pauseBtn');await p.click('#mainMenuBtn');await p.click('#startBtn');
   assert(await p.evaluate(()=>bgmFirst===__game.musicTimer&&bgmSource===__game.musicTimer.source&&bgmContext===__game.audioCtx&&__game.musicTimer.starts===1));
   await p.evaluate(()=>{__game.musicTimer.source.playbackRate.value=128;});await p.waitForTimeout(2600);
   assert(await p.evaluate(()=>__game.musicTimer.starts===1&&__game.musicTimer.source.loop&&__game.musicTimer.status==='playing'));
   await p.reload();await p.waitForFunction(()=>window.__game);await p.click('#homeSettings > summary');await p.waitForFunction(()=>__game.musicTimer?.status==='playing');
   assert(Math.abs(await p.evaluate(()=>__game.musicGain.gain.value)-.03)<1e-6);
   await p.click('#muteBtn');await p.reload();await p.waitForFunction(()=>window.__game);assert(await p.evaluate(()=>__game.muted&&!__game.audioReady));
   await p.click('#homeSettings > summary');assert.equal(await p.evaluate(()=>__game.audioReady),false);await p.click('#muteBtn');await p.waitForFunction(()=>__game.musicTimer?.status==='playing');
   if(process.env.BGM_OFFLINE){
    await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>navigator.serviceWorker.controller);
    await cx.setOffline(true);await p.reload();await p.waitForFunction(()=>window.__game);await p.click('#homeSettings > summary');await p.waitForFunction(()=>__game.musicTimer?.status==='playing');
    assert(await p.evaluate(()=>__game.musicTimer.starts===1));
   }
   assert.deepEqual(errors,[]);console.log('PASS BGM '+engine+' '+width+': gesture, real MP3, mute, volume persistence, transitions, accelerated loop');await cx.close();
  }await browser.close();
 }
})().catch(e=>{console.error(e);process.exit(1);});
