import {generateProblem,equivalent,adaptiveLevel} from './math-engine.js';
import {CHARACTERS,WEAPONS,createCombatV2} from './combat-v2.js';
import {readRecords,saveRecord,summarize,downloadRecord} from './learning.js';
const $=id=>document.getElementById(id);
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function createV2(r,curriculum){
 const settings={reduced:matchMedia('(prefers-reduced-motion: reduce)').matches,low:false,font:1};
 let config={},answers=[],review=[],records=readRecords(),result=null,reviewTick=0,started=0,level=1;
 const combat=createCombatV2(r,settings),s=r.state;combat.reset();
 function syncUnits(){const grade=curriculum.grades.find(g=>g.grade===Number($('grade').value));
  const domain=$('domain').value;const options=grade.units.filter(u=>domain==='all'||u.domain===domain);$('unit').innerHTML='<option value="all">선택 영역 전체</option>'+options.map(u=>`<option value="${u.id}">${u.name}</option>`).join('');
  if(!options.length){$('domain').value='all';syncUnits();}
 }
 function configFromUI(){return {grade:Number($('grade').value),domain:$('domain').value,unit:$('unit').value,level:Number($('mathLevel').value),auto:$('autoLevel').checked,mode:$('mode').value,target:Number($('target').value)||10,limit:Number($('limit').value)||180,character:$('character').value,weapon:$('startingWeapon').value};}
 function saveSettings(){try{localStorage.setItem('math-survival-2.settings',JSON.stringify({...configFromUI(),...settings,combat:r.difficultyEl.value,map:r.mapSelect.value,muted:r.muted}));}catch{} }
 function restoreSettings(){try{const saved=JSON.parse(localStorage.getItem('math-survival-2.settings')||'null');if(!saved)return;const ids={grade:'grade',domain:'domain',level:'mathLevel',mode:'mode',target:'target',limit:'limit',character:'character',weapon:'startingWeapon',combat:'difficulty',map:'mapSelect'};
   for(const [key,id]of Object.entries(ids))if(saved[key]!=null&&$(id).tagName==='SELECT'&&[...$(id).options].some(o=>o.value===String(saved[key])))$(id).value=saved[key];
   for(const id of ['target','limit'])if(Number(saved[id])>0)$(id).value=saved[id];syncUnits();if([...$('unit').options].some(o=>o.value===saved.unit))$('unit').value=saved.unit;
   $('autoLevel').checked=!!saved.auto;settings.reduced=!!saved.reduced;settings.low=!!saved.low;settings.font=[1,1.15,1.3].includes(saved.font)?saved.font:1;$('reducedMotion').checked=settings.reduced;$('lowPower').checked=settings.low;$('fontSize').value=String(settings.font);r.muted=!!saved.muted;
  }catch{} }
 function applySettings(){document.documentElement.style.setProperty('--reading-scale',settings.font);document.body.classList.toggle('reduce-motion',settings.reduced);document.body.classList.toggle('low-power',settings.low);}
 function mount(){
  $('v2Setup').innerHTML=`<div class="setupHeading"><span class="eyebrow">MATH SURVIVAL / 새로운 모험</span><h2>오늘의 수학 모험을 골라요</h2><p>정답으로 성장하고, 나만의 무기로 숲을 지켜요.</p></div>
  <div class="characterGrid">${Object.entries(CHARACTERS).map(([id,c])=>`<label class="characterCard"><input type="radio" name="hero" value="${id}" ${id==='explorer'?'checked':''}><span class="heroIcon">${c.icon}</span><strong>${c.name}</strong><small>${c.description}</small></label>`).join('')}</div>
  <div class="setupGrid">
  <label>캐릭터<select id="character">${Object.entries(CHARACTERS).map(([id,c])=>`<option value="${id}">${c.name}</option>`).join('')}</select></label>
  <label>게임 모드<select id="mode"><option value="survival">서바이벌 · 3분 생존</option><option value="explore">수학 탐험 · 교사 설정</option><option value="boss">보스 챌린지 · 3연전</option></select></label>
  <label>학년<select id="grade">${curriculum.grades.map(g=>`<option value="${g.grade}" ${g.grade===3?'selected':''}>${g.grade}학년</option>`).join('')}</select></label>
  <label>학습 영역<select id="domain"><option value="all">전체 영역</option>${Object.entries(curriculum.domains).map(([id,name])=>`<option value="${id}">${name}</option>`).join('')}</select></label>
  <label>단원<select id="unit"></select></label>
  <label>수학 난이도<select id="mathLevel">${[1,2,3,4,5].map(l=>`<option value="${l}" ${l===2?'selected':''}>${l}단계</option>`).join('')}</select></label>
  <label>시작 무기<select id="startingWeapon">${Object.entries(WEAPONS).map(([id,w])=>`<option value="${id}">${w.icon} ${w.name}</option>`).join('')}</select></label>
  <label class="check"><input type="checkbox" id="autoLevel" checked>최근 정답률로 자동 난이도</label>
  </div><fieldset id="teacherSettings"><legend>수학 탐험 · 교사 설정</legend><label>목표 문항 수<input id="target" type="number" value="10" min="1" max="100"></label><label>제한 시간(초)<input id="limit" type="number" value="180" min="30" max="1800" step="30"></label><small>탐험 모드에서는 몬스터 없이 정답 구슬을 찾습니다. 정답·오답 모두 문항 수에 포함합니다.</small></fieldset>
  <details class="preferences"><summary>⚙️ 화면·접근성 설정</summary><div class="setupGrid"><label class="check"><input id="reducedMotion" type="checkbox">애니메이션 감소</label><label class="check"><input id="lowPower" type="checkbox">저사양 모드</label><label>문제 글자 크기<select id="fontSize"><option value="1">기본</option><option value="1.15">크게</option><option value="1.3">아주 크게</option></select></label></div></details><div id="historySummary" class="history"></div>`;
  syncUnits();restoreSettings();applySettings();r.setMuted(r.muted);
  for(const id of ['grade','domain'])$(id).addEventListener('change',syncUnits);
  const selectHero=value=>{ $('character').value=value;document.querySelector(`input[name="hero"][value="${value}"]`).checked=true;};selectHero($('character').value);
  document.querySelectorAll('input[name="hero"]').forEach(el=>el.addEventListener('change',()=>selectHero(el.value)));$('character').addEventListener('change',()=>selectHero($('character').value));
  const modeUI=()=>{$('teacherSettings').hidden=$('mode').value!=='explore';};$('mode').addEventListener('change',modeUI);modeUI();
  $('reducedMotion').addEventListener('change',e=>{settings.reduced=e.target.checked;applySettings();saveSettings();});$('lowPower').addEventListener('change',e=>{settings.low=e.target.checked;applySettings();saveSettings();});$('fontSize').addEventListener('change',e=>{settings.font=Number(e.target.value);applySettings();saveSettings();});
  $('pauseBtn').addEventListener('click',pause);$('playSound').addEventListener('click',()=>{r.initAudio();r.setMuted(!r.muted);saveSettings();});$('skillBtn').addEventListener('click',combat.skill);
  window.addEventListener('keydown',e=>{if(e.key.toLowerCase()==='e')combat.skill();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&s.running&&!s.paused)pause();});
  for(const type of ['JSON','CSV'])$('export'+type).addEventListener('click',()=>downloadRecord(result,type.toLowerCase()));
  $('answerAccess').addEventListener('click',e=>{const btn=e.target.closest('button[data-index]');if(!btn||!s.running||s.paused)return;const orb=r.answerOrbs[Number(btn.dataset.index)];if(orb){r.player.x=orb.x;r.player.y=orb.y;r.updateCamera();r.resolveAnswer(orb);}});
  history();
 }
 function history(){const last=records.at(-1);$('historySummary').textContent=last?`📚 저장된 모험 ${records.length}회 · 최근 정답률 ${last.accuracy}% · ${last.config.grade}학년 · 실명 없이 이 브라우저에 저장됩니다.`:'📚 학습 결과는 실명 없이 이 브라우저에 저장됩니다.';}
 function start(){
  config=configFromUI();config.target=Math.max(1,Math.min(100,config.target));config.limit=Math.max(30,Math.min(1800,config.limit));answers=[];reviewTick=0;result=null;started=r.gameNow();
  level=config.level;
  const prior=records.flatMap(x=>x.answers).filter(a=>a.grade===config.grade&&(config.domain==='all'||a.domain===config.domain)&&(config.unit==='all'||a.unit===config.unit));
  if(config.auto&&prior.length)level=adaptiveLevel(prior.at(-1).level||level,prior);
  review=[...new Map(prior.filter(a=>!a.correct&&a.problem).map(a=>[a.id,a.problem])).values()].slice(-12);
  s.kills=0;s.mode=config.mode;s.character=config.character;s.winTime=config.mode==='explore'?config.limit:config.mode==='boss'?300:180;combat.reset();s.newWeapons[config.weapon]=1;
  const c=CHARACTERS[config.character];s.hp=s.maxHp=c.hp;r.player.speed=c.speed;s.attackPower=c.attack;s.fireRate=c.rate;if(config.character==='guardian')s.shield=2;
  $('explanation').textContent='';$('answerAccess').replaceChildren();$('pauseBtn').textContent='⏸ 일시정지';$('pauseBtn').setAttribute('aria-pressed','false');
  saveSettings();r.setMuted(r.muted);if(config.mode==='boss'){s.currentMapKey=r.mapSelect.value;r.spawnBoss();}r.spawnQuiz();
 }
 function makeProblem(){
  reviewTick++;if(review.length&&reviewTick%3===0){const problem=review.shift();return {...problem,review:true};}
  return generateProblem({...config,level},curriculum);
 }
 function present(problem){$('explanation').textContent='';$('answerAccess').innerHTML=problem.options.map((value,i)=>`<button data-index="${i}" aria-label="${esc(value)} 구슬로 이동">${i+1}. ${esc(value)}</button>`).join('');}
 function record(orb){const problem=s.problem,now=r.gameNow();answers.push({...problem,problem:{...problem},selected:orb.value,correct:orb.correct,elapsed:Math.round((now-started)/1000)});
  if(!orb.correct)review.push({...problem});if(config.auto&&answers.length%5===0)level=adaptiveLevel(level,answers);
  $('answerAccess').replaceChildren();$('explanation').textContent=orb.correct?`✅ 정답! ${problem.explain}`:`💡 ${orb.value} → 정답 ${problem.answer}. ${problem.explain}`;
  s.lastQuiz=now-(config.mode==='survival'?15000:2200)+4500;
 }
 function orbPositions(){
  // Place four distinct targets relative to a clamped center; never clamp each orb onto another.
  const dx=Math.min(240,r.canvas.width*.22),dy=Math.min(145,r.canvas.height*.19),cx=r.clamp(r.player.x,dx+65,s.worldW-dx-65),cy=r.clamp(r.player.y,dy+65,s.worldH-dy-65);
  return [{x:cx-dx,y:cy-dy},{x:cx+dx,y:cy-dy},{x:cx-dx,y:cy+dy},{x:cx+dx,y:cy+dy}];
 }
 function tick(dt,now){combat.tick(now);
  if(config.mode==='explore'&&answers.length>=config.target){r.endGame(true);return;}
  if(config.mode==='boss'&&!r.enemies.some(e=>e.boss)){
   if(s.bossKills>=3){r.endGame(true);return;}
   const order=['forest','desert','library'],key=order[(order.indexOf(r.mapSelect.value)+s.bossKills)%3];s.currentMapKey=key;s.map=r.MAPS[key];s.worldW=s.map.worldW;s.worldH=s.map.worldH;r.makeDecorations();r.spawnBoss();
  }
  $('skillBtn').disabled=now<s.skillReady;$('skillBtn').textContent=now<s.skillReady?`스킬 ${Math.ceil((s.skillReady-now)/1000)}초`:'특수 스킬 E';
  $('playSound').textContent=r.muted?'🔇 소리':'🔊 소리';
  const boss=r.enemies.find(e=>e.boss);$('bossHUD')?.remove();if(boss){const el=document.createElement('div');el.id='bossHUD';el.textContent=`${boss.name} · ${Math.ceil(boss.hp)} / ${boss.maxHp}`;el.style.setProperty('--boss-health',(Math.max(0,boss.hp)/boss.maxHp*100)+'%');$('wrap').appendChild(el);}
  if(config.mode==='explore')r.missionInfo.textContent=`🧭 탐험 ${answers.length}/${config.target}문항 · 남은 ${Math.max(0,Math.ceil(s.winTime-s.time))}초`;
  r.updateWeaponInfo();r.weaponInfo.textContent += ' · '+Object.entries(s.newWeapons).filter(([,lvl])=>lvl).map(([key,lvl])=>`${s.evolved[key]?WEAPONS[key].evolution:WEAPONS[key].name} Lv.${lvl}`).join(' / ');
  // Original updateWeaponInfo is cheap; reset it before appending next frame.
 }
 function draw(now){combat.draw(now);}
 function pause(){if(!s.running||s.levelUpPending)return;s.paused=!s.paused;if(s.paused){r.stopJoystick();Object.keys(r.keys).forEach(k=>r.keys[k]=false);}$('pauseBtn').textContent=s.paused?'▶ 계속하기':'⏸ 일시정지';$('pauseBtn').setAttribute('aria-pressed',String(s.paused));}
 function finish(won,quit){$('answerAccess').replaceChildren();$('bossHUD')?.remove();result=summarize(s,answers,config);result.outcome=quit?'quit':s.hp<=0?'defeat':config.mode==='explore'&&answers.length<config.target?'time-limit':config.mode==='boss'&&s.bossKills<3?'time-limit':won?'complete':'defeat';
  const saved=saveRecord(result);records=readRecords();history();
  $('resultText').textContent=config.mode==='explore'?`수학 탐험 ${answers.length}/${config.target}문항 · ${result.outcome==='time-limit'?'제한 시간 종료':result.outcome==='complete'?'목표 달성':'탐험 종료'}`:config.mode==='boss'?`보스 챌린지 ${s.bossKills}/3 처치`:`${s.map.name} · ${result.survivalSeconds}초 생존`;
  $('learningReport').innerHTML=`<h2>📘 이번 모험의 학습 기록</h2><div class="resultStats"><div>생존 시간<strong>${result.survivalSeconds}초</strong></div><div>몬스터 처치<strong>${result.kills}</strong></div><div>오답<strong>${result.wrong}개</strong></div><div>정답률<strong>${result.accuracy}%</strong></div></div><h3>영역별 정답률</h3>${Object.entries(result.domains).map(([id,d])=>`<div class="domainResult"><span>${esc(curriculum.domains[id])}</span><progress value="${d.correct}" max="${d.total}"></progress><b>${d.accuracy}% (${d.correct}/${d.total})</b></div>`).join('')||'<p>아직 응답한 문항이 없습니다.</p>'}<h3>취약 문제 · 다음 모험에서 복습해요</h3>${result.reviewProblems.map(w=>`<div class="reviewRow"><strong>${esc(w.text)}</strong><p>선택 ${esc(w.selected)} → 정답 ${esc(w.answer)}</p><small>${esc(w.explain)}</small></div>`).join('')||'<p>틀린 문제가 없습니다. 다음 난이도에 도전해요!</p>'}<p class="small">${saved?'이 브라우저에 기록을 저장했습니다.':'브라우저 저장이 제한되었습니다. JSON/CSV로 기록을 내려받으세요.'}</p>`;
 }
 function afterAnswer(){if(config.mode==='explore'&&answers.length>=config.target)r.endGame(true);}
 return {settings,mount,start,makeProblem,present,record,orbPositions,tick,draw,pause,finish,afterAnswer,upgrades:combat.upgrades,isCorrect:equivalent,combat,get quizInterval(){return config.mode==='survival'?15000:2200;},get config(){return config;},get answers(){return answers;},get result(){return result;}};
}
