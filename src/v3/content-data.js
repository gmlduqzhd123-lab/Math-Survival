export const NEW_CHARACTERS={
 rabbit:{name:'계산 토끼',icon:'🐰',color:'#f5bfd5',hp:115,speed:5.2,attack:23,rate:450,weapon:'abacus',skill:'dash',description:'빠른 이동 · 연속 대시',unlock:60},
 fox:{name:'도형 여우',icon:'🦊',color:'#f5b185',hp:125,speed:4.6,attack:27,rate:470,weapon:'protractor',skill:'fan',description:'부채꼴 공격 · 공격력 27',unlock:140},
 panda:{name:'분수 판다',icon:'🐼',color:'#d1dcca',hp:190,speed:3.7,attack:24,rate:530,weapon:'clock',skill:'heal',description:'체력 190 · 주변 회복',unlock:220},
 owl:{name:'지식 부엉이',icon:'🦉',color:'#b8b6e8',hp:120,speed:4.2,attack:25,rate:390,weapon:'quill',skill:'energy',description:'수학 에너지 충전 · 유도 깃털',unlock:320},
 cat:{name:'확률 고양이',icon:'🐱',color:'#f0d685',hp:130,speed:4.7,attack:25,rate:450,weapon:'dice',skill:'blast',description:'행운 폭발 · 회복 보너스',unlock:450},
 otter:{name:'소수 수달',icon:'🦦',color:'#9ed4d0',hp:145,speed:4.5,attack:24,rate:460,weapon:'comet',skill:'freeze',description:'시간 정지 · 소수 혜성',unlock:600},
 dragon:{name:'증명 용',icon:'🐲',color:'#acd28b',hp:155,speed:4.3,attack:30,rate:470,weapon:'star',skill:'meteor',description:'별빛 폭격 · 공격력 30',unlock:800}
};
export const PETS={
 fairy:{name:'수학 요정',icon:'🦉',kind:'attack',period:1100,unlock:0},
 bee:{name:'구구 꿀벌',icon:'🐝',kind:'attack',period:850,unlock:50},
 cloud:{name:'회복 구름',icon:'☁️',kind:'heal',period:5500,unlock:100},
 magnet:{name:'자석 햄스터',icon:'🐹',kind:'collect',period:1000,unlock:160},
 turtle:{name:'보호 거북',icon:'🐢',kind:'shield',period:11000,unlock:240},
 butterfly:{name:'시간 나비',icon:'🦋',kind:'slow',period:5000,unlock:340},
 fox:{name:'번개 여우',icon:'🦊',kind:'chain',period:1800,unlock:460},
 phoenix:{name:'지식 불사조',icon:'🐦',kind:'revive',period:7000,unlock:620}
};
export const NEW_WORLDS={
 ocean:{name:'소수 바다',worldW:3200,worldH:2200,base:'#103b4b',grid:'rgba(152,227,242,.13)',accent:'#4ab5cf',accent2:'#9edeea',deco:['🐚','🪸','🌊','🫧','🐠']},
 clockwork:{name:'확률 시계탑',worldW:3100,worldH:2150,base:'#3d2b42',grid:'rgba(222,194,244,.13)',accent:'#d2a775',accent2:'#e7c28e',deco:['⚙️','⏳','🎲','🔔','✨']},
 sky:{name:'도형 하늘정원',worldW:3300,worldH:2250,base:'#233b54',grid:'rgba(213,242,252,.13)',accent:'#90c5bd',accent2:'#d0eae1',deco:['☁️','🌟','🔷','🌱','🪽']}
};
export const BOSSES={forest:{name:'구구단 골렘',icon:'🗿',gold:35},desert:{name:'분수 드래곤',icon:'🐉',gold:45},library:{name:'도형 마왕',icon:'👾',gold:55},ocean:{name:'소수 크라켄',icon:'🐙',gold:65},clockwork:{name:'확률 기계왕',icon:'🤖',gold:75},sky:{name:'다각형 천룡',icon:'🐲',gold:90}};
export const MAP_EVENTS={treasure:{name:'보물방',icon:'🎁',description:'보물상자와 경험치 보석'},merchant:{name:'숲의 상인',icon:'🦝',description:'이번 판 골드 20으로 회복/패시브 구매'},altar:{name:'강화 제단',icon:'⛩️',description:'수학 에너지 20으로 공격력 강화'},secret:{name:'비밀 포털',icon:'🌀',description:'숨겨진 보물방으로 순간 이동'}};
export const phaseFor=hpRatio=>hpRatio>2/3?1:hpRatio>1/3?2:3;
