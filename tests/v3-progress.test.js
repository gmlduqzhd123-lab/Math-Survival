import test from 'node:test';import assert from 'node:assert/strict';
import {createProgress,validateProgress,PROGRESS_KEY,ACHIEVEMENTS,dailySeed} from '../src/v3/progress.js';import {KEY} from '../src/storage.js';import {baseMode} from '../src/v3/modes.js';
const fixture=()=>{const m=new Map([[KEY,'protected learning bytes']]);return {m,getItem:k=>m.get(k)||null,setItem:(k,v)=>m.set(k,v)};};
test('별도 성장 키·정산 멱등·영구 강화·해금·학습 원문 보존',()=>{const st=fixture(),store=createProgress(st),run={id:'run1',kills:100,correct:10,bosses:1,seconds:90,gold:500,evolutions:1,seen:{worlds:['forest'],monsters:['sprout']}};assert(store.settle(run));const coins=store.data.coins;assert(!store.settle(run));assert.equal(store.data.coins,coins);assert.equal(st.getItem(KEY),'protected learning bytes');assert(store.upgrade('health'));assert(store.unlock('characters','rabbit',60,true));assert(!store.unlock('characters','rabbit',60,true));const reload=createProgress(st);assert.equal(reload.data.upgrades.health,1);assert(reload.data.characters.includes('rabbit'));assert(ACHIEVEMENTS.length>=30);assert(store.data.achievements.length>=5);assert.notEqual(PROGRESS_KEY,KEY);});
test('손상 성장 JSON은 자동 덮어쓰기 금지·quota 표시·복원 검증',()=>{const st=fixture();st.setItem(PROGRESS_KEY,'{broken');const store=createProgress(st);assert(store.blocked);store.settle({id:'x',gold:5});assert.equal(st.getItem(PROGRESS_KEY),'{broken');assert.equal(st.getItem(KEY),'protected learning bytes');assert.throws(()=>store.restore('{}'));const quota=createProgress({getItem:()=>null,setItem(){throw Error('quota');}});quota.settle({id:'q',gold:4});assert(quota.error.includes('저장 실패'));});
test('서울 날짜 도전 seed·새 모드는 기존 학습 모드로 매핑',()=>{assert.deepEqual(dailySeed(new Date('2026-10-08T16:00:00Z')),dailySeed(new Date('2026-10-09T02:00:00Z')));assert.notEqual(dailySeed(new Date('2026-10-09T02:00:00Z')).seed,dailySeed(new Date('2026-10-10T02:00:00Z')).seed);assert.equal(baseMode('dungeon'),'explore');for(const mode of ['timed','defense','daily','endless'])assert.equal(baseMode(mode),'survival');});
test('손상된 성장 기록은 복원 전에 거부하고 기존 학습·성장 원문을 보존',()=>{
 const st=fixture(),store=createProgress(st);store.settle({id:'saved',gold:40,seconds:10});
 const before=JSON.stringify(store.data),stored=st.getItem(PROGRESS_KEY);
 for(const row of [null,4,'bad',[],{date:123},{date:'not-a-date'},{gold:'<img>'},{seconds:-1}]){
  const bad={...JSON.parse(before),history:[row]};
  assert.throws(()=>store.restore(JSON.stringify(bad)),/게임 기록 형식 오류/);
  assert.equal(JSON.stringify(store.data),before);assert.equal(st.getItem(PROGRESS_KEY),stored);
 }
 const broken=JSON.stringify({...JSON.parse(before),history:[null]});st.setItem(PROGRESS_KEY,broken);
 const reloaded=createProgress(st);assert(reloaded.blocked);assert(reloaded.error.includes('게임 기록 형식 오류'));
 reloaded.settle({id:'new',gold:20});assert.equal(st.getItem(PROGRESS_KEY),broken);
 assert.equal(st.getItem(KEY),'protected learning bytes');
 for(const key of ['upgrades','stats','seen'])for(const value of [[],4,'bad'])assert.throws(()=>validateProgress({...JSON.parse(before),[key]:value}),/게임 성장 백업 형식 오류/);
});
test('이전 성장 백업의 선택 항목 생략과 부분 음량 설정은 기본값으로 호환',()=>{
 const legacy=structuredClone(createProgress(fixture()).data);delete legacy.audio;
 legacy.history=[{id:'old',gold:4,date:'2026-10-09T02:00:00Z'}];
 assert.deepEqual(validateProgress(legacy).audio,{master:1,music:.6,effects:.8});
 legacy.audio={music:.2};assert.deepEqual(validateProgress(legacy).audio,{master:1,music:.2,effects:.8});
 for(const audio of [[],1,'bad',{master:2},{music:null}])assert.throws(()=>validateProgress({...legacy,audio}),/음량 형식 오류/);
});
test('성장 복원 저장이 실패하면 현재 메모리와 저장 기록도 교체하지 않음',()=>{
 const st=fixture(),store=createProgress(st);store.settle({id:'current',gold:15});
 const before=JSON.stringify(store.data),stored=st.getItem(PROGRESS_KEY);
 st.setItem=()=>{throw Error('quota');};
 assert.equal(store.restore(JSON.stringify({...JSON.parse(before),coins:99})),false);
 assert.equal(JSON.stringify(store.data),before);assert.equal(st.getItem(PROGRESS_KEY),stored);assert(!store.blocked);assert(store.error.includes('저장 실패'));
 const blocked=createProgress({getItem:()=>'{broken',setItem:st.setItem});
 assert.equal(blocked.restore(before),false);assert(blocked.blocked);assert.equal(blocked.data.coins,0);
});
