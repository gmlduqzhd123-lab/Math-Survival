const $=id=>document.getElementById(id);
// UI preferences never replace learning or progression records.
export function createPlayUI(r){
 let dialog,focusedAnswer=null,prefs={autoSkill:true,answers:'orbs',map:true,mapChosen:false,fullscreen:!navigator.webdriver};
 // Automated browsers start windowed so regression suites can still resize the viewport mid-game.
 try{const saved=JSON.parse(localStorage.getItem('math-survival.ui.v1')||'null');if(saved){prefs.autoSkill=saved.autoSkill!==false;prefs.answers=saved.answers==='buttons'?'buttons':'orbs';// The minimap starts shown; only a choice made with the 🗺 button since then turns it off.
 prefs.mapChosen=saved.mapChosen===true;prefs.map=prefs.mapChosen?saved.map===true:true;if(typeof saved.fullscreen==='boolean')prefs.fullscreen=saved.fullscreen;}}catch{}
 function save(){try{localStorage.setItem('math-survival.ui.v1',JSON.stringify(prefs));}catch{}}
 // Fullscreen hides the browser bars. iPhone Safari has no page fullscreen, so there the 100dvh layout fills the screen instead.
 const root=document.documentElement;
 const canFullscreen=()=>!!(root.requestFullscreen||root.webkitRequestFullscreen)&&(document.fullscreenEnabled??document.webkitFullscreenEnabled)!==false;
 const isFullscreen=()=>!!(document.fullscreenElement||document.webkitFullscreenElement);
 function enterFullscreen(){if(!canFullscreen()||isFullscreen())return;try{const request=root.requestFullscreen?root.requestFullscreen({navigationUI:'hide'}):root.webkitRequestFullscreen();request?.catch?.(()=>{});}catch{}}
 function exitFullscreen(){if(!isFullscreen())return;try{const request=document.exitFullscreen?document.exitFullscreen():document.webkitExitFullscreen();request?.catch?.(()=>{});}catch{}}
 // Called from the start button click so the browser accepts it as a user gesture.
 function startFullscreen(){if(prefs.fullscreen)enterFullscreen();else window.scrollTo(0,0);}
 function syncFullscreen(){const button=$('fullscreenBtn');if(!button)return;const on=isFullscreen();button.textContent=on?'↙ 전체화면 끄기':'⛶ 전체화면';button.setAttribute('aria-pressed',String(on));}
 function close(){if(dialog?.open)dialog.close();$('pauseBtn')?.setAttribute('aria-expanded','false');}
 function pauseChanged(){if(r.state.paused&&!dialog.open){dialog.showModal();$('resumePlay').focus();}else if(!r.state.paused&&dialog.open){close();$('pauseBtn').focus();}$('pauseBtn').setAttribute('aria-expanded',String(dialog.open));}
 function sync(){const s=r.state,cfg=r.v2.config;
  $('healthMeter').max=s.maxHp||120;$('healthMeter').value=Math.max(0,s.hp||0);$('experienceMeter').value=Number($('exp').textContent)||0;$('compactEnergy').textContent='🔋 '+Math.floor(s.mathEnergy||0);
  const answering=s.quizActive&&!s.mathPopup;$('questionBox').hidden=!answering;$('answerBar').hidden=!(answering&&(cfg.mode==='explore'||prefs.answers==='buttons'));
  $('learningArea').hidden=!(answering||(!s.mathPopup&&($('explanation').textContent||s.explanationPending)));
  document.body.classList.toggle('learning-visible',!$('learningArea').hidden);
  $('answerAssist').checked=prefs.answers==='buttons';for(const b of $('answerAccess').querySelectorAll('button'))b.disabled=cfg.mode!=='explore'&&!$('answerAssist').checked;
  const first=$('answerAccess').querySelector('button:not(:disabled)');
  if($('answerBar').hidden)focusedAnswer=null;
  else if(first&&first!==focusedAnswer&&!s.paused&&!s.levelUpPending&&!s.merchantOpen&&!dialog?.open){
    focusedAnswer=first;first.classList.add('item-selected');first.focus({preventScroll:true});
    for(const arrow of ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight']){r.keys[arrow]=false;r.keys[arrow.toLowerCase()]=false;}
  }
  $('skillBtn').hidden=prefs.autoSkill&&!s.rankMode;
  if(prefs.autoSkill&&!s.rankMode&&s.running&&!s.paused&&r.enemies.some(e=>r.distance(e,r.player)<420))r.v2.combat.skill();
 }
 function mount(){document.body.classList.add('simple-play');dialog=document.createElement('dialog');dialog.id='playMenu';dialog.setAttribute('aria-labelledby','playMenuTitle');
  dialog.innerHTML='<h2 id="playMenuTitle">잠깐 쉬어가요</h2><p class="keyboardOnly">방향키로 메뉴 이동 · Enter로 선택 · 입력칸은 Tab<br>전투와 게임 시간이 멈췄어요.</p><button id="resumePlay">▶ 계속하기</button><div id="menuActions"></div><details id="playPreferences"><summary>조작·화면 설정</summary><label class="check"><input id="autoSkillToggle" type="checkbox">특수 스킬 자동 사용</label><label>전투 답안 방식<select id="combatAnswerMode"><option value="orbs">정답 구슬 찾아가기</option><option value="buttons">답안 버튼으로 구슬 선택</option></select></label><label class="check"><input id="menuReduced" type="checkbox">애니메이션 감소</label><label class="check"><input id="menuLow" type="checkbox">저사양 모드</label><label>글자 크기<select id="menuFont"><option value="1">기본</option><option value="1.15">크게</option><option value="1.3">아주 크게</option></select></label></details><details><summary>게임 설명</summary><p>방향키·WASD 또는 왼쪽 조이스틱으로 이동해요. 공격은 알아서 나가요. 정답 구슬을 찾으면 수학 에너지가 올라가요.</p><p>오른쪽 대시 버튼이나 Space를 누르면 잠깐 빠르게 움직여요. 특수 스킬을 직접 쓸 때는 E를 눌러요. P나 Esc를 누르면 쉬어갈 수 있어요.</p><p>답안 버튼은 클릭하거나, 방향키로 고른 뒤 Enter로 선택해요. 답안 버튼이 보일 때 캐릭터는 WASD로 움직여요.</p><p>구슬 대신 답안 버튼을 쓰고 싶거나, 특수 스킬을 직접 쓰고 싶으면 위의 조작·화면 설정을 열어 보세요.</p></details>';
  document.body.append(dialog);for(const id of ['saveExitBtn','playSound','mainMenuBtn','quitGameBtn'])$('menuActions').append($(id));
  const full=document.createElement('button');full.id='fullscreenBtn';full.type='button';$('playSound').after(full);
  if(canFullscreen()){$('menuActions').classList.add('has-fullscreen');full.onclick=()=>{prefs.fullscreen=!isFullscreen();save();if(prefs.fullscreen)enterFullscreen();else exitFullscreen();};syncFullscreen();for(const type of ['fullscreenchange','webkitfullscreenchange'])document.addEventListener(type,syncFullscreen);}
  else{full.remove();if(!matchMedia('(display-mode: standalone)').matches&&!navigator.standalone)$('menuActions').insertAdjacentHTML('afterend','<p id="fullscreenTip" class="small">아이폰에서는 공유 버튼 → ‘홈 화면에 추가’로 열면 주소창 없이 화면 전체로 할 수 있어요.</p>');}
  const stats=document.createElement('div');stats.id='detailedStats';for(const id of ['score','weaponLevel','combo','shield','time'])stats.append($(id).parentElement);
  $('gameDetails').append(stats,$('v3HUD'));dialog.append($('gameDetails'));$('gameDetails').querySelector('summary').textContent='미션·장비·상세 기록';
  $('assistLabel').hidden=true;$('playPreferences').append($('assistLabel'));
  const hp=$('hp').parentElement,level=$('level').parentElement;hp.id='healthStatus';hp.insertAdjacentHTML('beforeend','<progress id="healthMeter" aria-label="체력" value="120" max="120"></progress>');level.id='levelStatus';level.append($('exp').parentElement);level.insertAdjacentHTML('beforeend','<progress id="experienceMeter" aria-label="경험치" value="0" max="100"></progress><span id="compactEnergy" title="수학 에너지">🔋 0</span>');
  $('playfield').append($('toast'));
  $('gameHeader').append($('pauseBtn'));$('playControls').remove();$('pauseBtn').textContent='☰';$('pauseBtn').setAttribute('aria-label','게임 메뉴 및 일시정지');$('pauseBtn').setAttribute('aria-controls','playMenu');$('pauseBtn').setAttribute('aria-expanded','false');
  $('resumePlay').onclick=()=>r.v2.pause();dialog.addEventListener('cancel',e=>{e.preventDefault();r.v2.pause();});dialog.addEventListener('keydown',e=>{if(e.key==='Escape')e.stopPropagation();});
  $('autoSkillToggle').checked=prefs.autoSkill;$('combatAnswerMode').value=prefs.answers;
  $('autoSkillToggle').onchange=e=>{prefs.autoSkill=e.target.checked;save();sync();};$('combatAnswerMode').onchange=e=>{prefs.answers=e.target.value;save();sync();};
  for(const [menu,original]of [['menuReduced','reducedMotion'],['menuLow','lowPower'],['menuFont','fontSize']]){const copy=$(menu),source=$(original);const update=()=>{if(copy.type==='checkbox')copy.checked=source.checked;else copy.value=source.value;};update();copy.onchange=()=>{if(copy.type==='checkbox')source.checked=copy.checked;else source.value=copy.value;source.dispatchEvent(new Event('change'));};source.addEventListener('change',update);}
  const map=document.createElement('button');map.id='mapToggle';map.textContent='🗺';map.setAttribute('aria-label','미니맵 표시');map.setAttribute('aria-pressed',String(prefs.map));$('playfield').append(map);map.onclick=()=>{prefs.map=!prefs.map;prefs.mapChosen=true;map.setAttribute('aria-pressed',String(prefs.map));save();};
  const mobileControls=matchMedia('(pointer: coarse) and (max-width: 1099px), (pointer: coarse) and (max-height: 550px)');
  const placeControls=()=>{document.body.classList.toggle('mobile-play',mobileControls.matches);(mobileControls.matches?$('playfield'):$('wrap')).append($('touchControls'));};
  if(mobileControls.addEventListener)mobileControls.addEventListener('change',placeControls);else mobileControls.addListener(placeControls);
  placeControls();
 }
 return {mount,sync,pauseChanged,close,startFullscreen,exitFullscreen,get fullscreen(){return isFullscreen();},get isOpen(){return dialog.open;},get mapVisible(){return prefs.map;}};
}
