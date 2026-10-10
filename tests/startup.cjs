const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const source=process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/',built=process.env.BUILD_URL||'http://127.0.0.1:4174/Math-Survival/';
const record={schemaVersion:2,sessionId:'preserved-before-startup-fix',date:'2026-10-10T00:00:00Z',config:{grade:3,mode:'survival'},answers:[],outcome:'quit',score:42};
const saved={schemaVersion:2,records:[record],mastery:{},checkpoint:null,quarantine:[]};
(async()=>{
 const results=[];
 for(const engine of process.env.CI?['chromium']:['chromium','webkit']){
  const browser=await(engine==='chromium'?chromium:webkit).launch({headless:true,...(engine==='chromium'&&!process.env.CI?{channel:'msedge'}:{})});
  // The former entry point reproduces the pre-layout failure when structuredClone is absent.
  const old=await browser.newContext();await old.addInitScript(()=>window.structuredClone=undefined);
  const html=fs.readFileSync('index.html','utf8').replace(/<script src="\.\/src\/startup\.js[^"]*"[^>]*><\/script>/,'<script type="module" src="./src/main.js"></script>');
  await old.route('**/Math-Survival/?qa=1',route=>route.fulfill({contentType:'text/html',body:html}));
  const previous=await old.newPage();await previous.goto(source+'?qa=1');await previous.waitForFunction(()=>document.getElementById('loadMessage')?.textContent.includes('structuredClone'));
  assert(await previous.locator('#startBtn').isDisabled());assert.equal(await previous.locator('#v2Setup').textContent(),'');await old.close();results.push({engine,case:'previous failure reproduced',passed:true});
  for(const legacy of [false,true]){
   const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
   await context.addInitScript(({legacy,saved})=>{localStorage.setItem('math-survival-2.learning.v2',JSON.stringify(saved));localStorage.setItem('other-app-keep','preserve');if(legacy){window.structuredClone=undefined;Array.prototype.at=undefined;crypto.randomUUID=undefined;}},{legacy,saved});
   const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(built+'?qa=1');await p.waitForFunction(()=>window.__game);
   assert.equal(await p.locator('#startupStatus').isVisible(),false);assert.equal(await p.locator('#joystickZone').isVisible(),false);await p.selectOption('#unit','g3-div');await p.locator('#startBtn').tap();assert(await p.evaluate(()=>__game.state.running));await p.locator('#pauseBtn').tap();assert(await p.locator('#playMenu').isVisible());await p.locator('#mainMenuBtn').tap();
   assert(await p.evaluate(()=>JSON.parse(localStorage.getItem('math-survival-2.learning.v2')).records.some(r=>r.sessionId==='preserved-before-startup-fix'&&r.score===42)));assert.equal(await p.evaluate(()=>localStorage.getItem('other-app-keep')),'preserve');assert.deepEqual(errors,[]);await context.close();results.push({engine,case:legacy?'legacy APIs fallback':'modern startup',passed:true});
  }
  const entryContext=await browser.newContext();let entryFailed=false;await entryContext.route('**/src/startup.js*',route=>{if(!entryFailed){entryFailed=true;return route.abort('failed');}return route.continue();});const entryPage=await entryContext.newPage();await entryPage.goto(built+'?qa=1');await entryPage.locator('#repairStartup').waitFor({state:'visible'});assert(await entryPage.locator('#startBtn').isDisabled());await entryPage.locator('#repairStartup').click();await entryPage.waitForFunction(()=>window.__game);await entryContext.close();results.push({engine,case:'entry script failure and retry',passed:true});
  const context=await browser.newContext({viewport:{width:390,height:844},hasTouch:true});
  await context.addInitScript(()=>{if(!localStorage.getItem('math-survival-2.learning.v2'))localStorage.setItem('math-survival-2.learning.v2',JSON.stringify({schemaVersion:2,records:[],mastery:{},checkpoint:null,quarantine:[]}));localStorage.setItem('other-app-keep','preserve');});
  let blocked=false;await context.route('**/src/v2.js*',route=>{if(!blocked){blocked=true;return route.abort('failed');}return route.continue();});
  const p=await context.newPage();await p.goto(built+'?qa=1');await p.locator('#repairStartup').waitFor({state:'visible'});assert(await p.locator('#startBtn').isDisabled());assert((await p.locator('#startupStatus').textContent()).includes('중단'));
  await p.locator('#repairStartup').tap();await p.waitForFunction(()=>window.__game);await p.locator('#startBtn').tap();assert(await p.evaluate(()=>__game.state.running));assert.equal(await p.evaluate(()=>localStorage.getItem('other-app-keep')),'preserve');
  await p.evaluate(()=>navigator.serviceWorker.ready);await p.waitForFunction(()=>navigator.serviceWorker.controller);await p.waitForFunction(async()=>{const keys=await caches.keys(),key=keys.find(k=>k.includes('startup-2'));if(!key)return false;const cache=await caches.open(key);return !!(await cache.match(new URL('index.html',location.href).href));});
  await p.evaluate(async()=>{const script=[...document.scripts].find(s=>s.src.includes('/startup.js'));const v=new URL(script.src).searchParams.get('v');const url=new URL('./src/v2.js?v='+v,location.href).href;const c=await caches.open('other-game-untouched');await c.put(url,new Response('throw Error("wrong cached module")',{headers:{'Content-Type':'text/javascript'}}));return url;});
  await context.unrouteAll();await context.setOffline(true);await p.reload();await p.waitForFunction(()=>window.__game);await p.locator('#startBtn').tap();assert(await p.evaluate(()=>__game.state.running));assert(await p.evaluate(()=>caches.has('other-game-untouched')));
  results.push({engine,case:'module failure, reload recovery, isolated offline cache',passed:true});await context.close();await browser.close();
 }
 fs.mkdirSync('test-results/startup',{recursive:true});fs.writeFileSync('test-results/startup/report.json',JSON.stringify({timestamp:new Date().toISOString(),results},null,2));console.log('PASS startup recovery '+results.length+' scenarios');
})().catch(e=>{console.error(e);process.exit(1)});
