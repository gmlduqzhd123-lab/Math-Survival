export const KEY='math-survival-2.learning.v2',LEGACY='math-survival-2.records.v1',MAX_BACKUP_BYTES=10*1024*1024;
const empty=()=>({schemaVersion:2,records:[],mastery:{},checkpoint:null,quarantine:[]});
const plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
const nonnegative=x=>typeof x==='number'&&Number.isFinite(x)&&x>=0;
export function validRecord(x){
 if(!plain(x)||x.schemaVersion!==2||typeof x.sessionId!=='string'||!x.sessionId.length||x.sessionId.length>200||typeof x.date!=='string'||!Number.isFinite(Date.parse(x.date))||!plain(x.config)||!Number.isInteger(x.config.grade)||x.config.grade<1||x.config.grade>6||!Array.isArray(x.answers)||!['complete','defeat','quit','interrupted','time-limit','checkpoint','legacy'].includes(x.outcome))return false;
 if(['score','survivalSeconds','level','kills','correct','wrong','bestCombo'].some(k=>x[k]!=null&&!nonnegative(x[k])))return false;
 if(x.config.mode!=null&&!['survival','boss','explore'].includes(x.config.mode))return false;
 return x.answers.every(a=>plain(a)&&typeof a.text==='string'&&typeof a.answer==='string'&&typeof a.correct==='boolean'&&typeof a.unit==='string'&&Number.isInteger(a.level)&&a.level>=1&&a.level<=5&&(a.responseMs==null||nonnegative(a.responseMs))&&(a.hintUsed==null||typeof a.hintUsed==='boolean')&&(a.review==null||typeof a.review==='boolean'));
}
function validateMastery(data,quarantine){
 const out={};for(const [unit,e]of Object.entries(data)){
  if(!/^g[1-6]-[a-z]+$/.test(unit)||!plain(e)||!Number.isInteger(e.level)||e.level<1||e.level>5||!Array.isArray(e.window)||e.window.length>4||!e.window.every(x=>typeof x==='boolean')||!Array.isArray(e.seen)||!e.seen.every(x=>typeof x==='string')||!plain(e.reviews)){quarantine.push({reason:'숙련도 상태 손상',unit,row:e});continue;}
  const reviews={};for(const [key,r]of Object.entries(e.reviews)){
   if(!plain(r)||r.unit!==unit||typeof r.type!=='string'||!Number.isInteger(r.level)||r.level<1||r.level>5||!Array.isArray(r.operands)||!r.operands.every(Number.isFinite)||!Array.isArray(r.successConcepts)||!r.successConcepts.every(x=>typeof x==='string')||!Number.isFinite(r.nextDue)){quarantine.push({reason:'복습 상태 손상',unit,key,row:r});continue;}
   reviews[key]={...r,successConcepts:[...new Set(r.successConcepts)],successCount:new Set(r.successConcepts).size,resolved:new Set(r.successConcepts).size>=2};
  }out[unit]={...e,reviews};
 }return out;
}
export function validateDatabase(data){
 if(!plain(data)||data.schemaVersion!==2||!Array.isArray(data.records)||!plain(data.mastery))throw new Error('지원하는 schemaVersion 2 백업이 아닙니다.');
 const db=empty(),ids=new Set();for(const [i,row]of data.records.entries()){
  if(!validRecord(row)){db.quarantine.push({index:i,reason:'잘못된 기록',row});continue;}
  if(ids.has(row.sessionId))continue;ids.add(row.sessionId);db.records.push(row);
 }db.mastery=validateMastery(data.mastery,db.quarantine);db.checkpoint=validRecord(data.checkpoint)?data.checkpoint:null;
 db.quarantine.push(...(Array.isArray(data.quarantine)?data.quarantine:[]));return db;
}
export function createStore(storage){
 let data=empty(),error='',available=true,storedRaw=null;
 try{
  storage??=globalThis.localStorage;storedRaw=storage.getItem(KEY);
  if(storedRaw)data=validateDatabase(JSON.parse(storedRaw));
  else{const legacy=storage.getItem(LEGACY);if(legacy){
   storage.setItem(LEGACY+'.backup',legacy);let rows;try{rows=JSON.parse(legacy);}catch{rows=null;}
   if(!Array.isArray(rows))data.quarantine.push({reason:'v1 JSON 손상',raw:legacy});
   else for(const [i,row]of rows.entries()){
    const converted={...row,schemaVersion:2,sessionId:'legacy-'+i+'-'+(row?.date||'unknown'),outcome:row?.outcome||'legacy',legacy:true};
    if(validRecord(converted))data.records.push(converted);else data.quarantine.push({index:i,reason:'v1 기록 손상',row});
   }storage.setItem(KEY,JSON.stringify(data));
  }}
 }catch(e){available=false;error='브라우저 기록을 읽거나 이전하지 못했습니다. '+e.message;if(storedRaw)data.quarantine.push({reason:'v2 JSON/스키마 손상',raw:storedRaw});}
 function persist(){try{
  if(storedRaw&&data.quarantine.some(x=>x.raw===storedRaw))storage.setItem(KEY+'.damaged-backup',storedRaw);
  storage.setItem(KEY,JSON.stringify(data));available=true;error='';return true;
 }catch(e){available=false;error='기록 저장 실패: '+e.message;return false;}}
 if(data.checkpoint){if(data.checkpoint.answers.length){const row={...data.checkpoint,outcome:'interrupted',resultReason:'페이지 종료 후 체크포인트 복구'};data.records=data.records.filter(x=>x.sessionId!==row.sessionId);data.records.push(row);}data.checkpoint=null;persist();}
 return {
  get data(){return data;},get error(){return error;},get available(){return available;},persist,
  checkpoint(row,mastery){data.checkpoint={...row,outcome:'checkpoint'};data.mastery=structuredClone(mastery);return persist();},
  save(row,mastery){if(!validRecord(row)){error='기록 형식이 올바르지 않습니다.';return false;}data.records=data.records.filter(x=>x.sessionId!==row.sessionId);data.records.push(row);data.checkpoint=null;data.mastery=structuredClone(mastery);return persist();},
  preview(text){
   if(new TextEncoder().encode(text).length>MAX_BACKUP_BYTES)throw new Error('백업은 10 MiB 이하여야 합니다.');const parsed=JSON.parse(text),incoming=validateDatabase(parsed);
   if(incoming.quarantine.length>(parsed.quarantine?.length||0))throw new Error('잘못된 기록이 포함된 백업입니다. 복원을 적용하지 않았습니다.');
   const ids=new Set(data.records.map(x=>x.sessionId));return {incoming,added:incoming.records.filter(x=>!ids.has(x.sessionId)).length,duplicates:incoming.records.filter(x=>ids.has(x.sessionId)).length};
  },
  restore(preview){
   const byId=new Map([...preview.incoming.records,...data.records].map(x=>[x.sessionId,x]));data.records=[...byId.values()];
   for(const [unit,incoming]of Object.entries(preview.incoming.mastery)){
    const existing=data.mastery[unit];if(!existing){data.mastery[unit]=incoming;continue;}existing.seen=[...new Set([...existing.seen,...incoming.seen])];
    for(const [key,rev]of Object.entries(incoming.reviews)){
     const current=existing.reviews[key];if(!current){existing.reviews[key]=rev;continue;}
     current.successConcepts=[...new Set([...current.successConcepts,...rev.successConcepts])];current.successCount=current.successConcepts.length;current.resolved=current.successCount>=2;
    }
   }data.quarantine=[...new Map([...data.quarantine,...preview.incoming.quarantine].map(x=>[JSON.stringify(x),x])).values()];return persist();
  },
  discardCheckpoint(){data.checkpoint=null;return persist();},
  remove(ids,allRequested=false){const all=allRequested||ids.length>0&&data.records.every(x=>ids.includes(x.sessionId));data.records=all?[]:data.records.filter(x=>!ids.includes(x.sessionId));data.mastery={};if(all){data.quarantine=[];data.checkpoint=null;storedRaw=null;try{for(const key of [LEGACY,LEGACY+'.backup',KEY+'.damaged-backup'])storage?.removeItem?.(key);}catch(e){error='이관 백업 삭제 실패: '+e.message;return false;}}return persist();},backup(){return JSON.stringify(data,null,2);}
 };
}
