export const NEW_WEAPONS={
 abacus:{name:'구슬 주판',icon:'🧮',style:'spread',cooldown:1150,damage:20,count:2,range:500,pierce:0,color:'#ffae88'},
 dice:{name:'행운 주사위',icon:'🎲',style:'blast',cooldown:1900,damage:45,count:1,range:100,pierce:0,color:'#edd381'},
 ruler:{name:'무한 자',icon:'📏',style:'beam',cooldown:1700,damage:34,count:1,range:480,pierce:8,color:'#88dbd9'},
 protractor:{name:'각도 부채',icon:'📐',style:'fan',cooldown:1600,damage:16,count:5,range:400,pierce:1,color:'#95c4ff'},
 star:{name:'별자리 나침반',icon:'🌟',style:'orbit',cooldown:650,damage:18,count:3,range:110,pierce:10,color:'#f4d88b'},
 quill:{name:'정답 깃털',icon:'🪶',style:'homing',cooldown:1250,damage:28,count:2,range:600,pierce:1,color:'#d2b2ff'},
 clock:{name:'시간 톱니',icon:'⏰',style:'slow',cooldown:2300,damage:32,count:1,range:180,pierce:10,color:'#b3def1'},
 polygon:{name:'다각형 칼날',icon:'🔷',style:'return',cooldown:1650,damage:28,count:2,range:420,pierce:3,color:'#86d5bf'},
 comet:{name:'소수 혜성',icon:'☄️',style:'rain',cooldown:2100,damage:35,count:3,range:330,pierce:2,color:'#f5a9bf'},
 root:{name:'지식의 뿌리',icon:'🌿',style:'zone',cooldown:2200,damage:15,count:2,range:110,pierce:10,color:'#88cb94'}
};
export const LEGACY_WEAPONS={magic:{name:'마법구',icon:'🔮'},satellite:{name:'회전 위성',icon:'🪐'},laser:{name:'수학 레이저',icon:'📏'},boomerang:{name:'부메랑 칠판',icon:'📋'},chalk:{name:'분필 비',icon:'✏️'},storm:{name:'숫자 폭풍',icon:'🌀'},compass:{name:'황금 컴퍼스',icon:'📐'},fraction:{name:'분수 방패',icon:'🛡️'},lightning:{name:'연산 번개',icon:'⚡'}};
export const PASSIVES={power:{name:'힘의 연필',icon:'✏️',description:'피해량 +8%/단계'},haste:{name:'빠른 계산',icon:'⚡',description:'재사용 시간 -6%/단계'},area:{name:'넓이 노트',icon:'📒',description:'공격 범위 +8%/단계'},armor:{name:'튼튼한 책가방',icon:'🎒',description:'접촉 피해 감소'},heart:{name:'생명의 씨앗',icon:'🌱',description:'최대 체력 +12/단계'},luck:{name:'행운 클로버',icon:'🍀',description:'치명타 확률 +4%/단계'},magnet:{name:'구슬 자석',icon:'🧲',description:'보석 수집 거리 증가'},energy:{name:'수학 충전지',icon:'🔋',description:'정답 에너지 +2/단계'}};
const passiveOrder=['power','haste','area','luck','energy','armor','heart','magnet'];
export const EVOLUTIONS=Object.keys({...LEGACY_WEAPONS,...NEW_WEAPONS}).map((weapon,i)=>({id:'evo-'+weapon,weapon,passive:passiveOrder[i%8],weaponLevel:Object.hasOwn(NEW_WEAPONS,weapon)?5:3,passiveLevel:2,name:({...LEGACY_WEAPONS,...NEW_WEAPONS})[weapon].name+' · 완전 진화'}));
export const ULTIMATES=[{id:'galaxy',name:'은하의 정리',weapons:['star','satellite'],style:'orbit',color:'#ccb8ff'},{id:'fortune',name:'무한 확률 폭풍',weapons:['dice','storm'],style:'blast',color:'#f7dd77'},{id:'proof',name:'황금 증명',weapons:['quill','compass'],style:'beam',color:'#81e5d4'},{id:'eternity',name:'영원의 방패',weapons:['clock','fraction'],style:'slow',color:'#92c9ff'}];
export function weaponStats(id,level,passives={},evolved=false,breaks=0){const w=NEW_WEAPONS[id];if(!w)throw Error('무기 정의 없음');return {...w,damage:w.damage*(1+(level-1)*.28)*(1+(passives.power||0)*.08)*(evolved?1.65:1)*(1+breaks*.05),cooldown:Math.max(200,w.cooldown*(1-(passives.haste||0)*.06)/(1+(level-1)*.09)/(evolved?1.25:1)),count:w.count+Math.floor((level-1)/2)+(evolved?2:0),range:w.range*(1+(passives.area||0)*.08+(level-1)*.05),pierce:w.pierce+Math.floor(level/3)+(evolved?2:0)};}
export function eligibleEvolution(recipe,inventory,passives,evolved){return !evolved[recipe.weapon]&&(inventory[recipe.weapon]||0)>=recipe.weaponLevel&&(passives[recipe.passive]||0)>=recipe.passiveLevel;}
