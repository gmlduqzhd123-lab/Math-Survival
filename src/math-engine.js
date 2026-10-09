import {GENERATOR_VERSION} from './version.js';
export function gcd(a,b){a=a<0n?-a:a;while(b){[a,b]=[b,a%b];}return a||1n;}
export function rational(value){
 const text=String(value).trim().replace(/\s/g,'');
 const match=text.match(/^(-?\d+(?:\.\d+)?)(?:\/(-?\d+))?(cm²|m²|cm³|m³|cm|mm|km|m|kg|g|L|mL|분|초|도|%)?$/);
 if(!match)throw new Error('지원하지 않는 수학 값: '+value);
 const places=(match[1].split('.')[1]||'').length;
 let n=BigInt(match[1].replace('.','')),d=10n**BigInt(places)*BigInt(match[2]||1);
 if(!d)throw new Error('분모는 0이 될 수 없습니다.');if(d<0n){n=-n;d=-d;}const common=gcd(n,d);n/=common;d/=common;
 const unit=match[3]||'';
 const scales={mm:[1n,1000n,'length'],cm:[1n,100n,'length'],m:[1n,1n,'length'],km:[1000n,1n,'length'],g:[1n,1000n,'mass'],kg:[1n,1n,'mass'],mL:[1n,1000n,'capacity'],L:[1n,1n,'capacity'],초:[1n,60n,'time'],분:[1n,1n,'time'],'cm²':[1n,10000n,'area'],'m²':[1n,1n,'area'],'cm³':[1n,1000000n,'volume'],'m³':[1n,1n,'volume']};
 if(scales[unit]){const [sn,sd,u]=scales[unit];n*=sn;d*=sd;const g=gcd(n,d);return `${n/g}/${d/g}|${u}`;}return `${n}/${d}|${unit}`;
}
export const equivalent=(a,b)=>rational(a)===rational(b);
const int=(rng,a,b)=>Math.floor(rng()*(b-a+1))+a;
const frac=(n,d)=>{const g=Number(gcd(BigInt(n),BigInt(d)));return d/g===1?String(n/g):`${n/g}/${d/g}`;};
const decimal=(n,p=1)=>String(n/10**p);
export function seeded(seed){let n=Number(seed)>>>0;return ()=>{n=(Math.imul(n,1664525)+1013904223)>>>0;return n/4294967296;};}
export function generateProblem(config,curriculum,rng){
 const seed=config.seed??Math.floor(Math.random()*4294967296);rng=rng||seeded(seed);
 const grade=curriculum.grades.find(g=>g.grade===Number(config.grade));if(!grade)throw new Error('학년 오류');
 let units=grade.units.filter(u=>(config.domain==='all'||!config.domain||u.domain===config.domain)&&(config.unit==='all'||!config.unit||u.id===config.unit));
 if(!units.length)throw new Error('선택한 학년과 영역에 해당하는 단원이 없습니다.');
 const u=units[int(rng,0,units.length-1)];let level=Number(config.level)||1;
 if(!u.supportedLevels.includes(level))level=u.supportedLevels[0];
 const policy=u.policy.levels[level];
 const a=int(rng,...policy.rangeA),b=int(rng,...policy.rangeB);let text,answer,explain,operands,step=1,unit='';
 const type=u.type;
 switch(type){
 case 'add':{const x=a,y=b;operands=[x,y];answer=String(x+y);text=`${x} + ${y} = ?`;explain=`${x}에 ${y}를 더하면 ${answer}입니다. 자리별로 더합니다.`;break;}
 case 'subtract':{const max=policy.rangeA[1];const x=int(rng,policy.rangeA[0],max),y=int(rng,policy.rangeB[0],Math.min(x,policy.rangeB[1]));operands=[x,y];answer=String(x-y);text=`${x} − ${y} = ?`;explain=`${x}에서 ${y}만큼 빼면 ${answer}입니다.`;break;}
 case 'multiply':{const x=a,y=b;operands=[x,y];answer=String(x*y);text=`${x} × ${y} = ?`;explain=`${x}을 ${y}번 더하면 ${answer}입니다.`;break;}
 case 'divide':operands=[a*b,b];answer=String(a);text=`${a*b} ÷ ${b} = ?`;explain=`${b} × ${a} = ${a*b}이므로 몫은 ${a}입니다.`;break;
 case 'fraction':{const d=int(rng,3,5+level*3),x=int(rng,1,d-1),y=int(rng,1,d-1);operands=[x,y,d];answer=frac(x+y,d);step=1/d;text=`${x}/${d} + ${y}/${d} = ?`;explain=`분모 ${d}는 그대로 두고 분자를 더합니다. ${x+y}/${d} = ${answer}.`;break;}
 case 'unlikeFraction':{const d=int(rng,2,level+3),e=d+1,x=int(rng,1,d-1),y=int(rng,1,e-1);operands=[x,d,y,e];answer=frac(x*e+y*d,d*e);step=1/(d*e);text=`${x}/${d} + ${y}/${e} = ?`;explain=`분모를 ${d*e}로 통분하면 ${x*e}/${d*e} + ${y*d}/${d*e} = ${answer}입니다.`;break;}
 case 'fractionMultiply':operands=[a,b,a+1,b+1];answer=frac(a*b,(a+1)*(b+1));step=1/((a+1)*(b+1));text=`${a}/${a+1} × ${b}/${b+1} = ?`;explain=`분자는 분자끼리, 분모는 분모끼리 곱한 뒤 약분하면 ${answer}입니다.`;break;
 case 'fractionDivide':operands=[a,a+1,b,b+1];answer=frac(a*(b+1),(a+1)*b);step=1/((a+1)*b);text=`${a}/${a+1} ÷ ${b}/${b+1} = ?`;explain=`나누는 분수를 뒤집어 곱하면 ${answer}입니다.`;break;
 case 'decimal':case 'decimalSubtract':{const places=policy.decimalPlaces,x=type==='decimalSubtract'?Math.max(a,b):a,y=type==='decimalSubtract'?Math.min(a,b):b;operands=[x,y,places];answer=decimal(type==='decimal'?x+y:x-y,places);step=10**-places;text=`${decimal(x,places)} ${type==='decimal'?'+':'−'} ${decimal(y,places)} = ?`;explain=`소수점을 맞추어 같은 자릿값끼리 계산하면 ${answer}입니다.`;break;}
 case 'decimalMultiply':operands=[a,b];answer=decimal(a*b,2);step=.01;text=`${decimal(a)} × ${decimal(b)} = ?`;explain=`${a} × ${b} = ${a*b}. 소수 자릿수가 모두 2자리이므로 ${answer}입니다.`;break;
 case 'decimalDivide':operands=[a*b,b*10];answer=decimal(a);step=.1;text=`${decimal(a*b,2)} ÷ ${decimal(b)} = ?`;explain=`두 수를 모두 100배 하면 ${a*b} ÷ ${b*10} = ${answer}입니다.`;break;
 case 'length':operands=[a];answer=`${a*100}cm`;unit='cm';text=`${a} m = ? cm`;explain=`1 m = 100 cm이므로 ${a} × 100 = ${a*100} cm입니다.`;break;
 case 'time':operands=[a];answer=`${a*60}초`;unit='초';text=`${a}분은 몇 초인가요?`;explain=`1분 = 60초이므로 ${a} × 60 = ${a*60}초입니다.`;break;
 case 'area':operands=[a,b];answer=`${a*b}cm²`;unit='cm²';text=`가로 ${a} cm, 세로 ${b} cm인 직사각형의 넓이는?`;explain=`가로 × 세로 = ${a} × ${b} = ${answer}입니다.`;break;
 case 'volume':operands=[a,b,level+1];answer=`${a*b*(level+1)}cm³`;unit='cm³';text=`가로 ${a}, 세로 ${b}, 높이 ${level+1} cm인 직육면체의 부피는?`;explain=`가로 × 세로 × 높이 = ${answer}입니다.`;break;
 case 'angle':{const x=int(rng,2,3+level)*10,y=int(rng,2,3+level)*10;operands=[x,y];answer=`${180-x-y}도`;unit='도';text=`삼각형의 두 각이 ${x}도, ${y}도일 때 나머지 각은?`;explain=`삼각형의 세 각의 합은 180도. 180 − ${x} − ${y} = ${answer}.`;break;}
 case 'shapes':{const shapes=[['삼각형',3],['사각형',4],['오각형',5],['육각형',6]];const [name,n]=shapes[int(rng,0,grade.grade===1?1:3)],orientation=int(rng,0,2);operands=[n,orientation];answer=String(n);text=`${['바로 놓인','돌려 놓인','뒤집어 놓인'][orientation]} ${name}의 변은 몇 개인가요?`;explain=`${name}에는 변이 ${n}개 있습니다. 방향을 바꾸어도 변의 개수는 같습니다.`;break;}
 case 'patterns':operands=[a,b];answer=String(a+3*b);text=`${a}, ${a+b}, ${a+2*b}, □. 빈칸은?`;explain=`${b}씩 커지는 규칙이므로 다음 수는 ${answer}입니다.`;break;
 case 'average':operands=[a,a+b,a+2*b];answer=String(a+b);text=`${a}, ${a+b}, ${a+2*b}의 평균은?`;explain=`세 수의 합 ${3*(a+b)}을 자료 수 3으로 나누면 ${answer}입니다.`;break;
 case 'percent':{const p=int(rng,1,9)*10,total=int(rng,1,level+2)*100;operands=[p,total];answer=String(p*total/100);text=`${total}의 ${p}%는?`;explain=`${total} × ${p}/100 = ${answer}입니다.`;break;}
 case 'ratio':{const factor=level+1;operands=[a,b,factor];answer=String(b*factor);text=`${a} : ${b} = ${a*factor} : □. 빈칸은?`;explain=`앞의 수가 ${factor}배가 되었으므로 뒤의 수도 ${b} × ${factor} = ${answer}입니다.`;break;}

 case 'decimalPlace':{const n=int(rng,1,9);operands=[n];answer=String(n);text=`${decimal(n)}은 0.1이 몇 개인 수인가요?`;explain=`0.1이 ${n}개이면 ${decimal(n)}입니다. 소수 첫째 자리는 0.1의 개수를 나타냅니다.`;break;}
 case 'fractionSubtract':{const d=int(rng,3,policy.denominatorMax),x=int(rng,1,d-1),y=int(rng,1,x);operands=[x,y,d];answer=frac(x-y,d);step=1/d;text=`${x}/${d} − ${y}/${d} = ?`;explain=`분모 ${d}는 그대로 두고 분자를 빼면 ${answer}입니다.`;break;}
 case 'unlikeSubtract':{const d=int(rng,2,level+3),e=d+1,x=int(rng,1,d-1),y=int(rng,1,e-1),swap=x*e<y*d;operands=swap?[y,e,x,d]:[x,d,y,e];const [n,m,k,j]=operands;answer=frac(n*j-k*m,m*j);step=1/(m*j);text=`${n}/${m} − ${k}/${j} = ?`;explain=`분모를 ${m*j}로 통분하고 분자를 빼면 ${answer}입니다.`;break;}
 case 'tableCount':case 'pictureGraph':case 'barGraph':case 'lineGraph':{operands=[a,b];answer=String(a+b);text=['tableCount','pictureGraph'].includes(type)?`분류한 자료: 사과 ${a}개, 배 ${b}개. 모두 몇 개인가요?`:type==='barGraph'?`막대그래프의 값: 월요일 ${a}명, 화요일 ${b}명. 두 날의 합계는?`:`꺾은선그래프의 값: 오전 ${a}명, 오후 ${a+b}명. 오후의 값은?`;explain=type==='lineGraph'?`오후의 자료 값을 읽으면 ${a+b}명입니다.`:`두 자료의 수를 더하면 ${a} + ${b} = ${a+b}입니다.`;break;}
 case 'percentGraph':{const percent=int(rng,1,9)*10;operands=[percent];answer=String(100-percent);text=`${config.grade===5?'띠':'원'}그래프: 축구 ${percent}%, 농구 □%. 두 항목만 있을 때 농구는 몇 %인가요?`;explain=`전체는 100%입니다. 100 − ${percent} = ${answer}이므로 ${answer}%입니다.`;break;}
 case 'correspondence':operands=[a,b];answer=String(a*b);text=`△ = □ × ${b}인 대응 관계에서 □가 ${a}이면 △는?`;explain=`관계식에 □ = ${a}를 넣으면 ${a} × ${b} = ${answer}입니다.`;break;
 case 'commonDivisor':case 'commonMultiple':{operands=[a,b];const common=Number(gcd(BigInt(a),BigInt(b)));answer=String(type==='commonDivisor'?common:a*b/common);text=`${a}와 ${b}의 ${type==='commonDivisor'?'최대공약수':'최소공배수'}는?`;const divisors=n=>Array.from({length:n},(_,i)=>i+1).filter(i=>n%i===0).join(', ');explain=type==='commonDivisor'?`${a}의 약수: ${divisors(a)}. ${b}의 약수: ${divisors(b)}. 공통인 약수 중 가장 큰 수는 ${answer}입니다.`:`${a}의 배수와 ${b}의 배수 중 공통인 가장 작은 수는 ${answer}입니다. (${a} × ${b} ÷ 최대공약수 ${common})`;break;}
 case 'probability':{const total=2,red=int(rng,0,2);operands=[red,total];answer=frac(red,total);step=1/total;text=`똑같은 구슬 ${total}개 중 빨간 구슬은 ${red}개입니다. 무작위로 1개 뽑을 때 빨간 구슬이 나올 가능성을 수로 나타내면?`;explain=`각 구슬을 뽑을 가능성이 같으므로 빨간 구슬 수 ÷ 전체 구슬 수 = ${answer}입니다.`;break;}
 default:throw new Error('알 수 없는 문항 유형: '+type);
 }
 const opts=[answer],canonical=new Set([rational(answer)]),misconceptions={[rational(answer)]:'correct'};
 const [x,y,z,w]=operands;
 const candidates=[];const add=(value,id)=>{try{if(parseFloat(value)<0)return;const key=rational(value);if(!canonical.has(key)&&opts.length<4){canonical.add(key);opts.push(String(value));misconceptions[key]=id;}}catch{}};
 if(type==='add')candidates.push([Math.abs(x-y),'subtract-instead'],[x+y-10,'miss-carry']);
 if(type==='subtract')candidates.push([x+y,'add-instead'],[Math.abs(x-y)+10,'borrow-error']);
 if(type==='multiply')candidates.push([x+y,'add-instead'],[x*(y-1),'one-group-missing']);
 if(type==='divide')candidates.push([x-y,'subtract-instead'],[x*y,'multiply-instead']);
 if(type==='fraction')candidates.push([frac(x+y,2*z),'add-denominators'],[frac(x*y,z),'multiply-numerators']);
 if(type==='unlikeFraction')candidates.push([frac(x+z,y+w),'add-denominators'],[frac(x+z,y*w),'miss-common-numerators']);
 if(type==='fractionMultiply')candidates.push([frac(x+y,z+w),'add-instead'],[frac(x*y,z),'miss-denominator-product']);
 if(type==='fractionDivide')candidates.push([frac(x*z,y*w),'no-reciprocal'],[frac(x*w,z),'miss-denominator']);
 if(type==='decimal')candidates.push([x+y,'decimal-place'],[Math.abs(x-y)/10**z,'subtract-instead']);
 if(type==='decimalMultiply')candidates.push([x*y/10,'decimal-place'],[(x+y)/10,'add-instead']);
 if(type==='decimalDivide')candidates.push([x/y/10,'one-sided-scale'],[x*y/100,'multiply-instead']);
 if(type==='length')candidates.push([x+'cm','no-conversion'],[x*10+'cm','ten-instead-hundred']);
 if(type==='time')candidates.push([x+'초','no-conversion'],[x*100+'초','hundred-instead-sixty']);
 if(type==='area')candidates.push([2*(x+y)+'cm²','perimeter-instead'],[(x+y)+'cm²','add-instead']);
 if(type==='volume')candidates.push([x*y+'cm³','miss-height'],[(x+y+z)+'cm³','add-instead']);
 if(type==='angle')candidates.push([(x+y)+'도','sum-known-angles'],[(360-x-y)+'도','full-turn-instead']);
 if(type==='patterns')candidates.push([x+2*y,'repeat-last'],[x+4*y,'skip-one']);
 if(type==='average')candidates.push([x+y+z,'no-division'],[(x+y+z)/2,'wrong-count']);
 if(type==='percent')candidates.push([x*y,'no-hundred-division'],[y-x,'subtract-instead']);
 if(type==='ratio')candidates.push([y+z,'add-factor'],[y,'no-scale']);
 if(type==='shapes')candidates.push([x-1,'miss-one-edge'],[x+1,'extra-edge']);
 for(const [v,id]of candidates)add(String(v),id);let k=1;
 while(opts.length<4){
  let value;
  const offset=(k%2?1:-1)*Math.ceil(k/2);
  if(answer.includes('/')){const [n,d]=answer.split('/').map(Number);if(n+offset<0){k++;continue;}value=frac(n+offset,d);}
  else {const raw=parseFloat(answer),next=Math.round((raw+step*offset)*10000)/10000;if(next<0){k++;continue;}value=String(next)+unit;}
  const key=rational(value);if(!canonical.has(key)){canonical.add(key);opts.push(value);misconceptions[key]='near-value';}k++;
 }
 for(let i=3;i>0;i--){const j=int(rng,0,i);[opts[i],opts[j]]=[opts[j],opts[i]];}
 const conceptId=`${u.id}:${type}:${operands.join(':')}`;
 return {id:conceptId,conceptId,instanceId:globalThis.crypto?.randomUUID?.()||`${conceptId}:${Date.now()}:${seed}`,seed,curriculumVersion:curriculum.curriculumVersion,generatorVersion:GENERATOR_VERSION,difficulty:level,explanationSteps:explain.split(/(?<=。|\.)\s+/),optionMisconceptions:opts.map(v=>misconceptions[rational(v)]),policyVersion:policy?u.policy.version:2,typeId:`${u.id}:${type}`,grade:grade.grade,domain:u.domain,unit:u.id,unitName:u.name,achievementStandards:u.achievementStandards,gradeBand:u.gradeBand,level,type,operands,text,answer,explain,options:opts};
}
export function adaptiveLevel(level,rows){const recent=rows.slice(-5);if(recent.length<5)return level;const correct=recent.filter(r=>r.correct).length;return Math.max(1,Math.min(5,level+(correct>=4?1:correct<=2?-1:0)));}
