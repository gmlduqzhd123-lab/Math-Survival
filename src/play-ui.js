const $=id=>document.getElementById(id);
// UI preferences never replace learning or progression records.
export function createPlayUI(r){
 let dialog,prefs={autoSkill:true,answers:'orbs',map:false};
 try{const saved=JSON.parse(localStorage.getItem('math-survival.ui.v1')||'null');if(saved){prefs.autoSkill=saved.autoSkill!==false;prefs.answers=saved.answers==='buttons'?'buttons':'orbs';prefs.map=saved.map===true;}}catch{}
 function save(){try{localStorage.setItem('math-survival.ui.v1',JSON.stringify(prefs));}catch{}}
 function close(){if(dialog?.open)dialog.close();$('pauseBtn')?.setAttribute('aria-expanded','false');}
 function pauseChanged(){if(r.state.paused&&!dialog.open){dialog.showModal();$('resumePlay').focus();}else if(!r.state.paused&&dialog.open){close();$('pauseBtn').focus();}$('pauseBtn').setAttribute('aria-expanded',String(dialog.open));}
 function sync(){const s=r.state,cfg=r.v2.config;
  $('healthMeter').max=s.maxHp||120;$('healthMeter').value=Math.max(0,s.hp||0);$('experienceMeter').value=Number($('exp').textContent)||0;$('compactEnergy').textContent='🔋 '+Math.floor(s.mathEnergy||0);
  const answering=s.quizActive&&!s.mathPopup;$('questionBox').hidden=!answering;$('answerBar').hidden=!(answering&&(cfg.mode==='explore'||prefs.answers==='buttons'));
  $('learningArea').hidden=!(answering||(!s.mathPopup&&($('explanation').textContent||s.explanationPending)));
  document.body.classList.toggle('learning-visible',!$('learningArea').hidden);
  $('answerAssist').checked=prefs.answers==='buttons';for(const b of $('answerAccess').querySelectorAll('button'))b.disabled=cfg.mode!=='explore'&&!$('answerAssist').checked;
  $('skillBtn').hidden=prefs.autoSkill&&!s.rankMode;
  if(prefs.autoSkill&&!s.rankMode&&s.running&&!s.paused&&r.enemies.some(e=>r.distance(e,r.player)<420))r.v2.combat.skill();
 }
 function mount(){document.body.classList.add('simple-play');dialog=document.createElement('dialog');dialog.id='playMenu';dialog.setAttribute('aria-labelledby','playMenuTitle');
  dialog.innerHTML='<h2 id="playMenuTitle">잠깐 쉬어가요</h2><p>전투와 게임 시간이 멈췄어요.</p><button id="resumePlay">▶ 계속하기</button><div id="menuActions"></div><details id="playPreferences"><summary>조작·화면 설정</summary><label class="check"><input id="autoSkillToggle" type="checkbox">특수 스킬 자동 사용</label><label>전투 답안 방식<select id="combatAnswerMode"><option value="orbs">정답 구슬 찾아가기</option><option value="buttons">답안 버튼으로 구슬 선택</option></select></label><label class="check"><input id="menuReduced" type="checkbox">애니메이션 감소</label><label class="check"><input id="menuLow" type="checkbox">저사양 모드</label><label>글자 크기<select id="menuFont"><option value="1">기본</option><option value="1.15">크게</option><option value="1.3">아주 크게</option></select></label></details><details><summary>게임 설명</summary><p>방향키·WASD 또는 왼쪽 조이스틱으로 이동해요. 공격은 자동으로 나갑니다. 정답 구슬을 찾으면 수학 에너지가 올라가요.</p><p>대시: Space 또는 오른쪽 버튼 · 직접 스킬: E · 메뉴: P. 문제 팝업과 수학 탐험에서는 답안 버튼을 사용해요.</p><p>전투 답안 방식과 자동 스킬은 조작·화면 설정에서 바꿀 수 있어요.</p></details>';
  document.body.append(dialog);for(const id of ['playSound','mainMenuBtn','quitGameBtn'])$('menuActions').append($(id));
  const stats=document.createElement('div');stats.id='detailedStats';for(const id of ['score','weaponLevel','combo','shield','time'])stats.append($(id).parentElement);
  $('gameDetails').append(stats,$('v3HUD'));dialog.append($('gameDetails'));$('gameDetails').querySelector('summary').textContent='미션·장비·상세 기록';
  $('assistLabel').hidden=true;$('playPreferences').append($('assistLabel'));
  const hp=$('hp').parentElement,level=$('level').parentElement;hp.id='healthStatus';hp.insertAdjacentHTML('beforeend','<progress id="healthMeter" aria-label="체력" value="120" max="120"></progress>');level.id='levelStatus';level.append($('exp').parentElement);level.insertAdjacentHTML('beforeend','<progress id="experienceMeter" aria-label="경험치" value="0" max="100"></progress><span id="compactEnergy" title="수학 에너지">🔋 0</span>');
  $('gameHeader').append($('pauseBtn'));$('playControls').remove();$('pauseBtn').textContent='☰';$('pauseBtn').setAttribute('aria-label','게임 메뉴 및 일시정지');$('pauseBtn').setAttribute('aria-controls','playMenu');$('pauseBtn').setAttribute('aria-expanded','false');
  $('resumePlay').onclick=()=>r.v2.pause();dialog.addEventListener('cancel',e=>{e.preventDefault();r.v2.pause();});dialog.addEventListener('keydown',e=>{if(e.key==='Escape')e.stopPropagation();});
  $('autoSkillToggle').checked=prefs.autoSkill;$('combatAnswerMode').value=prefs.answers;
  $('autoSkillToggle').onchange=e=>{prefs.autoSkill=e.target.checked;save();sync();};$('combatAnswerMode').onchange=e=>{prefs.answers=e.target.value;save();sync();};
  for(const [menu,original]of [['menuReduced','reducedMotion'],['menuLow','lowPower'],['menuFont','fontSize']]){const copy=$(menu),source=$(original);const update=()=>{if(copy.type==='checkbox')copy.checked=source.checked;else copy.value=source.value;};update();copy.onchange=()=>{if(copy.type==='checkbox')source.checked=copy.checked;else source.value=copy.value;source.dispatchEvent(new Event('change'));};source.addEventListener('change',update);}
  const map=document.createElement('button');map.id='mapToggle';map.textContent='🗺';map.setAttribute('aria-label','미니맵 표시');map.setAttribute('aria-pressed',String(prefs.map));$('playfield').append(map);map.onclick=()=>{prefs.map=!prefs.map;map.setAttribute('aria-pressed',String(prefs.map));save();};
 }
 return {mount,sync,pauseChanged,close,get isOpen(){return dialog.open;},get mapVisible(){return prefs.map;}};
}
