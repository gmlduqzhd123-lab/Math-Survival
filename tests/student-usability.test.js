import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {validRecord} from '../src/storage.js';
import {mergeResults} from '../src/v3/teacher.js';
import {generateProblem,equivalent} from '../src/math-engine.js';
import {speakableMath} from '../src/speech.js';
import {CORRECT_EXP_SHARE,WRONG_HP_PENALTY} from '../src/math.js';
const curriculum=JSON.parse(fs.readFileSync(new URL('../data/curriculum.json',import.meta.url)));
const row=(id,studentNo,correct=true)=>({schemaVersion:2,sessionId:id,date:'2026-10-17T01:00:00Z',config:{grade:3,mode:'survival'},outcome:'defeat',...(studentNo==null?{}:{studentNo}),answers:[{unit:'g3-add',type:'addition',level:2,text:'1+2',answer:'3',correct}]});

test('학생 번호는 1~99 정수만 기록에 허용',()=>{assert(validRecord(row('a',12)));assert(validRecord(row('b',null)));for(const bad of [0,100,1.5,'12','홍길동'])assert.equal(validRecord(row('c',bad)),false);});

test('학급 집계는 번호별로 게임 수와 정답을 나눔',()=>{const report=mergeResults([{name:'one',text:JSON.stringify({records:[row('a',3),row('b',3,false),row('c',12),row('d',null)]})}]);assert.deepEqual(report.students['3번'],{games:2,total:2,correct:1});assert.deepEqual(report.students['12번'],{games:1,total:1,correct:1});assert.equal(report.students['번호 없음'].games,1);});

test('1학년 도형 문제는 변 대신 곧은 선으로 묻는다',()=>{for(let seed=1;seed<40;seed++){const p=generateProblem({grade:1,domain:'all',unit:'g1-shapes',level:1,seed},curriculum);assert(!p.text.includes('변'),p.text);assert.match(p.text,/곧은 선/);}});

test('답이 자연수인 분수 나눗셈도 보기를 분수로 만든다',()=>{let checked=0;for(let seed=1;seed<400&&checked<5;seed++){const p=generateProblem({grade:6,domain:'all',unit:'g6-fracdiv',level:3,seed},curriculum);if(p.answer.includes('/'))continue;checked++;for(const o of p.options)if(!equivalent(o,p.answer))assert.match(o,/^\d+(\/\d+)?$/,o);}assert(checked>0,'no whole-number answer sampled');});

test('문제 읽어 주기는 기호를 우리말로 바꾼다',()=>{assert.equal(speakableMath('7 × 8 = ?'),'7 곱하기 8 은 얼마일까요?');assert.equal(speakableMath('2/3 ÷ 5/6 = ?'),'3분의 2 나누기 6분의 5 는 얼마일까요?');assert.equal(speakableMath('3 m = ? cm'),'3 미터 는 몇 센티미터일까요?');assert.equal(speakableMath('35 − 14 = ?'),'35 빼기 14 는 얼마일까요?');});

test('정답 보상이 오답 벌칙보다 크다',()=>{assert(CORRECT_EXP_SHARE>=0.5);assert(WRONG_HP_PENALTY>2);});
