// Only distinct, unassisted first attempts consume an adaptation window.
export function createMastery(saved={}){
 const units=structuredClone(saved);
 function entry(unit,level=1){return units[unit]??={level,window:[],seen:[],reviews:{}};}
 return {units,level(unit,fixed,auto,supported=[1,2,3,4,5]){const baseline=supported.includes(fixed)?fixed:supported[0],e=entry(unit,baseline);return auto?(supported.includes(e.level)?e.level:baseline):baseline;},
  record(row,auto,supported=[1,2,3,4,5]){const e=entry(row.unit,row.level),key=row.conceptId||row.id;
   if(row.review){const rev=e.reviews[row.reviewKey];if(rev){rev.lastAttempt=row.date;rev.nextDue=Date.now()+60000;rev.lastConcept=key;rev.lastAnswerIndex=row.options?.indexOf(row.answer);if(!row.hintUsed&&row.correct&&!rev.successConcepts.includes(key))rev.successConcepts.push(key);if(!row.correct)rev.successConcepts=[];rev.successCount=rev.successConcepts.length;rev.resolved=rev.successCount>=2;}return;}
   if(!row.correct){e.reviews[key]??={key,unit:row.unit,type:row.type,level:row.level,operands:row.operands,lastConcept:key,lastAnswerIndex:row.options?.indexOf(row.answer),successConcepts:[],successCount:0,resolved:false,nextDue:Date.now(),lastAttempt:row.date};}
   if(row.hintUsed||e.seen.includes(key))return;e.seen.push(key);e.window.push(!!row.correct);
   if(e.window.length===5){const n=e.window.filter(Boolean).length,idx=supported.indexOf(e.level);if(auto)e.level=supported[Math.max(0,Math.min(supported.length-1,idx+(n>=4?1:n<=2?-1:0)))];e.window=[];}
  },due(unit){return Object.values(entry(unit).reviews).filter(x=>!x.resolved&&x.nextDue<=Date.now()).sort((a,b)=>a.nextDue-b.nextDue)[0];}};
}
