const {chromium,webkit}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const root=process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/';
const out='test-results/preferences';fs.mkdirSync(out,{recursive:true});
(async()=>{
 const results=[];
 for(const engine of process.env.CI?['chromium']:['chromium','webkit']){
  const browser=await (engine==='chromium'?chromium:webkit).launch({headless:true,...(engine==='chromium'&&!process.env.CI?{channel:'msedge'}:{})});
  for(const [name,width,height]of [['phone',320,568],['tablet',768,1024],['desktop',1920,1080]]){
   const context=await browser.newContext({viewport:{width,height},hasTouch:true,isMobile:name!=='desktop',deviceScaleFactor:2});
   await context.addInitScript(()=>localStorage.setItem('math-survival-2.settings',JSON.stringify({grade:3,domain:'all',unit:'all',level:2,auto:false,mode:'explore',target:2,limit:0,character:'explorer',weapon:'storm',map:'forest',combat:'easy'})));
   const p=await context.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(root+'?qa=1');await p.waitForFunction(()=>window.__game);await require('./home-settings.cjs')(p);
   assert.equal(await p.title(),'매쓰 서바이벌 3.0.2');
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   if(name==='desktop')assert.equal(Math.round((await p.locator('#startPanel .card').boundingBox()).width),680);
   await p.screenshot({path:`${out}/${engine}-${name}-menu.png`});
   for(const mode of ['explore','survival','boss']){
    await p.selectOption('#mode',mode);await p.locator('#startBtn').tap();await p.waitForFunction(()=>__game.clock>=200);
    assert(await p.evaluate(()=>{const r=__game;r.state.mission=null;r.state.bossIndex=3;r.state.time=3600;r.update(16,r.clock);return r.state.running&&r.state.winTime===Infinity&&r.v2.config.limit===0;}));
    assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth&&document.documentElement.scrollHeight<=innerHeight));
    if(name==='desktop')assert((await p.locator('#game').boundingBox()).width>1880);
    if(mode==='explore'){
     const i=await p.evaluate(()=>__game.answerOrbs.findIndex(x=>x.correct));await p.locator('#answerAccess button').nth(i).tap();await p.locator('#continueQuestion').tap();assert(await p.evaluate(()=>__game.state.running&&__game.state.quizActive));
    }else{
     assert(await p.evaluate(()=>{const r=__game;r.resolveAnswer(r.answerOrbs.find(x=>x.correct));const t=r.state.lastQuiz;r.state.mission=null;r.state.paused=false;r.state.levelUpPending=false;r.update(16,t+29999);if(r.state.quizActive)return false;r.update(16,t+30001);return r.state.running&&r.state.quizActive&&r.v2.quizInterval===30000;}));
    }
    if(mode==='survival')await p.screenshot({path:`${out}/${engine}-${name}-game.png`});
    if(!await p.locator('#playMenu').isVisible())await p.locator('#pauseBtn').tap();await p.locator('#mainMenuBtn').tap();
   }
   assert.deepEqual(errors,[]);results.push({engine,name,width,height,pass:true});console.log('PASS preferences '+engine+' '+name);await context.close();
  }await browser.close();
 }fs.writeFileSync(out+'/report.json',JSON.stringify({url:root,results},null,2));
})().catch(e=>{console.error(e);process.exitCode=1});
