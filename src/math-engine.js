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
export function generateProblem(config,curriculum,rng=Math.random){
 const grade=curriculum.grades.find(g=>g.grade===Number(config.grade));if(!grade)throw new Error('학년 오류');
 let units=grade.units.filter(u=>(config.domain==='all'||!config.domain||u.domain===config.domain)&&(config.unit==='all'||!config.unit||u.id===config.unit));
 if(!units.length)throw new Error('선택한 학년과 영역에 해당하는 단원이 없습니다.');
 const u=units[int(rng,0,units.length-1)],level=Math.max(1,Math.min(5,Number(config.level)||1));
 const a=int(rng,2,4+level*3),b=int(rng,2,3+level*2);let text,answer,explain,operands,step=1,unit='';
 const type=u.type;
 switch(type){
 case 'add':{const max=grade.grade===1?Math.min(9,3+level):grade.grade===2?20*level:100*level;const x=int(rng,1,max),y=int(rng,1,max);operands=[x,y];answer=String(x+y);text=`${x} + ${y} = ?`;explain=`${x}에 ${y}를 더하면 ${answer}입니다. 자리별로 더합니다.`;break;}
 case 'subtract':{const max=grade.grade===1?Math.min(10,5+level):grade.grade===2?20*level:100*level;const x=int(rng,2,max),y=int(rng,1,x);operands=[x,y];answer=String(x-y);text=`${x} − ${y} = ?`;explain=`${x}에서 ${y}만큼 빼면 ${answer}입니다.`;break;}
 case 'multiply':{const x=grade.grade===2?int(rng,2,9):a,y=grade.grade===2?int(rng,2,9):b;operands=[x,y];answer=String(x*y);text=`${x} × ${y} = ?`;explain=`${x}을 ${y}번 더하면 ${answer}입니다.`;break;}
 case 'divide':operands=[a*b,b];answer=String(a);text=`${a*b} ÷ ${b} = ?`;explain=`${b} × ${a} = ${a*b}이므로 몫은 ${a}입니다.`;break;
 case 'fraction':{const d=int(rng,3,5+level*3),x=int(rng,1,d-1),y=int(rng,1,d-1);operands=[x,y,d];answer=frac(x+y,d);step=1/d;text=`${x}/${d} + ${y}/${d} = ?`;explain=`분모 ${d}는 그대로 두고 분자를 더합니다. ${x+y}/${d} = ${answer}.`;break;}
 case 'unlikeFraction':{const d=int(rng,2,level+3),e=d+1,x=int(rng,1,d-1),y=int(rng,1,e-1);operands=[x,d,y,e];answer=frac(x*e+y*d,d*e);step=1/(d*e);text=`${x}/${d} + ${y}/${e} = ?`;explain=`분모를 ${d*e}로 통분하면 ${x*e}/${d*e} + ${y*d}/${d*e} = ${answer}입니다.`;break;}
 case 'fractionMultiply':operands=[a,b,a+1,b+1];answer=frac(a*b,(a+1)*(b+1));step=1/((a+1)*(b+1));text=`${a}/${a+1} × ${b}/${b+1} = ?`;explain=`분자는 분자끼리, 분모는 분모끼리 곱한 뒤 약분하면 ${answer}입니다.`;break;
 case 'fractionDivide':operands=[a,a+1,b,b+1];answer=frac(a*(b+1),(a+1)*b);step=1/((a+1)*b);text=`${a}/${a+1} ÷ ${b}/${b+1} = ?`;explain=`나누는 분수를 뒤집어 곱하면 ${answer}입니다.`;break;
 case 'decimal':operands=[a,b];answer=decimal(a+b);step=.1;text=`${decimal(a)} + ${decimal(b)} = ?`;explain=`소수점을 맞추어 더하면 ${answer}입니다. (${a}+${b}) ÷ 10`;break;
 case 'decimalMultiply':operands=[a,b];answer=decimal(a*b,2);step=.01;text=`${decimal(a)} × ${decimal(b)} = ?`;explain=`${a} × ${b} = ${a*b}. 소수 자릿수가 모두 2자리이므로 ${answer}입니다.`;break;
 case 'decimalDivide':operands=[a*b,b];answer=String(a);step=.1;text=`${decimal(a*b)} ÷ ${decimal(b)} = ?`;explain=`두 수를 모두 10배 하면 ${a*b} ÷ ${b} = ${answer}입니다.`;break;
 case 'length':operands=[a];answer=`${a*100}cm`;unit='cm';text=`${a} m = ? cm`;explain=`1 m = 100 cm이므로 ${a} × 100 = ${a*100} cm입니다.`;break;
 case 'time':operands=[a];answer=`${a*60}초`;unit='초';text=`${a}분은 몇 초인가요?`;explain=`1분 = 60초이므로 ${a} × 60 = ${a*60}초입니다.`;break;
 case 'area':operands=[a,b];answer=`${a*b}cm²`;unit='cm²';text=`가로 ${a} cm, 세로 ${b} cm인 직사각형의 넓이는?`;explain=`가로 × 세로 = ${a} × ${b} = ${answer}입니다.`;break;
 case 'volume':operands=[a,b,level+1];answer=`${a*b*(level+1)}cm³`;unit='cm³';text=`가로 ${a}, 세로 ${b}, 높이 ${level+1} cm인 직육면체의 부피는?`;explain=`가로 × 세로 × 높이 = ${answer}입니다.`;break;
 case 'angle':{const x=int(rng,3,8)*10,y=int(rng,3,8)*10;operands=[x,y];answer=`${180-x-y}도`;unit='도';text=`삼각형의 두 각이 ${x}도, ${y}도일 때 나머지 각은?`;explain=`삼각형의 세 각의 합은 180도. 180 − ${x} − ${y} = ${answer}.`;break;}
 case 'shapes':{const shapes=[['삼각형',3],['사각형',4],['오각형',5],['육각형',6]];const [name,n]=shapes[int(rng,0,grade.grade===1?1:3)];operands=[n];answer=String(n);text=`${name}의 변은 몇 개인가요?`;explain=`${name}에는 변이 ${n}개 있습니다.`;break;}
 case 'patterns':operands=[a,b];answer=String(a+3*b);text=`${a}, ${a+b}, ${a+2*b}, □. 빈칸은?`;explain=`${b}씩 커지는 규칙이므로 다음 수는 ${answer}입니다.`;break;
 case 'average':operands=[a,a+b,a+2*b];answer=String(a+b);text=`${a}, ${a+b}, ${a+2*b}의 평균은?`;explain=`세 수의 합 ${3*(a+b)}을 자료 수 3으로 나누면 ${answer}입니다.`;break;
 case 'percent':{const p=int(rng,1,9)*10,total=int(rng,1,level+2)*100;operands=[p,total];answer=String(p*total/100);text=`${total}의 ${p}%는?`;explain=`${total} × ${p}/100 = ${answer}입니다.`;break;}
 case 'ratio':operands=[a,b,2];answer=String(b*2);text=`${a} : ${b} = ${a*2} : □. 빈칸은?`;explain=`앞의 수가 2배가 되었으므로 뒤의 수도 ${b} × 2 = ${answer}입니다.`;break;
 default:throw new Error('알 수 없는 문항 유형: '+type);
 }
 const opts=[answer],canonical=new Set([rational(answer)]);let k=1;
 while(opts.length<4){
  let value;
  const offset=(k%2?1:-1)*Math.ceil(k/2);
  if(answer.includes('/')){const [n,d]=answer.split('/').map(Number);if(n+offset<0){k++;continue;}value=frac(n+offset,d);}
  else {const raw=parseFloat(answer),next=Math.round((raw+step*offset)*10000)/10000;if(next<0){k++;continue;}value=String(next)+unit;}
  const key=rational(value);if(!canonical.has(key)){canonical.add(key);opts.push(value);}k++;
 }
 for(let i=3;i>0;i--){const j=int(rng,0,i);[opts[i],opts[j]]=[opts[j],opts[i]];}
 return {id:`${u.id}:${type}:${operands.join(':')}`,grade:grade.grade,domain:u.domain,unit:u.id,unitName:u.name,level,type,operands,text,answer,explain,options:opts};
}
export function adaptiveLevel(level,rows){const recent=rows.slice(-5);if(recent.length<5)return level;const correct=recent.filter(r=>r.correct).length;return Math.max(1,Math.min(5,level+(correct>=4?1:correct<=2?-1:0)));}
