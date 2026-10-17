const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const url=process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/';
async function measure(browser,url,width,height){
 const c=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:true}),p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.goto(url+'?qa=1');await p.waitForFunction(()=>window.__game);await require('./home-settings.cjs')(p);await p.selectOption('#unit','g3-div');await p.evaluate(()=>document.fonts.ready);await p.locator('#startBtn').tap();await p.waitForFunction(()=>__game.clock>200);await p.locator('#pauseBtn').tap();
 const layout=await p.evaluate(()=>{
  const b=id=>document.getElementById(id).getBoundingClientRect().toJSON(),r=__game;
  return {canvas:b('game'),map:b('mapToggle'),joy:b('joystickZone'),dash:b('dashBtn'),touch:b('touchControls'),learning:b('learningArea'),width:innerWidth,height:innerHeight,scrollW:document.documentElement.scrollWidth,scrollH:document.documentElement.scrollHeight,orbs:r.answerOrbs.map(o=>({x:o.x-r.state.cameraX,y:o.y-r.state.cameraY,r:o.r}))};
 });await p.locator('#resumePlay').tap();await p.screenshot({path:`test-results/mobile-size/${width}-${url.includes('127.0.0.1')?'local':'live'}.png`});assert.deepEqual(errors,[]);await c.close();return layout;
}
(async()=>{fs.mkdirSync('test-results/mobile-size',{recursive:true});const browser=await chromium.launch({headless:true,...(!process.env.CI?{channel:'msedge'}:{})}),results=[];
 for(const [width,height]of [[320,568],[390,844],[844,390],[768,1024]]){
  const old=process.env.BASELINE_URL?await measure(browser,process.env.BASELINE_URL,width,height):null,current=await measure(browser,url,width,height),size=width>height&&height<=550?60:68;
  assert.equal(current.joy.width,size);assert.equal(current.dash.width,size);assert(current.scrollW<=width&&current.scrollH<=height);
  assert.equal(current.orbs.length,4);for(const orb of current.orbs)assert(orb.y+orb.r<=current.touch.top-current.canvas.top-4,'answer orb behind controls');
  for(const orb of current.orbs){const x=orb.x+current.canvas.left,y=orb.y+current.canvas.top;assert(!(x+orb.r>current.map.left&&x-orb.r<current.map.right&&y+orb.r>current.map.top&&y-orb.r<current.map.bottom),'answer orb behind map button');}
  if(size===60){
   // Phone landscape: joystick at the left screen edge inside the field, dash at the right screen edge below the question column.
   assert(current.joy.left>=current.canvas.left&&current.joy.right<=current.canvas.right&&current.joy.bottom<=current.canvas.bottom);
   assert(current.dash.right>=width-20&&current.dash.bottom<=height&&current.dash.left>current.canvas.right,'dash not at the right screen edge');
   assert(current.dash.top>=current.learning.bottom,'dash covers the question');
  }else assert(current.touch.left>=current.canvas.left&&current.touch.right<=current.canvas.right&&current.touch.bottom<=current.canvas.bottom);
  if(old)assert(current.canvas.height>=old.canvas.height+35,'canvas did not grow enough');
  results.push({width,height,current,baseline:old,gain:old?current.canvas.height-old.canvas.height:null});console.log(`PASS mobile size ${width} buttons ${size}px${old?' canvas +'+(current.canvas.height-old.canvas.height)+'px':''}`);
 }await browser.close();fs.writeFileSync('test-results/mobile-size/report.json',JSON.stringify({url,scope:'Mobile viewport emulation',results},null,2));
})().catch(e=>{console.error(e);process.exit(1)});
