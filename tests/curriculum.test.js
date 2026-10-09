import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {generateProblem} from '../src/math-engine.js';
const c=JSON.parse(fs.readFileSync(new URL('../data/curriculum.json',import.meta.url)));
test('2022 개정 성취기준 연결·학년군·정정 단원·네 영역',()=>{
 for(const g of c.grades)for(const u of g.units){assert(u.achievementStandards.length);const band=g.grade<=2?2:g.grade<=4?4:6;assert(u.achievementStandards.every(code=>new RegExp(`^${band}수0[1-4]-\\d{2}$`).test(code)),u.id);assert(u.gradeBand);assert(u.practiceScope);assert(!u.name.includes('다른 분모'));}
 for(const domain of Object.keys(c.domains))assert(c.grades.some(g=>g.units.some(u=>u.domain===domain)));
 const units=c.grades.flatMap(g=>g.units);assert.equal(units.find(u=>u.id==='g3-dec').type,'decimalPlace');assert.equal(units.find(u=>u.id==='g5-frac').name,'분모가 다른 분수의 덧셈');assert(!c.grades[2].units.some(u=>u.type==='shapes'));
});
test('곱셈·나눗셈·세 자리 계산·두 자리 소수·직관적인 가능성 범위',()=>{
 for(let seed=0;seed<100;seed++)for(let level=1;level<=5;level++){
  const make=(grade,unit)=>generateProblem({grade,unit,level,seed},c);
  const m=make(3,'g3-mul');assert(m.operands[0]>=10&&m.operands[0]<=99);assert(m.operands[1]<=9);
  const d=make(3,'g3-div');assert(d.operands[1]<=9);assert(d.operands[0]%d.operands[1]===0);
  for(const unit of ['g3-add','g3-sub']){const q=make(3,unit);assert(q.operands[0]>=100&&q.operands[0]<=999);assert(q.operands[1]>=100&&q.operands[1]<=999);}
  assert.equal(make(4,'g4-dec').operands[2],2);
  assert(['0','1/2','1'].includes(make(6,'g6-probability').answer));
 }
});
