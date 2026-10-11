import test from 'node:test';
import assert from 'node:assert/strict';
import {toReviewCSV} from '../src/learning.js';

test('review export contains only displayed wrong questions without changing records',()=>{
 const record={answers:[{text:'맞힌 문제',correct:true}],reviewProblems:[{text:'틀린 "문제"',selected:'2',answer:'3',explain:'첫 줄\n다음 줄'}]};
 const before=JSON.stringify(record),csv=toReviewCSV(record);
 assert.equal(csv,'\uFEFF"문제","내 답","정답","해설"\r\n"틀린 ""문제""","2","3","첫 줄\n다음 줄"');
 assert(!csv.includes('맞힌 문제'));assert.equal(JSON.stringify(record),before);
});
test('review export protects spreadsheet formulas and handles empty reviews',()=>{
 assert(toReviewCSV({reviewProblems:[{text:'=1+1',selected:'@SUM(1)',answer:'-1',explain:'  +2'}]}).includes('"\'=1+1"'));
 assert.equal(toReviewCSV({reviewProblems:[]}).split('\r\n').length,1);
});
