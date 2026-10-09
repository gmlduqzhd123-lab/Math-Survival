export const STORAGE_KEY='math-survival-2.records.v1';
export function readRecords(storage=globalThis.localStorage){try{const rows=JSON.parse(storage.getItem(STORAGE_KEY)||'[]');return Array.isArray(rows)?rows.filter(r=>r&&Array.isArray(r.answers)).slice(-100):[];}catch{return [];}}
export function saveRecord(record,storage=globalThis.localStorage){try{const rows=readRecords(storage);rows.push(record);storage.setItem(STORAGE_KEY,JSON.stringify(rows.slice(-100)));return true;}catch{return false;}}
export function summarize(state,answers,config){
 const domains={};for(const row of answers){const d=domains[row.domain]??={correct:0,total:0};d.total++;if(row.correct)d.correct++;}
 for(const d of Object.values(domains))d.accuracy=Math.round(d.correct/d.total*100);
 const weak=answers.filter(a=>!a.correct);
 return {schemaVersion:1,date:new Date().toISOString(),config:{...config},score:state.score,survivalSeconds:Math.floor(state.time),level:state.level,kills:state.kills,correct:state.correct,wrong:state.wrong,accuracy:answers.length?Math.round(state.correct/answers.length*100):0,bestCombo:state.bestCombo,domains,weakProblems:weak.map(w=>({text:w.text,selected:w.selected,answer:w.answer,explain:w.explain,unit:w.unit})),reviewProblems:[...new Map(weak.map(w=>[w.id,w])).values()],answers};
}
const csvCell=value=>'"'+String(value??'').replaceAll('"','""')+'"';
export function toCSV(record){const headers=['일시','점수','생존초','레벨','처치','학년','영역','단원','문제','선택','정답','정답여부','해설'];const rows=record.answers.length?record.answers:[{}];return '\uFEFF'+[headers,...rows.map(r=>[record.date,record.score,record.survivalSeconds,record.level,record.kills,r.grade,r.domain,r.unit,r.text,r.selected,r.answer,r.correct==null?'':r.correct?'정답':'오답',r.explain])].map(row=>row.map(csvCell).join(',')).join('\r\n');}
export function downloadRecord(record,type){if(!record)return;const blob=new Blob([type==='json'?JSON.stringify(record,null,2):toCSV(record)],{type:type==='json'?'application/json;charset=utf-8':'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`math-survival-${record.date.slice(0,10)}.${type}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
