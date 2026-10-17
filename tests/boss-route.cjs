const {chromium}=require('playwright'),assert=require('node:assert/strict');
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto((process.env.GAME_URL||'http://127.0.0.1:4173/Math-Survival/')+'?qa=1');
  await page.waitForFunction(()=>window.__game);await require('./home-settings.cjs')(page);
  await page.selectOption('#mode','boss');await page.selectOption('#questionMode','orbs');
  const order=['forest','desert','library','ocean','clockwork','sky'];
  for(const [start,map]of order.entries()){
   await page.selectOption('#mapSelect',map);await page.click('#startBtn');
   const actual=await page.evaluate(()=>{
    const r=__game,route=[];r.state.hp=r.state.maxHp=10000;r.state.exp=-100000;
    for(let i=0;i<3;i++){
     const boss=r.enemies.find(e=>e.boss);if(!boss)throw Error('Missing challenge boss');
     route.push(boss.bossType);boss.hp=0;r.state.paused=false;r.state.levelUpPending=false;
     r.update(16,r.clock);if(!r.items.some(item=>item.type==='bossTreasure'))throw Error('Boss dropped no crown');r.items=r.items.filter(item=>item.type!=='bossTreasure');if(r.state.running)r.v2.tick(16,r.clock);
    }
    return {route,running:r.state.running,kills:r.state.bossKills,outcome:r.v2.result?.outcome};
   });
   assert.deepEqual(actual.route,[0,1,2].map(i=>order[(start+i)%order.length]),map+' route');
   assert.equal(actual.kills,3);assert.equal(actual.running,false);assert.equal(actual.outcome,'complete');
   await page.click('#toStartBtn');
  }
  assert.deepEqual(errors,[]);console.log('PASS all six starting worlds follow the world order and finish after three bosses');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1);});
