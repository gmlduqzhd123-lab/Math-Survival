import test from 'node:test';
import assert from 'node:assert/strict';
import {createResponseTimer} from '../src/response-timer.js';

test('visible thinking time excludes hidden or unfocused intervals and locks on submission',()=>{
 let now=0;const timer=createResponseTimer(()=>now);
 timer.start();now=750;timer.setActive(false);now=6750;
 assert.equal(timer.elapsed(),750);
 timer.setActive(false);timer.setActive(true);now=7000;
 assert.equal(timer.stop(),1000);now=8000;timer.setActive(true);
 assert.equal(timer.elapsed(),1000);assert.equal(timer.stop(),1000);
});
test('new questions and restarts reset the response duration, including initially hidden questions',()=>{
 let now=100;const timer=createResponseTimer(()=>now);
 timer.start();now=800;timer.stop();timer.start(false);now=5800;
 assert.equal(timer.elapsed(),0);timer.setActive(true);now=6100;
 assert.equal(timer.stop(),300);timer.reset();assert.equal(timer.elapsed(),0);
 timer.start();now=6600;assert.equal(timer.stop(),500);
});
