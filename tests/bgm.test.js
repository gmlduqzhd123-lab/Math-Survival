import test from 'node:test';
import assert from 'node:assert/strict';
import {prepareLoop,createBGM} from '../src/bgm.js';

test('BGM loop trims silence, blends the tail into the head and keeps peak headroom',()=>{
 const data=new Float32Array(1200);for(let i=100;i<1100;i++)data[i]=Math.sin(i*.3)*.5;
 const buffer={sampleRate:100,length:1200,numberOfChannels:1,getChannelData:()=>data};
 const original=data.slice(),loop=prepareLoop(buffer,2);
 assert(loop.offset>=.98&&loop.offset<=1.02);assert(loop.loopEnd<=11.02);
 assert.equal(loop.crossfade,2);assert(loop.loopEnd>loop.loopStart);
 const end=Math.round(loop.loopEnd*100),head=Math.round(loop.loopStart*100);
 assert(Math.abs(data[end-1]-original[head-1])<1e-6);
 assert(data.every(x=>Math.abs(x)<=.5));
});
test('BGM has one fetch and one source across overlapping starts, retries failed loads',async()=>{
 const original=globalThis.fetch;let release,fetches=0,starts=0;
 const data=new Float32Array(1000).fill(.1),buffer={sampleRate:100,length:1000,numberOfChannels:1,getChannelData:()=>data};
 const context={currentTime:0,decodeAudioData:async()=>buffer,createBufferSource:()=>({connect(){},start(){starts++;}}),createGain:()=>({connect(){},gain:{setValueAtTime(){},linearRampToValueAtTime(){}}})};
 try{
  globalThis.fetch=async()=>{fetches++;await new Promise(r=>release=r);return {ok:true,arrayBuffer:async()=>new ArrayBuffer(0)};};
  const bgm=createBGM(context,{},'bgm');const first=bgm.start(),second=bgm.start();release();await Promise.all([first,second]);await bgm.start();
  assert.equal(fetches,1);assert.equal(starts,1);assert.equal(bgm.starts,1);assert.equal(bgm.status,'playing');
  const retry=createBGM(context,{},'bgm');globalThis.fetch=async()=>({ok:false,status:503});await retry.start();assert.equal(retry.status,'error');
  globalThis.fetch=async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(0)});await retry.start();assert.equal(retry.status,'playing');
 }finally{globalThis.fetch=original;}
});
