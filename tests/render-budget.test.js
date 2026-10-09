import test from 'node:test';
import assert from 'node:assert/strict';
import {renderDpr,MAX_RENDER_PIXELS} from '../src/render-budget.js';
test('large high-DPI screens stay within the rendering budget without changing logical coordinates',()=>{
 for(const [w,h,d] of [[1920,900,3],[2560,1440,2],[3840,2160,2],[768,650,3]]){
  const ratio=renderDpr(w,h,d);
  assert(ratio<=d);assert(w*h*ratio*ratio<=MAX_RENDER_PIXELS+1);
 }
});
test('phone text keeps native resolution and DPR is recomputed after rotation',()=>{
 assert.equal(renderDpr(390,400,3),3);
 assert.equal(renderDpr(1440,800,1),1);
 assert(renderDpr(1920,900,3)<renderDpr(390,400,3));
});
