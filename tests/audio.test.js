import test from 'node:test';
import assert from 'node:assert/strict';
import {createSystem} from '../src/ui.js';

test('오디오 API 없음·생성 차단·재개 거부가 게임 시작을 중단하지 않음', async () => {
  const previous = globalThis.window;
  try {
    for (const AudioContext of [undefined, class { constructor() { throw new Error('blocked'); } }]) {
      globalThis.window = {AudioContext};
      const runtime = {audioReady: false};
      assert.doesNotThrow(() => createSystem(runtime).initAudio());
      assert.equal(runtime.audioReady, false);
    }
    const runtime = {audioReady: true, audioCtx: {state: 'suspended', resume: () => Promise.reject(new Error('blocked'))}};
    assert.doesNotThrow(() => createSystem(runtime).initAudio());
    await new Promise(resolve => setImmediate(resolve));
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});

test('audio interruptions resume and a closed device gets a fresh graph on interaction',async()=>{
 const previous=globalThis.window;
 try{
  globalThis.window={};let resumes=0;
  const interrupted={audioReady:true,audioCtx:{state:'interrupted',resume:async()=>{resumes++;}}};
  createSystem(interrupted).initAudio();assert.equal(resumes,1);
  const gain=()=>({gain:{value:0},connect(){}});
  class Context{state='suspended';destination={};createGain=gain;resume(){this.state='running';return Promise.resolve();}}
  globalThis.window.AudioContext=Context;
  const old={state:'closed'},runtime={audioReady:true,audioCtx:old,musicTimer:{old:true},muted:true,startPersistentMusic(){assert.equal(this.musicTimer,null);this.musicTimer={fresh:true};}};
  createSystem(runtime).initAudio();assert.notEqual(runtime.audioCtx,old);assert.equal(runtime.audioReady,true);
  assert.equal(runtime.audioCtx.state,'running');assert.equal(runtime.masterGain.gain.value,0);assert(runtime.musicTimer.fresh);
 }finally{if(previous===undefined)delete globalThis.window;else globalThis.window=previous;}
});
