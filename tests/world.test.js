import test from 'node:test';
import assert from 'node:assert/strict';
import {worldLayout,regionAt,visibleChunks,WORLD_SIZE,createWorld} from '../src/v3/world.js';
import {MAPS} from '../src/MAPS.js';
test('Six overworlds have nine connected regions and bounded functional sites',()=>{
 for(const [key,map] of Object.entries(MAPS)){
  const l=worldLayout(key);assert.deepEqual(l,worldLayout(key));assert.equal(map.worldW,WORLD_SIZE.width);assert.equal(map.worldH,WORLD_SIZE.height);assert.equal(l.regions.length,9);assert.equal(new Set(l.regions.map(z=>z.name)).size,9);assert.equal(l.roads.length,12);
  const reached=new Set([4]);for(let pass=0;pass<9;pass++)for(const [x,y,tx,ty] of l.roads){const a=regionAt(l,x,y).id,b=regionAt(l,tx,ty).id;if(reached.has(a)||reached.has(b)){reached.add(a);reached.add(b);}}assert.equal(reached.size,9);
  assert.equal(new Set(l.sites.map(e=>e.type)).size,4);for(const e of l.sites){assert(e.x>70&&e.x<l.width-70&&e.y>70&&e.y<l.height-70);if(e.destination){assert(Math.hypot(e.x-e.destination.x,e.y-e.destination.y)>2000);assert.equal(regionAt(l,e.destination.x,e.destination.y).id,6);}}
 }
});
test('World discovery resets per run and dungeon receives no overworld events',()=>{
 const r={state:{currentMapKey:'forest',worldW:7200,worldH:5400},player:{x:3600,y:2700},showToast(){},v3:{dungeon:{active:false}}};const w=createWorld(r);w.start();w.tick();assert.equal(w.visited.size,1);w.tick();assert.equal(w.visited.size,1);w.sites[0].used=true;w.tick();assert(w.sites[0].used);r.v3.dungeon.active=true;assert.equal(w.sites.length,0);r.v3.dungeon.active=false;w.start();assert(!w.sites[0].used);assert.equal(w.visited.size,0);
});
test('Viewport chunk selection is bounded independently of explored area',()=>{
 for(let y=0;y<5400;y+=900)for(let x=0;x<7200;x+=1200){const chunks=visibleChunks(x,y,430,750);assert(chunks.length<=15);assert(chunks.every(([cx,cy])=>cx>=0&&cx<24&&cy>=0&&cy<18));}assert(visibleChunks(0,0,1920,1080).length<=40);
});

test('Region discovery announces each place only once per run',()=>{let notices=0;const r={state:{currentMapKey:'forest',worldW:7200,worldH:5400},player:{x:3600,y:2700},showToast(){notices++;},v3:{dungeon:{active:false}}};const w=createWorld(r);w.start();w.tick();r.player.x=2390;w.tick();r.player.x=2410;w.tick();assert.equal(notices,2);assert.equal(w.visited.size,2);});

test('Overworld obstacles leave roads, plazas and sites open and never touch each other',async()=>{
 const {PASS_GAP,ROAD_CLEAR,PLAZA_CLEAR,obstacleGrid,blocked,constrain}=await import('../src/v3/terrain.js');
 for(const key of Object.keys(MAPS)){const l=worldLayout(key);assert(l.obstacles.length>=9*8,key+' has too few obstacles');assert(new Set(l.obstacles.map(o=>o.kind)).size>=4);
  for(const o of l.obstacles){const z=l.regions[o.region];assert(Math.hypot(o.x-z.cx,o.y-z.cy)>=PLAZA_CLEAR+o.r);for(const s of l.sites)assert(Math.hypot(o.x-s.x,o.y-s.y)>=o.r+150);for(const p of l.obstacles)if(p!==o)assert(Math.hypot(o.x-p.x,o.y-p.y)>=o.r+p.r+PASS_GAP);}
  const grid=obstacleGrid(l.obstacles);for(const [ax,ay,bx,by] of l.roads)for(let t=0;t<=1;t+=.01)assert(!blocked(grid,ax+(bx-ax)*t,ay+(by-ay)*t,ROAD_CLEAR-10),key+' road blocked');
  for(const z of l.regions)assert(!blocked(grid,z.cx,z.cy,40));
  const pond=l.obstacles.find(o=>o.kind!=='fence'),e={x:pond.x+1,y:pond.y,r:19};constrain(grid,e);assert(!blocked(grid,e.x,e.y,18.5));}
});
test('Walking or dashing into any obstacle stops on the near side of its drawn shape',async()=>{
 const {obstacleGrid,constrain,HIT}=await import('../src/v3/terrain.js');
 for(const key of Object.keys(MAPS)){const l=worldLayout(key),grid=obstacleGrid(l.obstacles),seen=new Set();
  for(const o of l.obstacles){if(seen.has(o.kind))continue;seen.add(o.kind);
   // Aim at the middle of the blocking shape so the approach is head-on rather than a glancing slide.
   const cx=o.x,cy=o.y+(o.kind==='fence'?o.dy:HIT[o.kind][0][1]*o.s);
   for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){const e={x:cx-dx*(o.r+60),y:cy-dy*(o.r+60),r:19};
    for(let i=0;i<60;i++){e.x+=dx*8;e.y+=dy*8;constrain(grid,e);}
    const side=dx*(e.x-cx)+dy*(e.y-cy);assert(side<0,key+' '+o.kind+' passed through from '+dx+','+dy);}}
  assert(seen.size>=4,key+' kinds');}
});
