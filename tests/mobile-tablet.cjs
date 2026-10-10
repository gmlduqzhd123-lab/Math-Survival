const {chromium,webkit,devices}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root='http://127.0.0.1:4173/Math-Survival/',out='docs/mobile-tablet-verification';fs.mkdirSync(out,{recursive:true});
const profiles=[
 ['small-phone',320,568,2],['android-phone',360,640,3],['iphone-size',390,844,3],['large-phone',430,932,3],
 ['phone-landscape',844,390,3],['tablet-portrait',768,1024,2],['large-tablet-portrait',820,1180,2],
 ['tablet-landscape',1024,768,2],['android-tablet-landscape',1280,800,2]
];
const results=[];
function layout(){const box=id=>document.getElementById(id).getBoundingClientRect().toJSON();
 const ids=['gameHeader','learningArea','playfield','answerBar','touchControls','gameDetails'];
 const regions=ids.map(id=>({id,...box(id)}));const buttons=[...document.querySelectorAll('#gameHeader button,#answerAccess button,#skillBtn,#dashBtn')].filter(x=>!x.disabled&&x.getBoundingClientRect().width>0).map(x=>({id:x.id||'answer',...x.getBoundingClientRect().toJSON(),font:parseFloat(getComputedStyle(x).fontSize)}));
 return {width:innerWidth,height:innerHeight,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,regions,buttons,canvas:box('game'),backing:document.getElementById('game').width,dpr:__game.viewport.dpr,deviceDpr:devicePixelRatio,pixels:document.getElementById('game').width*document.getElementById('game').height,logical:__game.canvas.width,coarse:matchMedia('(pointer:coarse)').matches};}
function assertLayout(m){assert(m.coarse);assert(m.scrollWidth<=m.width+1,'horizontal overflow');assert(m.scrollHeight<=m.height+1,'vertical page overflow');assert(m.canvas.width>=250&&m.canvas.height>=45,'canvas collapsed');assert(Math.abs(m.backing-m.logical*m.dpr)<2,'DPR backing mismatch');assert(m.pixels<=3005000,'render pixel budget exceeded');assert(m.dpr<=Math.min(3,m.deviceDpr),'render scale exceeds device DPR');
 for(const b of m.buttons){assert(b.width>=43&&b.height>=43,'small target '+b.id);if(b.id==='answer')assert(b.font>=16);}
 for(let i=0;i<m.regions.length;i++)for(let j=i+1;j<m.regions.length;j++){const a=m.regions[i],b=m.regions[j];assert(!(a.left<b.right-1&&a.right>b.left+1&&a.top<b.bottom-1&&a.bottom>b.top+1),a.id+' overlaps '+b.id);}}
async function touchMove(context,page,engine){await page.locator('#pauseBtn').tap();await page.locator('#playPreferences summary').tap();await page.locator('#autoSkillToggle').uncheck();await page.locator('#resumePlay').tap();const box=await page.locator('#joystickZone').boundingBox(),before=await page.evaluate(()=>__game.player.x),x=box.x+box.width/2,y=box.y+box.height/2;
 if(engine==='chromium'){const c=await context.newCDPSession(page);await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{id:1,x,y}]});await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{id:1,x:x+27,y}]});await page.waitForTimeout(150);await c.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});}
 else{await page.touchscreen.tap(x+27,y);}
 assert(await page.evaluate(()=>!__game.isJoystickActive&&__game.joystickDelta.x===0),'stuck joystick');
 if(engine==='chromium')assert(await page.evaluate(b=>__game.player.x>b,before),'touch movement did not move player');
 await page.locator('#dashBtn').tap();await page.waitForFunction(()=>__game.player.dashCooldown>0);await page.locator('#skillBtn').tap();assert(await page.evaluate(()=>__game.state.skillReady>0));
 return engine==='chromium'?'trusted CDP touch drag/cancel + taps':'trusted WebKit taps; continuous drag not claimed';}
