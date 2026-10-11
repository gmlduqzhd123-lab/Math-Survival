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
