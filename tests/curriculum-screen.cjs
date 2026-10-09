const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const root=process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/';
(async()=>{
 const browser=await chromium.launch({headless:true,...(!process.env.CI?{channel:'msedge'}:{})}),reports=[];
 fs.mkdirSync('test-results/curriculum-screen',{recursive:true});
 for(const [width,height]of [[390,844],[768,1024],[1920,1080],[2547,1293]]){
  const context=await browser.newContext({viewport:{width,height},hasTouch:true}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(root+'?qa=1');await page.waitForFunction(()=>window.__game);await page.locator('.originalHelp summary').click();assert((await page.locator('.originalHelp summary').textContent()).includes('게임 설명서'));assert((await page.locator('#tabContent1').textContent()).includes('백업'));await page.locator('.originalHelp summary').click();
  for(const [grade,unit]of [[1,'g1-data'],[2,'g2-data'],[3,'g3-data'],[4,'g4-data'],[5,'g5-data'],[6,'g6-data']]){
   await page.selectOption('#grade',String(grade));await page.selectOption('#domain','data');await page.selectOption('#unit',unit);await page.selectOption('#mode','explore');await page.click('#startBtn');assert(await page.locator('#questionVisual').isVisible());assert(await page.locator('#questionVisual table,#questionVisual svg').count());assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));assert(await page.evaluate(()=>{const box=document.querySelector('#questionVisual').getBoundingClientRect(),q=document.querySelector('#learningArea').getBoundingClientRect();return box.left>=q.left-1&&box.right<=q.right+1;}));await page.screenshot({path:`test-results/curriculum-screen/${width}-${unit}.png`});await page.click('#mainMenuBtn');
  }
  await page.selectOption('#grade','5');await page.selectOption('#domain','number');await page.selectOption('#unit','g5-frac');assert((await page.locator('#curriculumInfo').textContent()).includes('6수01-08'));await page.click('#startBtn');await page.waitForTimeout(100);const play=await page.locator('#game').boundingBox();console.log({width,height,play});
  if(width>=1100){assert(play.height/height>.70);assert(play.width>width-25);}
  assert.deepEqual(errors,[]);reports.push({width,height,play});await context.close();
 }
 await browser.close();fs.writeFileSync('test-results/curriculum-screen/report.json',JSON.stringify(reports,null,2));console.log(JSON.stringify(reports));
})().catch(e=>{console.error(e);process.exitCode=1;});
