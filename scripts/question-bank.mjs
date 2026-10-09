import fs from 'node:fs';
import {GENERATOR_VERSION} from '../src/version.js';
import {generateProblem} from '../src/math-engine.js';
const curriculum=JSON.parse(fs.readFileSync(new URL('../data/curriculum.json',import.meta.url)));
let seed=20261009;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const problems=curriculum.grades.flatMap(g=>g.units.flatMap(u=>[1,2,3,4,5].map((level,i)=>generateProblem({grade:g.grade,domain:u.domain,unit:u.id,level:u.supportedLevels.includes(level)?level:1,seed:seed++},curriculum))));
fs.writeFileSync(new URL('../data/question-bank.json',import.meta.url),JSON.stringify({schemaVersion:2,curriculumVersion:curriculum.curriculumVersion,generatorVersion:GENERATOR_VERSION,description:`${curriculum.grades.reduce((n,g)=>n+g.units.length,0)} 연습 단원 × 5개 대표 표본. 지원 단계에서 생성한 표본이며 전체 교육과정 평가를 대체하지 않습니다.`,problems},null,2));
console.log(problems.length+' representative questions written.');
