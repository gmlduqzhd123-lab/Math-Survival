import fs from 'node:fs';
import {generateProblem} from '../src/math-engine.js';
const curriculum=JSON.parse(fs.readFileSync(new URL('../data/curriculum.json',import.meta.url)));
let seed=20261009;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const problems=curriculum.grades.flatMap(g=>g.units.flatMap(u=>[1,2,3,4,5].map((level,i)=>generateProblem({grade:g.grade,domain:u.domain,unit:u.id,level:u.supportedLevels.includes(level)?level:1,seed:seed++},curriculum))));
fs.writeFileSync(new URL('../data/question-bank.json',import.meta.url),JSON.stringify({schemaVersion:2,curriculumVersion:curriculum.curriculumVersion,generatorVersion:'3',description:'29단원 × 5개 대표 표본 = 145개. 도형 식별은 지원 단계 1에서 서로 다른 seed 5개를 생성합니다. 실제 게임은 생성기 버전 3을 사용합니다.',problems},null,2));
console.log(problems.length+' representative questions written.');
