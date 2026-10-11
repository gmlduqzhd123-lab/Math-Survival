// One pointer owns the joystick; right-hand buttons never replace it.
export function installInput(r) {
  let pointer = null, dashPointer = null;
  let choiceEnterHeld = false;
  const choicePanel = () => {
    const menu=document.getElementById('playMenu');
    if(menu?.open)return menu;
    if(!r.state.running){
      if([...document.querySelectorAll('[role="dialog"][aria-modal="true"]')].some(dialog=>dialog.getClientRects().length))return null;
      const home=document.getElementById('startPanel');return home?.getClientRects().length&&!home.classList.contains('hidden')?home:null;
    }
    if(r.state.mathPopup)return document.getElementById(r.state.explanationPending?'popupContinue':'popupOptions');
    if(r.state.merchantOpen)return document.getElementById('merchantPopup');
    if(r.state.levelUpPending)return r.levelUpPanel;
    if(r.state.explanationPending&&!document.getElementById('continueQuestion').hidden)return document.getElementById('continueQuestion');
    if(r.state.quizActive&&!document.getElementById('answerBar').hidden)return document.getElementById('answerAccess');
    return null;
  };
  function visibleChoice(button,panel){
    if(button.disabled||!button.getClientRects().length||getComputedStyle(button).visibility==='hidden')return false;
    // Closed disclosures may retain descendant layout rectangles in some browsers.
    for(let parent=button.parentElement;parent&&parent!==panel;parent=parent.parentElement)
      if(parent.matches('details')&&!parent.open&&!parent.querySelector(':scope>summary')?.contains(button))return false;
    return true;
  }
  const choices = panel => (panel.matches('button')?[panel]:[...panel.querySelectorAll(panel.id==='startPanel'||panel.id==='playMenu'?'button:not(:disabled),summary,a[href]':'button:not(:disabled)')]).filter(button=>visibleChoice(button,panel));
  function highlight(button,panel){
    panel.querySelectorAll('.item-selected').forEach(item=>item.classList.remove('item-selected'));
    button.classList.add('item-selected');
  }
  document.addEventListener('focusin',e=>{const panel=choicePanel();if(panel&&e.target.matches('button:not(:disabled),summary,a[href]')&&panel.contains(e.target))highlight(e.target,panel);});
  function navigateChoice(panel,key){
    const buttons=choices(panel);if(!buttons.length)return;
    let index=buttons.indexOf(document.activeElement);
    if(index<0){(panel.id==='startPanel'?buttons.find(button=>button.id==='startBtn')||buttons[0]:buttons[0]).focus();return;}
    if(key==='enter'){buttons[index].click();return;}
    let next;
    if(key==='arrowleft'||key==='arrowright')next=buttons[(index+(key==='arrowright'?1:-1)+buttons.length)%buttons.length];
    else {
      const center=button=>{const box=button.getBoundingClientRect();return {x:box.x+box.width/2,y:box.y+box.height/2};};
      const origin=center(buttons[index]),direction=key==='arrowdown'?1:-1;
      const candidates=buttons.filter(button=>direction*(center(button).y-origin.y)>4);
      candidates.sort((a,b)=>{const ca=center(a),cb=center(b);return Math.abs(ca.y-origin.y)-Math.abs(cb.y-origin.y)||Math.abs(ca.x-origin.x)-Math.abs(cb.x-origin.x);});
      next=candidates[0]||buttons[(index+direction+buttons.length)%buttons.length];
    }
    next.focus();
  }
  // Contain mobile swipes in the game. Keep scrollable menus usable, including
  // nested panels, but do not let a boundary drag reach browser pull-to-refresh.
  let touchY=0;
  document.addEventListener('touchstart',e=>{touchY=e.touches[0]?.clientY||0;},{passive:true});
  document.addEventListener('touchmove',e=>{
    if(!r.state.running||!e.cancelable)return;
    const y=e.touches[0]?.clientY??touchY,delta=y-touchY;touchY=y;
    if(e.target.closest?.('input[type="range"],textarea'))return;
    for(let node=e.target;node&&node!==document.body&&node!==document.documentElement;node=node.parentElement){
      if(!node.style)continue;
      const scrollable=/auto|scroll/.test(getComputedStyle(node).overflowY)&&node.scrollHeight>node.clientHeight+1;
      if(scrollable&&((delta>0&&node.scrollTop>0)||(delta<0&&node.scrollTop+node.clientHeight<node.scrollHeight-1)))return;
    }
    e.preventDefault();
  },{passive:false});
  const zone = r.joystickZone;
  function releaseJoystick() {
    if (pointer !== null && zone.hasPointerCapture?.(pointer)) zone.releasePointerCapture(pointer);
    pointer = null; r.stopJoystick();
  }
  function clear() {
    releaseJoystick();
    if(dashPointer!==null&&r.dashBtn.hasPointerCapture?.(dashPointer))r.dashBtn.releasePointerCapture(dashPointer);
    dashPointer=null;r.stopDash(); r.state.dashRequested = false;
    for (const key of Object.keys(r.keys)) r.keys[key] = false;
  }
  zone.addEventListener('pointerdown', e => {
    if (!r.state.running || r.state.paused || pointer !== null) return;
    e.preventDefault(); pointer = e.pointerId; zone.setPointerCapture(pointer);
    const box = zone.getBoundingClientRect(); r.joystickCenter = {x: box.left + box.width/2, y: box.top + box.height/2};
    r.isJoystickActive = true; r.updateJoystick(e.clientX, e.clientY);
  });
  zone.addEventListener('pointermove', e => { if (e.pointerId === pointer) { e.preventDefault(); r.updateJoystick(e.clientX,e.clientY); } });
  for (const event of ['pointerup','pointercancel','lostpointercapture']) zone.addEventListener(event, e => {if(e.pointerId === pointer) releaseJoystick();});
  r.dashBtn.addEventListener('pointerdown', e => {if (!r.state.running || r.state.paused || dashPointer!==null) return; e.preventDefault();dashPointer=e.pointerId; r.dashBtn.setPointerCapture(e.pointerId); r.state.dashRequested = true; r.keys[' '] = true;});
  for(const event of ['pointerup','pointercancel','lostpointercapture']) r.dashBtn.addEventListener(event,e=>{if(e.pointerId===dashPointer){dashPointer=null;r.stopDash();}});
  const editing = target => target?.closest?.('input,select,textarea,[contenteditable="true"]');
  window.addEventListener('keydown', e => {
    if(editing(e.target)) return;
    const key=e.key.toLowerCase();
    // A held Enter must not consume another reward, answer or continue action.
    if(key==='enter'&&choiceEnterHeld){e.preventDefault();return;}
    const panel=choicePanel();
    if(panel&&['arrowup','arrowdown','arrowleft','arrowright','enter'].includes(key)&&
      !(key==='enter'&&e.target.closest?.('button')&&!panel.contains(e.target))){
      e.preventDefault();
      if(panel.id==='answerAccess')for(const arrow of ['ArrowUp','ArrowDown','ArrowLeft','ArrowRight']){r.keys[arrow]=false;r.keys[arrow.toLowerCase()]=false;}
      else clear();
      if(key==='enter'){choiceEnterHeld=true;if(e.repeat)return;}
      navigateChoice(panel,key);return;
    }
    if(!r.state.running)return;
    if(key===' '&&e.target?.closest?.('button,summary'))return;
    if(e.repeat && ['p','e','q','escape'].includes(key)) return;
    if(key==='escape') {e.preventDefault(); r.v2.pause(); return;}
    if(key==='q') {r.quitGame();return;}
    if(key==='p') {r.v2.pause();return;}
    if(r.state.paused) return;
    if(key==='e') r.v2.combat.skill();
    r.keys[key]=true;r.keys[e.key]=true;
    if(key===' ') r.state.dashRequested=true;
    if(['arrowup','arrowdown','arrowleft','arrowright',' '].includes(key)) e.preventDefault();
  });
  window.addEventListener('keyup', e=> {if(e.key==='Enter')choiceEnterHeld=false;r.keys[e.key.toLowerCase()]=false;r.keys[e.key]=false;});
  window.addEventListener('blur',()=>{choiceEnterHeld=false;clear();if(r.state.running&&!r.state.paused)r.v2.pause();});
  return {clear};
}
