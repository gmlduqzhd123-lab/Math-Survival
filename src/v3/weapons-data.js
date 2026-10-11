export const NEW_WEAPONS={
 abacus:{description:"주판 구슬을 여러 개 쏴서 몬스터를 맞혀요.",name:'구슬 주판',icon:'🧮',style:'spread',cooldown:1150,damage:20,count:2,range:500,pierce:0,color:'#ffae88'},
 dice:{description:"주사위가 터지며 주변 몬스터를 공격해요.",name:'행운 주사위',icon:'🎲',style:'blast',cooldown:1900,damage:45,count:1,range:100,pierce:0,color:'#edd381'},
 ruler:{description:"자처럼 긴 빛줄기로 여러 몬스터를 맞혀요.",name:'무한 자',icon:'📏',style:'beam',cooldown:1700,damage:34,count:1,range:480,pierce:8,color:'#88dbd9'},
 protractor:{description:"부채처럼 구슬을 넓게 펼쳐 쏴요.",name:'각도 부채',icon:'📐',style:'fan',cooldown:1600,damage:16,count:5,range:400,pierce:1,color:'#95c4ff'},
 star:{description:"캐릭터 주위를 도는 별이 몬스터를 맞혀요.",name:'별자리 나침반',icon:'🌟',style:'orbit',cooldown:650,damage:18,count:3,range:110,pierce:10,color:'#f4d88b'},
 quill:{description:"깃털이 몬스터를 따라가며 공격해요.",name:'정답 깃털',icon:'🪶',style:'homing',cooldown:1250,damage:28,count:2,range:600,pierce:1,color:'#d2b2ff'},
 clock:{description:"주변 몬스터를 공격하고 잠깐 느리게 만들어요.",name:'시간 톱니',icon:'⏰',style:'slow',cooldown:2300,damage:32,count:1,range:180,pierce:10,color:'#b3def1'},
 polygon:{description:"칼날이 날아갔다 돌아오며 몬스터를 맞혀요.",name:'다각형 칼날',icon:'🔷',style:'return',cooldown:1650,damage:28,count:2,range:420,pierce:3,color:'#86d5bf'},
 comet:{description:"하늘에서 혜성이 떨어져 몬스터를 맞혀요.",name:'소수 혜성',icon:'☄️',style:'rain',cooldown:2100,damage:35,count:3,range:330,pierce:2,color:'#f5a9bf'},
 root:{description:"뿌리가 자란 곳의 몬스터를 계속 공격해요.",name:'지식의 뿌리',icon:'🌿',style:'zone',cooldown:2200,damage:15,count:2,range:110,pierce:10,color:'#88cb94'}
};
export const LEGACY_WEAPONS={magic:{name:'마법구',icon:'🔮'},satellite:{name:'회전 위성',icon:'🪐'},laser:{name:'수학 레이저',icon:'📏'},boomerang:{name:'부메랑 칠판',icon:'📋'},chalk:{name:'분필 비',icon:'✏️'},storm:{name:'숫자 폭풍',icon:'🌀'},compass:{name:'황금 컴퍼스',icon:'📐'},fraction:{name:'분수 방패',icon:'🛡️'},lightning:{name:'연산 번개',icon:'⚡'}};
export const PASSIVES={power:{name:'힘의 연필',icon:'✏️',description:'공격이 더 세져요. 고를 때마다 새 무기가 주는 피해가 8% 늘어요.'},haste:{name:'빠른 계산',icon:'⚡',description:'무기를 더 자주 써요. 고를 때마다 새 무기의 기다리는 시간이 6% 줄어요.'},area:{name:'넓이 노트',icon:'📒',description:'더 넓은 곳을 공격해요. 고를 때마다 새 무기의 공격 범위가 8% 늘어요.'},armor:{name:'튼튼한 책가방',icon:'🎒',description:'몬스터와 부딪혀도 체력이 덜 줄어요. 보호막도 하나 얻어요.'},heart:{name:'생명의 씨앗',icon:'🌱',description:'체력 한도가 12 늘어나요. 지금 체력도 12 회복해요.'},luck:{name:'행운 클로버',icon:'🍀',description:'가끔 아주 강한 공격이 나올 가능성이 높아져요.'},magnet:{name:'구슬 자석',icon:'🧲',description:'멀리 있는 경험치 보석도 더 쉽게 주워요.'},energy:{name:'수학 충전지',icon:'🔋',description:'정답을 맞힐 때 받는 수학 에너지가 2씩 더 늘어요.'}};
const passiveOrder=['power','haste','area','luck','energy','armor','heart','magnet'];
export const EVOLUTIONS=Object.keys({...LEGACY_WEAPONS,...NEW_WEAPONS}).map((weapon,i)=>({id:'evo-'+weapon,weapon,passive:passiveOrder[i%8],weaponLevel:Object.hasOwn(NEW_WEAPONS,weapon)?5:3,passiveLevel:2,name:({...LEGACY_WEAPONS,...NEW_WEAPONS})[weapon].name+' · 완전 진화'}));
export const ULTIMATES=[{id:'galaxy',name:'은하의 정리',weapons:['star','satellite'],style:'orbit',color:'#ccb8ff'},{id:'fortune',name:'무한 확률 폭풍',weapons:['dice','storm'],style:'blast',color:'#f7dd77'},{id:'proof',name:'황금 증명',weapons:['quill','compass'],style:'beam',color:'#81e5d4'},{id:'eternity',name:'영원의 방패',weapons:['clock','fraction'],style:'slow',color:'#92c9ff'}];
export function weaponStats(id,level,passives={},evolved=false,breaks=0){const w=NEW_WEAPONS[id];if(!w)throw Error('무기 정의 없음');return {...w,damage:w.damage*(1+(level-1)*.28)*(1+(passives.power||0)*.08)*(evolved?1.65:1)*(1+breaks*.05),cooldown:Math.max(200,w.cooldown*(1-(passives.haste||0)*.06)/(1+(level-1)*.09)/(evolved?1.25:1)),count:w.count+Math.floor((level-1)/2)+(evolved?2:0),range:w.range*(1+(passives.area||0)*.08+(level-1)*.05),pierce:w.pierce+Math.floor(level/3)+(evolved?2:0)};}
export function eligibleEvolution(recipe,inventory,passives,evolved){return !evolved[recipe.weapon]&&(inventory[recipe.weapon]||0)>=recipe.weaponLevel&&(passives[recipe.passive]||0)>=recipe.passiveLevel;}

// One owned weapon is always offered; the remaining cards use an unbiased shuffle.
export function selectUpgradeCards(options,owned,rng=Math.random){
 const cards=[...options];for(let i=cards.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[cards[i],cards[j]]=[cards[j],cards[i]];}
 const growth=cards.find(o=>o.slot&&Object.hasOwn(owned,o.slot));
 return growth?[growth,...cards.filter(o=>o!==growth).slice(0,2)]:cards.slice(0,3);
}
