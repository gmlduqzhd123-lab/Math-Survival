import {createStore,KEY} from './storage.js';
export const STORAGE_KEY=KEY;
export function readRecords(storage){return createStore(storage).data.records;}
export function saveRecord(record,storage){const store=createStore(storage);return store.save(record,store.data.mastery);}
export function summarize(state,answers,config){
 const domains={};for(const row of answers){const d=domains[row.domain]??={correct:0,total:0};d.total++;if(row.correct)d.correct++;}
 for(const d of Object.values(domains))d.accuracy=Math.round(d.correct/d.total*100);
 const weak=answers.filter(a=>!a.correct);
 const units={};for(const a of answers){const u=units[a.unit]??={total:0,correct:0,newTotal:0,newCorrect:0,reviewTotal:0,reviewCorrect:0,hints:0};u.total++;u.correct+=Number(a.correct);u[a.review?'reviewTotal':'newTotal']++;if(a.correct)u[a.review?'reviewCorrect':'newCorrect']++;u.hints+=Number(!!a.hintUsed);}
 const rate=rows=>rows.length?Math.round(rows.filter(x=>x.correct).length/rows.length*100):null;
 return {schemaVersion:2,date:new Date().toISOString(),config:{...config},score:state.score,survivalSeconds:Math.floor(state.time),level:state.level,kills:state.kills,correct:answers.filter(x=>x.correct).length,wrong:weak.length,accuracy:rate(answers),newAccuracy:rate(answers.filter(x=>!x.review)),reviewAccuracy:rate(answers.filter(x=>x.review)),hintCount:answers.filter(x=>x.hintUsed).length,bestCombo:state.bestCombo,domains,units,weakProblems:weak.map(w=>({text:w.text,selected:w.selected,answer:w.answer,explain:w.explain,unit:w.unit})),reviewProblems:[...new Map(weak.map(w=>[w.id,w])).values()],answers:structuredClone(answers)};
}
const csvCell=value=>'"'+String(value??'').replaceAll('"','""')+'"';
export function toCSV(record){const headers=['일시','점수','생존초','레벨','처치','학년','영역','단원','문제','선택','정답','정답여부','해설','세션ID','모드','결과','종료이유','실제수학단계','응답ms','복습','힌트','인스턴스ID'];const rows=record.answers.length?record.answers:[{}];return '\uFEFF'+[headers,...rows.map(r=>[record.date,record.score,record.survivalSeconds,record.level,record.kills,r.grade,r.domain,r.unit,r.text,r.selected,r.answer,r.correct==null?'':r.correct?'정답':'오답',r.explain,record.sessionId,record.config.mode,record.outcome,record.resultReason,r.level,r.responseMs,r.review,r.hintUsed,r.instanceId])].map(row=>row.map(csvCell).join(',')).join('\r\n');}
export function downloadRecord(record,type){if(!record)return;const blob=new Blob([type==='json'?JSON.stringify(record,null,2):toCSV(record)],{type:type==='json'?'application/json;charset=utf-8':'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`math-survival-${record.date.slice(0,10)}.${type}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
