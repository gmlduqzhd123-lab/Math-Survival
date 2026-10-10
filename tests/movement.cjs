const {chromium}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const root=process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/';
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.CI?{}:{channel:'msedge'})});
 const reports=[];
 for(const [name,width,height,dpr] of [['desktop',1920,1080,3],['phone',390,844,3]]){
  const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr});
  await context.addInitScript(()=>{let seed=42;Math.random=()=>((seed=(seed*1664525+1013904223)>>>0)/4294967296);});
  const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));
  if(process.env.PERF_BASELINE)for(const file of ['core.js','entities.js','main.js'])await p.route('**/src/'+file,route=>route.fulfill({contentType:'text/javascript',body:execFileSync('git',['show',process.env.PERF_BASELINE+':src/'+file])}));
  await p.goto(root+'?qa=1');await p.waitForFunction(()=>window.__game);await require('./home-settings.cjs')(p);await p.evaluate(()=>document.fonts.ready);await p.selectOption('#mode','survival');await p.locator('#startBtn').click();
  await p.evaluate(()=>{
   const r=__game;r.state.hp=r.state.maxHp=1e8;r.state.exp=-1e6;r.state.mission=null;r.state.bossIndex=3;
   window.samples={frames:[],mutations:0};
   new MutationObserver(m=>samples.mutations+=m.length).observe(document.getElementById('hud'),{subtree:true,childList:true,characterData:true});
   let last=performance.now();function frame(t){samples.frames.push(t-last);last=t;requestAnimationFrame(frame);}requestAnimationFrame(frame);
  });
  await p.keyboard.down('d');await p.waitForTimeout(3000);await p.keyboard.up('d');
  if(!process.env.PERF_BASELINE)assert(await p.evaluate(()=>{const r=__game;r.drawBackground(r.clock);const cached=r.decorations.filter(d=>d.sprite).map(d=>[d,d.sprite]);r.drawBackground(r.clock);return cached.length>0&&cached.every(([d,sprite])=>d.sprite===sprite);}), 'background sprites are reused');
  await p.evaluate(()=>{for(const a of ['frames'])samples[a]=[];samples.mutations=0;window.moveStart={x:__game.player.x,y:__game.player.y,clock:__game.clock};});
  await p.keyboard.down('a');await p.waitForTimeout(6000);await p.keyboard.up('a');
  await p.keyboard.down('s');await p.waitForTimeout(6000);await p.keyboard.up('s');
  const report=await p.evaluate(()=>{
   const stat=a=>{const b=a.slice().sort((x,y)=>x-y);return {count:b.length,median:b[Math.floor(b.length*.5)],p95:b[Math.floor(b.length*.95)],over50:b.filter(x=>x>50).length};};
   return {frames:stat(samples.frames),hudMutations:samples.mutations,viewport:__game.viewport,backingPixels:__game.surface.width*__game.surface.height,moved:Math.hypot(__game.player.x-moveStart.x,__game.player.y-moveStart.y),simulationMs:__game.clock-moveStart.clock,running:__game.state.running&&!__game.state.paused};
  });
  if(!process.env.PERF_BASELINE){assert(report.backingPixels<=3005000);assert(report.hudMutations<500);assert(report.simulationMs>11000);}
  assert(report.moved>100);assert(report.running);assert.deepEqual(errors,[]);
  const stopped=await p.evaluate(()=>({x:__game.player.x,y:__game.player.y}));await p.waitForTimeout(120);
  assert(await p.evaluate(pos=>Math.hypot(__game.player.x-pos.x,__game.player.y-pos.y)<1,stopped),'key release stops movement');
  await p.evaluate(()=>{__game.state.exp=0;__game.state.hp=__game.state.maxHp=100;});
  fs.mkdirSync('test-results/movement',{recursive:true});await p.screenshot({path:`test-results/movement/${process.env.PERF_LABEL||'current'}-${name}.png`});
  reports.push({name,width,height,deviceDpr:dpr,...report});console.log(JSON.stringify(reports.at(-1)));
  await context.close();
 }
 await browser.close();fs.mkdirSync('test-results/movement',{recursive:true});fs.writeFileSync(`test-results/movement/${process.env.PERF_LABEL||'current'}.json`,JSON.stringify(reports,null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
