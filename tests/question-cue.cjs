const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict');
const url=(process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/')+'?qa=1';
// Question text must stay readable and each new question must be visibly flagged.
const profiles=[['desktop',1910,1000,34,22],['tablet',768,1024,25,18],['phone',390,844,22,18],['landscape',844,390,22,18],['small-phone',320,568,22,18]];
(async()=>{
 for(const engine of process.env.ENGINES?process.env.ENGINES.split(','):process.env.CI?['chromium']:['chromium','webkit']){
  const browser=await(engine==='chromium'?chromium:webkit).launch({headless:true,...(engine==='chromium'&&!process.env.CI?{channel:'msedge'}:{})});
  for(const [name,width,height,minQuestion,minExplain] of profiles){
   const mobile=name!=='desktop',context=await browser.newContext({viewport:{width,height},isMobile:mobile&&engine==='chromium',hasTouch:mobile}),p=await context.newPage(),errors=[];
   p.on('pageerror',e=>errors.push(e.message));
   await p.goto(url);await p.waitForFunction(()=>window.__game);await p.evaluate(()=>document.fonts.ready);await p.locator('#startBtn').click();await p.waitForFunction(()=>__game.clock>200);
   const ask=()=>p.evaluate(()=>{const g=__game;g.state.hp=g.state.maxHp=1e5;g.enemies=[];g.state.quizActive=false;g.spawnQuiz();});
   await ask();
   const shown=await p.evaluate(()=>({question:parseFloat(getComputedStyle(document.getElementById('questionText')).fontSize),badge:getComputedStyle(document.getElementById('newQuestionBadge')).display,announce:document.getElementById('questionAnnounce').textContent,text:document.getElementById('questionText').textContent,live:document.getElementById('questionAnnounce').getAttribute('aria-live'),scroll:document.documentElement.scrollWidth}));
   assert(shown.question>=minQuestion-.5,`${engine} ${name} question font ${shown.question}`);
   assert.equal(shown.badge,'block');assert.equal(shown.live,'polite');assert.equal(shown.announce,'새 문제! '+shown.text);
   assert(shown.scroll<=width,`${engine} ${name} horizontal overflow ${shown.scroll}`);
   // The cue eases in once; it must not pulse or flash.
   assert.equal(await p.evaluate(()=>getComputedStyle(document.getElementById('questionBox')).animationIterationCount),'1');
   // Showing or hiding the question bar resizes the canvas; it must be repainted before the browser shows it,
   // otherwise the whole field flashes blank for a frame.
   await p.evaluate(()=>{const c=document.getElementById('game');window.__blank=0;new ResizeObserver(()=>{if(!c.getContext('2d').getImageData(c.width>>1,c.height>>1,1,1).data[3])__blank++;}).observe(c);});
   await p.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>{const g=__game;g.resolveAnswer(g.answerOrbs.find(o=>o.correct));done();})));await p.waitForTimeout(300);
   await p.evaluate(()=>new Promise(done=>requestAnimationFrame(()=>{const g=__game;g.state.quizActive=false;g.spawnQuiz();done();})));await p.waitForTimeout(300);
   assert.equal(await p.evaluate(()=>__blank),0,`${engine} ${name} canvas showed a blank frame`);
   // Wrong answers get their own feedback styling at the larger size.
   await p.evaluate(()=>{const g=__game;g.resolveAnswer(g.answerOrbs.find(o=>!o.correct));});
   const feedback=await p.evaluate(()=>{const e=document.getElementById('explanation');return {font:parseFloat(getComputedStyle(e).fontSize),result:e.dataset.result,text:e.textContent};});
   assert.equal(feedback.result,'wrong');assert(feedback.text.startsWith('💡'));assert(feedback.font>=minExplain-.5,`${engine} ${name} explanation font ${feedback.font}`);
   // Reduced motion keeps the badge but drops the pulse animation.
   await p.evaluate(()=>document.body.classList.add('reduce-motion'));await ask();
   assert.equal(await p.evaluate(()=>getComputedStyle(document.getElementById('questionBox')).animationName),'none');
   assert.equal(await p.locator('#newQuestionBadge').isVisible(),true);
   assert.deepEqual(errors,[]);await context.close();
  }
  await browser.close();console.log('PASS question cue '+engine);
 }
})().catch(e=>{console.error(e);process.exit(1)});
