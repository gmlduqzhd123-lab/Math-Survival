import {renderQuestionVisual} from '../question-visual.js';
export class RewardLedger {
 constructor(){this.ids=new Set();}
 claim(id){if(typeof id!=='string'||!id||this.ids.has(id))return false;this.ids.add(id);return true;}
 clear(){this.ids.clear();}
}
export function energyReward(correct,passiveLevel=0){return correct?12+Math.max(0,Math.min(5,passiveLevel))*2:0;}
export function bossDamage(hp,amount,shield){return shield>0?Math.max(1,hp-amount*.2):hp-amount;}
export function createMathCombat(r){const ledger=new RewardLedger();let popup=false,returnPaused=false;
 function start(config){ledger.clear();popup=config.questionMode==='popup';r.state.mathEnergy=0;r.state.mathRewards=0;hide();}
 function hide(){const panel=document.getElementById('mathPopup');if(panel)panel.hidden=true;r.state.mathPopup=false;}
 function damage(e,amount){e.hp=bossDamage(e.hp,amount,e.mathShield||0);}
 function attachBoss(e){if(e.mathShield==null){e.mathShield=2+(e.midBoss?0:1);e.maxMathShield=e.mathShield;}}
 function award(problem,correct){if(!ledger.claim(problem.instanceId))return false;if(correct){const energy=energyReward(true,r.v3.weapons.passives.energy);r.state.mathEnergy=Math.min(100,r.state.mathEnergy+energy);r.state.mathRewards++;for(const boss of r.enemies)if(boss.boss&&boss.mathShield>0){boss.mathShield--;if(!boss.mathShield)r.showToast('수학 보호막 해제!');}}return true;}
 function present(problem){if(!popup||r.state.mode==='explore')return;const panel=document.getElementById('mathPopup');returnPaused=r.state.paused;r.state.mathPopup=true;r.state.paused=true;r.v2.clearInput();panel.hidden=false;document.getElementById('popupQuestion').textContent=problem.text;renderQuestionVisual(problem,document.getElementById('popupVisual'));document.getElementById('popupExplain').textContent='문제를 푸는 동안 전투 시간이 멈춥니다.';document.getElementById('popupOptions').replaceChildren();for(const value of problem.options){const button=document.createElement('button');button.textContent=value;button.addEventListener('click',()=>{if(!r.state.mathPopup||!r.state.quizActive)return;r.state.paused=false;r.resolveAnswer({value,correct:r.v2.isCorrect(value,problem.answer),explain:problem.explain});document.getElementById('popupExplain').textContent=problem.explain;});document.getElementById('popupOptions').append(button);}document.querySelector('#popupOptions button')?.focus();}
 function afterAnswer(){if(!r.state.mathPopup)return false;for(const button of document.querySelectorAll('#popupOptions button'))button.disabled=true;r.state.explanationPending=true;r.state.paused=true;document.getElementById('popupContinue').hidden=false;return true;}
 function hint(){if(!r.state.running||!r.state.quizActive)return;r.state.problem.hintUsed=true;r.state.hintUntil=r.gameNow()+6000;const text='힌트: '+r.state.problem.explain;document.getElementById(r.state.mathPopup?'popupExplain':'explanation').textContent=text;}
 function mount(){const panel=document.createElement('section');panel.id='mathPopup';panel.className='panel hiddenPopup';panel.hidden=true;panel.setAttribute('role','dialog');panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','popupQuestion');panel.innerHTML='<div class="card"><h2 id="popupQuestion"></h2><div id="popupVisual" hidden></div><p>수학 휴식 시간 · 전투와 타이머가 멈췄어요</p><div id="popupOptions" class="grid"></div><button id="popupHint">💡 힌트 보기</button><p id="popupExplain" role="status"></p><button id="popupContinue" hidden>해설 확인 · 전투 계속</button></div>';document.body.append(panel);document.getElementById('popupHint').addEventListener('click',hint);document.getElementById('popupContinue').addEventListener('click',()=>{if(!r.state.mathPopup)return;hide();r.state.explanationPending=false;r.state.paused=returnPaused;document.getElementById('popupContinue').hidden=true;});
 const button=document.createElement('button');button.id='mathHintBtn';button.textContent='💡 수학 힌트·해설';button.addEventListener('click',hint);document.getElementById('gameDetails').append(button);
 }
 return {start,award,present,afterAnswer,mount,hide,hint,damage,attachBoss,ledger,get popup(){return popup;}};
}
