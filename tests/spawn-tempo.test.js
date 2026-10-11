import test from 'node:test';import assert from 'node:assert/strict';
import {waveFor,spawnRange} from '../src/v3/performance.js';
test('Enemy arrivals are earlier without changing health or the difficulty ordering',()=>{
 for(const seconds of [0,30,120,300]){const wave=1+Math.floor(seconds/30),old=Math.max(180,1100-wave*45);assert(waveFor(seconds).delay<old);assert.equal(waveFor(seconds).health,1+Math.min(12,wave*.12));assert(waveFor(seconds,'easy').delay>waveFor(seconds).delay);assert(waveFor(seconds,'hard').delay<waveFor(seconds).delay);}
 const mobile=spawnRange(378,624),desktop=spawnRange(1904,900);assert.equal(mobile.near,330);assert(mobile.far<520);assert(desktop.near>=500);assert.equal(desktop.far-desktop.near,160);
});
