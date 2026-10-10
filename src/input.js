// One pointer owns the joystick; right-hand buttons never replace it.
export function installInput(r) {
  let pointer = null, dashPointer = null;
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
    if(!r.state.running || editing(e.target)) return;
    const key=e.key.toLowerCase();
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
  window.addEventListener('keyup', e=> {r.keys[e.key.toLowerCase()]=false;r.keys[e.key]=false;});
  window.addEventListener('blur',()=>{clear();if(r.state.running&&!r.state.paused)r.v2.pause();});
  return {clear};
}
