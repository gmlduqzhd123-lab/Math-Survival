const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const url=process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/';
(async()=>{
 const browser=await chromium.launch({headless:true,...(!process.env.CI?{channel:'msedge'}:{})});
 const results=[];fs.mkdirSync('test-results/mobile-gestures',{recursive:true});
 for(const [width,height]of [[320,568],[390,844],[844,390]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true}),p=await context.newPage(),errors=[];
  p.on('pageerror',e=>errors.push(e.message));await p.goto(url+'?qa=1');await p.waitForFunction(()=>window.__game);
  await p.locator('#startBtn').tap();await p.waitForFunction(()=>__game.clock>200);
  await p.evaluate(()=>{window.touchMenus=[];window.addEventListener('contextmenu',e=>touchMenus.push({id:e.target.id,prevented:e.defaultPrevented}));});
  const session=await context.newCDPSession(p),joy=await p.locator('#joystickZone').boundingBox(),dash=await p.locator('#dashBtn').boundingBox();
  const a={id:1,x:joy.x+joy.width/2,y:joy.y+joy.height/2},d={id:2,x:dash.x+dash.width/2,y:dash.y+dash.height/2};
  // Hold in place before a short drag so random pickups cannot interrupt the hold assertion.
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a]});await p.waitForTimeout(900);
  const held=await p.evaluate(()=>({active:__game.isJoystickActive,paused:__game.state.paused,levelUp:__game.state.levelUpPending}));
  assert(held.active,JSON.stringify(held));
  const before=await p.evaluate(()=>__game.player.x);a.x+=20;await session.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[a]});await p.waitForTimeout(150);
  assert(await p.evaluate(x=>__game.player.x>x&&__game.isJoystickActive,before));
  await session.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[a,d]});await p.waitForFunction(()=>__game.player.dashCooldown>0);
  await session.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[d]});assert(await p.evaluate(()=>__game.isJoystickActive));
  await session.send('Input.dispatchTouchEvent',{type:'touchCancel',touchPoints:[]});assert(await p.evaluate(()=>!__game.isJoystickActive&&!__game.keys[' ']));
  const pos=await p.evaluate(()=>__game.player.x);await p.waitForTimeout(150);assert.equal(await p.evaluate(()=>__game.player.x),pos);
  assert.equal(await p.evaluate(()=>String(getSelection()).length),0);
  assert(await p.evaluate(()=>touchMenus.every(e=>e.prevented)),'unhandled native long-press menu');
  await p.locator('#pauseBtn').tap();await p.locator('#playPreferences > summary').tap();await p.selectOption('#menuFont','1.3');
  await p.locator('#resumePlay').tap();await p.setViewportSize({width:height,height:width});await p.waitForTimeout(150);
  assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight));
  assert(await p.evaluate(()=>!__game.isJoystickActive));
  await p.evaluate(()=>__game.showToast('보물상자 발견! 강화 카드를 선택하면 무기가 더 강해집니다. 조이스틱으로 계속 이동하고 정답 구슬을 찾아 수학 에너지를 모아 보세요.'));
  await p.waitForTimeout(300);
  assert(await p.evaluate(()=>{
   const toast=document.getElementById('toast'),box=toast.getBoundingClientRect(),field=document.getElementById('playfield').getBoundingClientRect();
   const intersects=el=>{const b=el.getBoundingClientRect();return b.width>0&&box.left<b.right&&box.right>b.left&&box.top<b.bottom&&box.bottom>b.top;};
   const range=document.createRange();range.selectNodeContents(toast);
   return box.left>=field.left&&box.right<=field.right&&box.top>=field.top&&box.bottom<=field.bottom&&
    ['joystickZone','dashBtn','skillBtn','questionBox'].every(id=>!intersects(document.getElementById(id)))&&
    [...range.getClientRects()].every(b=>b.left>=box.left&&b.right<=box.right&&b.top>=box.top&&b.bottom<=box.bottom);
  }),'notification clips text or overlaps a control');
  assert(await p.locator('#exp').evaluate(el=>{
   const range=document.createRange();range.selectNodeContents(el.parentElement);return new Set([...range.getClientRects()].map(b=>Math.round(b.top))).size===1;
  }),'experience label splits across lines');
  await p.screenshot({path:`test-results/mobile-gestures/${width}-rotated.png`});
  assert.deepEqual(errors,[]);results.push({width,height,passed:true,longPressMenus:await p.evaluate(()=>touchMenus)});await context.close();console.log(`PASS trusted mobile gestures ${width}`);
 }await browser.close();fs.writeFileSync('test-results/mobile-gestures/report.json',JSON.stringify({url,scope:'Chromium trusted CDP touch hold, two-finger dash, cancel and rotation; not a physical device test',results},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
