import fs from 'node:fs';
import {generateProblem} from '../src/math-engine.js';
const curriculum=JSON.parse(fs.readFileSync(new URL('../data/curriculum.json',import.meta.url)));
let seed=20261009;const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const problems=curriculum.grades.flatMap(g=>g.units.flatMap(u=>[1,2,3,4,5].map(level=>generateProblem({grade:g.grade,domain:u.domain,unit:u.id,level},curriculum,rng))));
fs.writeFileSync(new URL('../data/question-bank.json',import.meta.url),JSON.stringify({schemaVersion:1,description:'문항 생성기의 단원별 1~5단계 검증용 대표 문항. 실제 게임은 curriculum.json을 기반으로 매번 생성합니다.',problems},null,2));
console.log(problems.length+' representative questions written.');