(async()=>{
 for(const engine of (process.env.DEVICE_ENGINE?[process.env.DEVICE_ENGINE]:['chromium','webkit'])){
  const browser=await (engine==='chromium'?chromium:webkit).launch({headless:true,...(engine==='chromium'?{channel:'msedge'}:{})});
  for(const [name,width,height,dpr]of profiles.filter(p=>!process.env.DEVICE_PROFILE||p[0]===process.env.DEVICE_PROFILE)){const errors=[],networkErrors=[],checks=[];let context;
   try{const userAgent=engine==='webkit'?devices['iPhone 13'].userAgent:devices['Pixel 7'].userAgent;context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true,deviceScaleFactor:dpr,userAgent,acceptDownloads:true});const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.status()>=400)networkErrors.push({url:r.url(),status:r.status()});});
    await page.goto(root+'?qa=1');await page.waitForFunction(()=>window.__game);await require('./home-settings.cjs')(page);assert.equal(await page.locator('#loadingPanel').count(),0);checks.push('load');
    await page.selectOption('#mode','explore');await page.selectOption('#grade','5');await page.selectOption('#domain','number');await page.selectOption('#unit','g5-frac');await page.fill('#target','3');await page.locator('.preferences summary').tap();await page.selectOption('#fontSize','1.3');await page.locator('#startBtn').tap();await page.waitForTimeout(100);
    await page.waitForFunction(()=>__game.clock>=200);
    assert(await page.evaluate(()=>{const c=document.getElementById('game');return c.getContext('2d').getImageData(0,0,c.width,c.height).data.some(x=>x!==0);}), 'canvas did not render');checks.push('canvas pixels rendered');
    const initial=await page.evaluate(layout);assertLayout(initial);checks.push('explore layout / large text / DPR');await page.screenshot({path:path.join(out,engine+'-'+name+'-play.png')});
    const hp=await page.evaluate(()=>__game.state.hp);for(let i=0;i<3;i++){const correct=i>0,index=await page.evaluate(c=>__game.answerOrbs.findIndex(x=>x.correct===c),correct);await page.locator('#answerAccess button').nth(index).tap();assert(await page.evaluate(h=>__game.state.paused&&__game.state.hp>=h,hp));const clock=await page.evaluate(()=>__game.clock);await page.waitForTimeout(70);assert.equal(await page.evaluate(()=>__game.clock),clock);assertLayout(await page.evaluate(layout));await page.locator('#continueQuestion').tap();}
    assert.equal(await page.locator('#resultTitle').textContent(),'목표 문항 완료');assert(await page.evaluate(()=>__game.v2.result.correct===2&&__game.v2.result.wrong===1&&__game.v2.result.accuracy===67));checks.push('touch answers / feedback clock pause / target result');
    const download=page.waitForEvent('download');await page.locator('#exportJSON').tap();const file=path.join(out,engine+'-'+name+'-result.json');await (await download).saveAs(file);assert.equal(JSON.parse(fs.readFileSync(file)).answers.length,3);checks.push('actual JSON download');
    await page.reload();await page.waitForFunction(()=>window.__game);await require('./home-settings.cjs')(page);assert.equal(await page.evaluate(()=>__game.v2.store.data.records.length),1);checks.push('reload persistence');
    await page.selectOption('#mode','survival');await page.locator('#startBtn').tap();await page.waitForTimeout(100);const touch=await touchMove(context,page,engine);checks.push(touch);await page.locator('#pauseBtn').tap();const clock=await page.evaluate(()=>__game.clock);await page.waitForTimeout(80);assert.equal(await page.evaluate(()=>__game.clock),clock);await page.locator('#resumePlay').tap();checks.push('pause/resume');
    await page.setViewportSize({width:height,height:width});await page.waitForTimeout(120);const rotated=await page.evaluate(layout);assertLayout(rotated);assert(await page.evaluate(()=>!__game.isJoystickActive&&Object.values(__game.keys).every(x=>!x)));checks.push('live rotation / input cleared');await page.screenshot({path:path.join(out,engine+'-'+name+'-rotated.png')});
    if(!await page.locator('#playMenu').isVisible())await page.locator('#pauseBtn').tap();await page.locator('#mainMenuBtn').tap();await page.selectOption('#mode','boss');await page.locator('#startBtn').tap();await page.locator('#bossHUD').waitFor({state:'visible',timeout:5000});assert(await page.locator('#bossHUD').isVisible());assert(await page.evaluate(()=>document.querySelector('#bossHUD').getBoundingClientRect().bottom<=document.querySelector('#game').getBoundingClientRect().top+1));assertLayout(await page.evaluate(layout));checks.push('boss layout');
    if(!await page.locator('#playMenu').isVisible())await page.locator('#pauseBtn').tap();await page.locator('#quitGameBtn').tap();assert.equal(await page.evaluate(()=>__game.v2.result.outcome),'quit');checks.push('quit');assert.deepEqual(errors,[]);assert.deepEqual(networkErrors,[]);
    results.push({engine,browserVersion:browser.version(),profile:name,width,height,dpr,pass:true,checks,initial,rotated,errors,networkErrors});console.log('PASS '+engine+' '+name);
   }catch(e){results.push({engine,profile:name,width,height,dpr,pass:false,checks,error:e.stack,errors,networkErrors});console.log('FAIL '+engine+' '+name+' '+e.message);}finally{await context?.close();}
  }await browser.close();
 }
 fs.writeFileSync(path.join(out,process.env.DEVICE_PROFILE?'report-retry.json':'report.json'),JSON.stringify({date:new Date().toISOString(),url:root,environment:'Windows desktop browser engines with mobile/tablet emulation. No physical Android/iOS device or audible playback certification.',results},null,2));console.log(results.filter(x=>x.pass).length+'/'+results.length+' profiles passed');if(results.some(x=>!x.pass))process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
