const {chromium,webkit}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const root=process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/',out='test-results/typography';fs.mkdirSync(out,{recursive:true});
function inspect(){const items=[...document.querySelectorAll('#startPanel .selectField')].filter(x=>x.getBoundingClientRect().height).map(field=>{const text=field.querySelector('.selectValue'),select=field.querySelector('select'),range=document.createRange();range.selectNodeContents(text);const box=text.getBoundingClientRect(),style=getComputedStyle(text);return {id:select.id,value:text.textContent,expected:select.selectedOptions[0]?.textContent,box:box.toJSON(),rects:[...range.getClientRects()].map(x=>x.toJSON()),rightLimit:box.right-parseFloat(style.paddingRight),leftLimit:box.left+parseFloat(style.paddingLeft),font:style.fontFamily};});return {items,width:innerWidth,scrollWidth:document.documentElement.scrollWidth};}
function check(m){assert(m.scrollWidth<=m.width+1);for(const x of m.items){assert.equal(x.value,x.expected,x.id);assert(x.font.includes('Pretendard Variable'));for(const r of x.rects){assert(r.left>=x.leftLimit-1&&r.right<=x.rightLimit+1,x.id+' text clipped horizontally');assert(r.top>=x.box.top&&r.bottom<=x.box.bottom,x.id+' text clipped vertically');}assert(x.box.left>=0&&x.box.right<=m.width+1);}}
function readableHome(){
 const luminance=color=>{const c=color.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return .2126*c[0]+.7152*c[1]+.0722*c[2];};
 return ['#startBtn','#quickSummary','#quickStart .quickPrompt','#homeSettings>summary','.selectValue'].map(selector=>{
  const element=document.querySelector(selector),style=getComputedStyle(element);let background=style.backgroundColor;
  for(let parent=element.parentElement;parent&&/rgba\(.*?, 0\)/.test(background);parent=parent.parentElement)background=getComputedStyle(parent).backgroundColor;
  const a=luminance(style.color),b=luminance(background);
  return {selector,contrast:(Math.max(a,b)+.05)/(Math.min(a,b)+.05),size:parseFloat(style.fontSize),weight:Number(style.fontWeight),shadow:style.textShadow,font:style.fontFamily};
 });
}
(async()=>{const results=[];for(const engine of process.env.ENGINES?process.env.ENGINES.split(','):process.env.CI?['chromium']:['chromium','webkit']){
 const browser=await (engine==='chromium'?chromium:webkit).launch({headless:true,...(engine==='chromium'&&!process.env.CI?{channel:'msedge'}:{})});
 for(const [width,height]of [[320,568],[360,800],[390,844],[430,932],[768,1024],[1024,768],[1920,1080]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:width<768,hasTouch:true,deviceScaleFactor:2}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(root+'?qa=1');await page.waitForFunction(()=>window.__game);await require('./home-settings.cjs')(page);await page.evaluate(()=>document.fonts.ready);assert(await page.evaluate(()=>[...document.fonts].some(f=>f.family==='Pretendard Variable'&&f.status==='loaded')&&document.fonts.check('650 17px "Pretendard Variable"','수학 모험 서바이벌')));
  for(const item of await page.evaluate(readableHome)){assert(item.contrast>=4.5,JSON.stringify(item));assert(item.size>=15,JSON.stringify(item));assert(item.weight>=500);assert.equal(item.shadow,'none');assert(item.font.includes('Pretendard Variable'));}
  assert.equal(await page.getByRole('combobox',{name:'게임 모드',exact:true}).count(),1);
  for(const mode of ['survival','boss','explore']){await page.selectOption('#mode',mode);check(await page.evaluate(inspect));}
  for(const grade of [1,2,3,4,5,6]){await page.selectOption('#grade',String(grade));for(const id of await page.locator('#unit option').evaluateAll(es=>es.map(e=>e.value))){await page.selectOption('#unit',id);check(await page.evaluate(inspect));}}
  await page.selectOption('#mode','survival');await page.selectOption('#unit','all');
  await page.screenshot({path:`${out}/${engine}-${width}-menu.png`,fullPage:true});
  // An exceptionally long label must wrap instead of disappearing in a native select.
  await page.evaluate(()=>{const option=document.querySelector('#unit').selectedOptions[0];option.textContent='같은 분모와 서로 다른 분모를 가진 분수의 덧셈과 나눗셈을 함께 연습합니다';document.querySelector('#unit').dispatchEvent(new Event('change',{bubbles:true}));});check(await page.evaluate(inspect));
  await page.selectOption('#mode','explore');await page.fill('#target','1');await page.locator('#startBtn').tap();await page.waitForFunction(()=>__game.clock>=200);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
  const i=await page.evaluate(()=>__game.answerOrbs.findIndex(x=>x.correct));await page.locator('#answerAccess button').nth(i).tap();await page.locator('#continueQuestion').tap();await page.waitForFunction(()=>__game.v2.result?.correct===1);assert.deepEqual(errors,[]);
  results.push({engine,width,height,pass:true});console.log('PASS typography '+engine+' '+width);await context.close();
 }await browser.close();}fs.writeFileSync(out+'/report.json',JSON.stringify({url:root,results},null,2));})().catch(e=>{console.error(e);process.exitCode=1});
