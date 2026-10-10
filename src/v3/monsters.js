export const MONSTERS={
 sprout:{name:'새싹 슬라임',ai:'chase',hp:34,speed:1.25,r:16,damage:7,color:'#84dca3',icon:'🌱'},
 bat:{name:'숫자 박쥐',ai:'chase',hp:20,speed:1.8,r:12,damage:5,color:'#b9a1ef',icon:'🦇'},
 ram:{name:'돌진 도깨비',ai:'charge',hp:55,speed:1,r:18,damage:10,color:'#f9a579',icon:'🐏'},
 archer:{name:'분필 궁수',ai:'ranged',hp:36,speed:.8,r:16,damage:7,color:'#f6d077',icon:'🏹'},
 jelly:{name:'분열 젤리',ai:'split',hp:54,speed:.85,r:21,damage:7,color:'#a2e3ea',icon:'🫧'},
 shaman:{name:'소환 버섯',ai:'summon',hp:75,speed:.6,r:20,damage:8,color:'#dc9be6',icon:'🍄'},
 turtle:{name:'철갑 거북',ai:'tank',hp:150,speed:.5,r:26,damage:12,color:'#6da894',icon:'🐢'},
 healer:{name:'회복 꽃',ai:'heal',hp:42,speed:.65,r:17,damage:4,color:'#f1a9cf',icon:'🌸'},
 frost:{name:'얼음 정령',ai:'ranged',hp:52,speed:.9,r:18,damage:7,color:'#8bbfec',icon:'❄️'},
 sentinel:{name:'거울 수호병',ai:'charge',hp:95,speed:.75,r:23,damage:12,color:'#ddc990',icon:'🪞'}
};
// Movement uses the existing fixed 60 Hz clock; actions are scheduled in game milliseconds.
export function advanceMonster(e,p,now,scale=1){const ai=MONSTERS[e.species]?.ai||'chase',distance=Math.hypot(p.x-e.x,p.y-e.y),angle=Math.atan2(p.y-e.y,p.x-e.x);let action=null,speed=e.speed;
 if(ai==='charge'){
  if(e.chargeUntil>now){e.x+=Math.cos(e.chargeAngle)*speed*4*scale;e.y+=Math.sin(e.chargeAngle)*speed*4*scale;return null;}
  if(e.windupUntil){if(now>=e.windupUntil){e.chargeAngle=e.aim;e.chargeUntil=now+650;e.windupUntil=0;e.nextAction=now+3800;}return null;}
  if(now>=(e.nextAction||0)&&distance<650){e.aim=angle;e.windupUntil=now+850;return 'warn';}
 }
 if(ai==='ranged'){speed*=distance<230?-1:distance<400?0:1;if(now>=(e.nextAction||0)&&distance<650){e.nextAction=now+2400;action='shoot';}}
 if(ai==='summon'&&now>=(e.nextAction||0)){e.nextAction=now+6000;action='summon';}
 if(ai==='heal'&&now>=(e.nextAction||0)){e.nextAction=now+3500;action='heal';}
 e.x+=Math.cos(angle)*speed*scale;e.y+=Math.sin(angle)*speed*scale;return action;
}
