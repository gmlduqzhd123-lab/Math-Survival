import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {generateProblem,equivalent,rational,adaptiveLevel} from '../src/math-engine.js';
import {hazardContains} from '../src/combat-v2.js';
import {readRecords,saveRecord,summarize,toCSV} from '../src/learning.js';
const curriculum=JSON.parse(fs.readFileSync(new URL('../data/curriculum.json',import.meta.url)));
let seed=20261009;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
function reference(p){const [a,b,c,d]=p.operands;switch(p.type){
 case 'add':return a+b;case 'subtract':return a-b;case 'multiply':return a*b;case 'divide':return a/b;
 case 'fraction':return `${a+b}/${c}`;case 'unlikeFraction':return `${a*d+c*b}/${b*d}`;
 case 'fractionMultiply':return `${a*b}/${c*d}`;case 'fractionDivide':return `${a*d}/${b*c}`;
 case 'decimal':return (a+b)/10;case 'decimalMultiply':return a*b/100;case 'decimalDivide':return a/b;
 case 'length':return `${a*100}cm`;case 'time':return `${a*60}초`;case 'area':return `${a*b}cm²`;case 'volume':return `${a*b*c}cm³`;case 'angle':return `${180-a-b}도`;case 'shapes':return a;case 'patterns':return a+3*b;case 'average':return (a+b+c)/3;case 'percent':return a*b/100;case 'ratio':return b*c;default:throw Error(p.type);
}}
for(const grade of curriculum.grades)for(const unit of grade.units){test(`${grade.grade}학년 ${unit.name}: 5단계 × 100개 정확성·선택지`,()=>{
 for(let level=1;level<=5;level++)for(let i=0;i<100;i++){
  const p=generateProblem({grade:grade.grade,unit:unit.id,domain:unit.domain,level},curriculum,rng);
  assert(equivalent(p.answer,reference(p)),JSON.stringify(p));assert.equal(p.options.length,4);assert.equal(new Set(p.options.map(rational)).size,4);assert.equal(p.options.filter(v=>equivalent(v,p.answer)).length,1);assert(p.explain.length>5);assert.equal(p.level,level);assert.equal(p.unit,unit.id);
 }
});}
test('분수 동치·정확한 소수·단위 변환·잘못된 값',()=>{assert(equivalent('2/4','0.5'));assert(equivalent('0.30','3/10'));assert(equivalent('1m','100cm'));assert(equivalent('1분','60초'));assert(equivalent('1000mL','1L'));assert(!equivalent('1cm','1cm²'));assert.throws(()=>rational('1/0'));assert.throws(()=>rational('abc'));});
test('자동 난이도 변경과 경계',()=>{assert.equal(adaptiveLevel(2,Array(5).fill({correct:true})),3);assert.equal(adaptiveLevel(2,Array(5).fill({correct:false})),1);assert.equal(adaptiveLevel(5,Array(5).fill({correct:true})),5);assert.equal(adaptiveLevel(1,Array(5).fill({correct:false})),1);assert.equal(adaptiveLevel(3,[{correct:true}]),3);});
test('보스 공격 형태별 충돌 및 회피',()=>{for(const h of [{shape:'circle',x:0,y:0,r:50},{shape:'rect',x:0,y:0,w:100,h:100},{shape:'beam',x:0,y:0,angle:0,length:100,width:20}]){assert(hazardContains(h,{x:10,y:10,r:5}));assert(!hazardContains(h,{x:200,y:200,r:5}));}const ring={shape:'ring',x:0,y:0,r:100,width:10};assert(hazardContains(ring,{x:100,y:0,r:5}));assert(!hazardContains(ring,{x:0,y:0,r:5}));});
test('학습 기록·영역 집계·CSV 인용·저장 제한',()=>{const p=generateProblem({grade:5,unit:'g5-frac',level:2},curriculum,rng);const answers=[{...p,correct:true,selected:p.answer},{...p,correct:false,selected:'0'}];const record=summarize({score:10,time:25,level:2,kills:3,correct:1,wrong:1,bestCombo:1},answers,{grade:5});assert.equal(record.accuracy,50);assert.equal(record.domains.number.accuracy,50);assert.equal(record.reviewProblems.length,1);const values=new Map();const storage={getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v)};assert(saveRecord(record,storage));assert.equal(readRecords(storage).length,1);assert(toCSV(record).startsWith('\uFEFF'));assert(toCSV(record).includes('"정답"'));assert.equal(saveRecord(record,{getItem:()=>null,setItem:()=>{throw Error('quota');}}),false);});
test('외부 문제은행 대표 145문항 검증',()=>{const bank=JSON.parse(fs.readFileSync(new URL('../data/question-bank.json',import.meta.url)));assert.equal(bank.problems.length,145);for(const p of bank.problems){assert(equivalent(p.answer,reference(p)));assert.equal(new Set(p.options.map(rational)).size,4);assert.equal(p.options.filter(v=>equivalent(v,p.answer)).length,1);}});
