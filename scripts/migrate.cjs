// One-time, scope-aware extraction of the preserved upstream engine.
const fs=require('node:fs'),acorn=require('acorn'),scope=require('eslint-scope');
const html=fs.readFileSync('original/index.html','utf8').replaceAll('\r\n','\n');
let source=html.match(/<script>([\s\S]*?)<\/script>/)[1];
const css=html.match(/<style>([\s\S]*?)<\/style>/)[1];
fs.writeFileSync('src/original.css',css);
// Preserve behavior first; apply narrowly scoped integration fixes.
source=source.replaceAll('performance.now()', 'gameNow()');
source=source.replace('let last = gameNow();','let last = performance.now();');
source=source.replace('const dt = Math.min(34, now - last);','const dt = Math.min(34, now - last);\n      if (state.running && !state.paused) clock += dt;');
source=source.replace('const nextHeight = mobile ? 820 : 650;','const nextHeight = mobile ? (window.innerWidth > window.innerHeight ? 480 : 820) : 650;');
source=source.replace('update(dt, now);','update(dt, gameNow());');
source=source.replace('updateBuffUI(now);\n      if (!state.running || state.paused) return;','if (!state.running || state.paused) return;\n      updateBuffUI(now);');
source=source.replace('state.time += dt / 1000;','state.time += dt / 1000;\n      v2.tick(dt, now);\n      if (!state.running || state.paused) return;');
source=source.replace('state.time > 45 + state.bossIndex * 50','state.mode === "survival" && state.time > 45 + state.bossIndex * 50');
source=source.replace('function spawnEnemy() {','function spawnEnemy() {\n      if (state.mode === "explore") return;');
source=source.replace('now - state.lastQuiz > 15000','now - state.lastQuiz > v2.quizInterval');
source=source.replace('p.kind === "orb" || p.kind === "chalk"','p.kind === "orb" || p.kind === "chalk" || p.kind === "pet"');
source=source.replace('setTimeout(openLevelUpPanel, 150);','openLevelUpPanel();');
source=source.replace('if (state.hp <= 0) endGame(false);\n      if (state.time >= state.winTime) endGame(true);','if (state.hp <= 0) endGame(false);\n      else if (state.time >= state.winTime) endGame(true);');
source=source.replace('function resetGame() {','function resetGame() {\n      clock = 0;\n      Object.keys(keys).forEach(k => keys[k] = false);');
source=source.replace('keys[" "] = true;','keys[" "] = true;\n      if(state.running && !state.paused) state.dashRequested = true;');
source=source.replace('keys[e.key] = true;','keys[e.key] = true;\n      if(e.key === " " && state.running && !state.paused) state.dashRequested = true;');
source=source.replace('if (keys[" "] && player.dashCooldown <= 0)','if ((keys[" "] || state.dashRequested) && player.dashCooldown <= 0)');
source=source.replace('const spawnDelay = Math.max','state.dashRequested = false;\n      const spawnDelay = Math.max');
source=source.replace('state.running = true;','state.dashRequested = false;\n      state.running = true;');
source=source.replace('function endGame(won, quit = false) {','function endGame(won, quit = false) {\n      if (!state.running) return;');
source=source.replace('document.getElementById("finalCombo").textContent = state.bestCombo;','document.getElementById("finalCombo").textContent = state.bestCombo;\n      v2.finish(won, quit);');
source=source.replace('showToast(`${state.map.name} 입장! 큰 맵을 돌아다니며 살아남으세요.`);','showToast(`${state.map.name} 입장! 큰 맵을 돌아다니며 살아남으세요.`);\n      v2.start();');
source=source.replace('drawBackground(now);','drawBackground(now);\n      v2.draw(now);');
source=source.replace('return options.sort(() => Math.random() - 0.5).slice(0, 3);','return [...options, ...v2.upgrades()].sort(() => Math.random() - 0.5).slice(0, 3);');
source=source.replace('defeated.push(e);','defeated.push(e);\n          state.kills++;\n          if(e.boss) state.bossKills++;');
source=source.replace('state.portalCooldown - 16','state.portalCooldown - (1000 / 60)');
source=source.replace('ctx.fillText(orb.value, sx, sy);','ctx.fillText(orb.value, sx, sy, orb.r * 1.9);');
source=source.replace('const pulse = Math.sin(orb.pulse) * (hint ? 7 : 4);','const pulse = v2.settings.reduced ? 0 : Math.sin(orb.pulse) * (hint ? 7 : 4);');
source=source.replace('ctx.rotate(now / 95);','ctx.rotate(v2.settings.reduced ? 0 : now / 95);');
source=source.replace('ctx.globalAlpha = 0.42 + Math.sin(now / 38) * 0.26;','ctx.globalAlpha = v2.settings.reduced ? 0.75 : 0.42 + Math.sin(now / 38) * 0.26;');
const misplacedPortalStart=source.indexOf('      for (const p of portals) {',source.indexOf('function update(dt'));
const misplacedPortalEnd=source.indexOf('      for (const item of items) {',misplacedPortalStart);
if(misplacedPortalStart!==-1)source=source.slice(0,misplacedPortalStart)+source.slice(misplacedPortalEnd);
source=source.replace('orb.correct ? "rgba(34,197,94,.20)" : "rgba(239,68,68,.16)"','"rgba(56,189,248,.20)"').replace('orb.correct ? "#86efac" : "#fca5a5"','"#bae6fd"').replace('orb.correct ? "#16a34a" : "#dc2626"','"#38bdf8"');
source=source.replace('ctx.font = "900 24px Malgun Gothic, sans-serif";','ctx.font = `${24 * v2.settings.font}px Malgun Gothic, sans-serif`;');
source=source.replace('ctx.fillStyle = e.boss ? "#991b1b" : e.elite ? "#7f1d1d" : e.tiny ? "#065f46" : "#581c87";','ctx.fillStyle = e.boss ? state.map.accent : e.elite ? "#ec725f" : e.tiny ? "#45bba0" : state.map.accent2;');
source=source.replace('ctx.fillText("👑", 0, -e.r - 18);','ctx.fillText(({forest:"🗿",desert:"🐉",library:"👾"})[state.currentMapKey], 0, -e.r - 18);');
source=source.replace('const names = ["구구단 대왕", "분수 골렘", "방정식 드래곤"];','const names = ["구구단 골렘", "분수 드래곤", "도형 마왕"];');
source=source.replace('name: names[state.bossIndex % names.length],','name: names[({forest:0,desert:1,library:2})[state.currentMapKey]],\n        bossType: state.currentMapKey, nextPattern: gameNow() + 1800, patternIndex: 0,');
source=source.replace('speed: (elite ? 0.96 : tiny ? 1.55 : 1.25) + Math.min(0.78, t / 180),','speed: ((elite ? 0.96 : tiny ? 1.55 : 1.25) + Math.min(0.78, t / 180)) * ({easy:.7,normal:1,hard:1.25})[state.difficulty],');
source=source.replace('damage: elite ? 13 : tiny ? 5 : 8,','damage: (elite ? 13 : tiny ? 5 : 8) * ({easy:.65,normal:1,hard:1.4})[state.difficulty],');
source=source.replace('for (let i = 0; i < 150; i++)','for (let i = 0; i < (v2?.settings.low ? 45 : 150); i++)').replace('for (let i = 0; i < 180; i++)','for (let i = 0; i < (v2?.settings.low ? 25 : 180); i++)');
source=source.replace('s.tw += 0.02;','s.tw = v2.settings.reduced ? s.tw : now / 800;');
source=source.replace('player.blink += dt / 180;','if (!v2.settings.reduced) player.blink += dt / 180;');
source=source.replace('ctx.fillStyle = "#60a5fa";','ctx.fillStyle = ({explorer:"#f6b875",mage:"#a59dfb",guardian:"#65cdb5"})[state.character] || "#60a5fa";');
source=source.replace('ctx.fillStyle = "#7c3aed";','ctx.fillStyle = state.character === "guardian" ? "#0d9488" : state.character === "explorer" ? "#c2853c" : "#7c3aed";');
source=source.replace('function burst(x, y, color, count = 20, speed = 3) {','function burst(x, y, color, count = 20, speed = 3) {\n      count = v2?.settings.reduced ? 0 : v2?.settings.low ? Math.min(count, 5) : count;');
source=source.replace('function resolveAnswer(orb) {\n      if (!state.quizActive) return;','function resolveAnswer(orb) {\n      if (!state.quizActive) return;\n      v2.record(orb);');
source=source.replace('      checkLevelUp();\n    }\n\n    function expNeed()', '      checkLevelUp();\n      v2.afterAnswer();\n    }\n\n    function expNeed()');
source=source.replace('state.paused = !state.paused;','v2.pause();');
source=source.replace('const problem = makeProblem();','const problem = makeProblem();\n      state.problem = problem;\n      v2.present(problem);');
source=source.replace('correct: value === problem.answer,','correct: v2.isCorrect(value, problem.answer),');
const start=source.indexOf('      const offsets = [', source.indexOf('function spawnQuiz'));
const end=source.indexOf('      showToast("수학 문제가 등장',start);
source=source.slice(0,start)+`      const offsets = v2.orbPositions();
      problem.options.forEach((value, i) => {
        answerOrbs.push({ x: offsets[i].x, y: offsets[i].y, r: 38, value,
          correct: v2.isCorrect(value, problem.answer), explain: problem.explain, pulse: Math.random()*6 });
      });
`+source.slice(end);
// Replace only makeProblem's implementation, retaining its public call chain.
let ast=acorn.parse(source,{ecmaVersion:'latest',ranges:true});
let fn=ast.body.find(n=>n.type==='FunctionDeclaration'&&n.id.name==='makeProblem');
source=source.slice(0,fn.start)+'function makeProblem() { return v2.makeProblem(); }'+source.slice(fn.end);
const loopStart=source.indexOf('    function loop(now) {'),loopEnd=source.indexOf('    function quitGame()',loopStart);
source=source.slice(0,loopStart)+`    function loop(now) {
      accumulator += Math.min(100, now - last); last = now;
      while (accumulator >= 1000/60) {
        if (state.running && !state.paused) { clock += 1000/60; update(1000/60, gameNow()); }
        accumulator -= 1000/60;
      }
      draw(); requestAnimationFrame(loop);
    }
`+source.slice(loopEnd);
source='let clock = 0, accumulator = 0;\nfunction gameNow(){ return clock; }\n'+source;
ast=acorn.parse(source,{ecmaVersion:'latest',ranges:true});
const sm=scope.analyze(ast,{ecmaVersion:2022,sourceType:'script',optimistic:true});
const global=sm.globalScope,top=new Set(global.variables.map(v=>v.name));top.add('v2');
const refs=[];for(const s of sm.scopes)for(const ref of s.references)if(ref.resolved?.scope===global||(!ref.resolved&&ref.identifier.name==='v2'))refs.push(ref.identifier);
const groups={core:['gameNow','syncCanvasViewport','rand','randint','clamp','distance','worldToScreenX','worldToScreenY','isNearScreen','updateCamera','randomPointAroundPlayer','randomVisiblePoint','resetGame','update','loop','quitGame','returnToMainMenu'],entities:['spawnEnemy','spawnBoss','updatePet','petPosition','makeDecorations','makePortals','checkPortals','drawBackground','drawCutePlayer','drawEnemy','drawPet','drawMiniMap','draw'],combat:['spawnExpDrops','collectExpDrop','spawnItem','applyItem','shoot','fireLaser','fireBoomerang','fireChalkRain','burst','explode','expNeed','checkLevelUp','upgradeOptions','chooseUpgrade','giveChestReward'],math:['makeProblem','spawnQuiz','resolveAnswer'],ui:['stopJoystick','updateJoystick','stopDash','initAudio','setMuted','playTone','startPersistentMusic','sfx','showToast','scorePlus','unlockAchievement','createMission','updateMission','completeMission','updateMissionUI','openLevelUpPanel','updateWeaponInfo','endGame','updateBuffUI']};
const edits=[],names=[];
for(const node of ast.body.filter(n=>n.type==='VariableDeclaration'))for(const declaration of node.declarations){
 const name=declaration.id.name;if(!['MAPS','state','player','itemTypes'].includes(name))continue;
 let text=source.slice(declaration.init.start,declaration.init.end);
 if(name==='itemTypes'){
  const changes=refs.filter(id=>id.start>=declaration.init.start&&id.end<=declaration.init.end).map(id=>({start:id.start-declaration.init.start,end:id.end-declaration.init.start,text:'gameRuntime.'+id.name}));
  for(const c of changes.sort((a,b)=>b.start-a.start))text=text.slice(0,c.start)+c.text+text.slice(c.end);
  fs.writeFileSync('src/items.js',`// Original item registry, extracted without changing its rewards.\nexport function createItemTypes(gameRuntime){ return ${text}; }\n`);
  edits.push({start:node.start,end:node.end,text:'let itemTypes;'});
 }else{
  fs.writeFileSync('src/'+name+'.js',`${name==='state'?"import {MAPS} from './MAPS.js';\n":''}${name==='MAPS'?'export const MAPS = '+text+';':`export function create${name}(){ return ${text}; }`}\n`);
  edits.push({start:node.start,end:node.end,text:name==='MAPS'?'':`const ${name} = create${name}();`});
 }
}
for(const [group,list] of Object.entries(groups)){
 const funcs=ast.body.filter(n=>n.type==='FunctionDeclaration'&&list.includes(n.id.name));
 const chunks=funcs.map(n=>{
  names.push(n.id.name);let code=source.slice(n.start,n.end);
  const changes=refs.filter(id=>id.start>=n.start&&id.end<=n.end).map(id=>({start:id.start-n.start,end:id.end-n.start,text:'gameRuntime.'+id.name}));
  for(const c of changes.sort((a,b)=>b.start-a.start))code=code.slice(0,c.start)+c.text+code.slice(c.end);
  edits.push({start:n.start,end:n.end,text:`const ${n.id.name} = (...args) => systems.${n.id.name}(...args);`});return code;
 });
 fs.writeFileSync('src/'+group+'.js',`// Extracted from upstream. Cross-system state is supplied by the shared runtime.\nexport function createSystem(gameRuntime) {\n${chunks.join('\n\n')}\nreturn { ${funcs.map(n=>n.id.name).join(', ')} };\n}\n`);
}
for(const e of edits.sort((a,b)=>b.start-a.start))source=source.slice(0,e.start)+e.text+source.slice(e.end);
const variables=global.variables.filter(v=>v.defs[0]?.type==='Variable').map(v=>({name:v.name,mutable:v.defs[0].parent.kind==='let'}));
const accessors=[...variables.map(v=>`get ${v.name}(){return ${v.name};}${v.mutable?`, set ${v.name}(value){${v.name}=value;}`:''}`),...names.map(n=>`get ${n}(){return ${n};}`),'get v2(){return v2;}'];
const boot=`const runtime = { ${accessors.join(',\n')} };\nitemTypes = createItemTypes(runtime);\nconst v2 = createV2(runtime, curriculum);\n${Object.keys(groups).map(g=>`Object.assign(systems, create${g}(runtime));`).join('\n')}\nv2.mount();\nif(new URLSearchParams(location.search).has('qa')) window.__game = runtime;\n`;
source=source.replace('    document.getElementById("startBtn").addEventListener',boot+'\n    document.getElementById("startBtn").addEventListener');
const imports=Object.keys(groups).map(g=>`import {createSystem as create${g}} from './${g}.js';`).join('\n');
fs.writeFileSync('src/main.js',`${imports}\nimport {MAPS} from './MAPS.js';\nimport {createstate} from './state.js';\nimport {createplayer} from './player.js';\nimport {createItemTypes} from './items.js';\nimport {createV2} from './v2.js';\nconst response=await fetch(new URL('../data/curriculum.json', import.meta.url));\nif(!response.ok)throw new Error('문제 데이터 불러오기 실패');\nconst curriculum=await response.json();\nconst systems = {};\n${source}`);
let page=html.replace(/<style>[\s\S]*?<\/style>/,'<link rel="stylesheet" href="./src/original.css"><link rel="stylesheet" href="./src/v2.css">').replace(/<script>[\s\S]*?<\/script>/,'<script type="module" src="./src/main.js"></script>');
page=page.replace('<title>매쓰 서바이벌</title>','<title>매쓰 서바이벌 2.0</title>').replace('<h1>','<h1>').replace('매쓰 서바이벌</h1>','매쓰 서바이벌 <span class="edition">2.0</span></h1>');
page=page.replace('<div class="row">\n          <select id="difficulty">','<div id="v2Setup"></div><div class="row">\n          <select aria-label="전투 난이도" id="difficulty">');
page=page.replace('<div class="tabs">','<details class="originalHelp"><summary>🎮 조작·맵·아이템 안내</summary><div class="tabs">');
page=page.replace('<div id="v2Setup"></div>','</details><div id="v2Setup"></div>');
page=page.replace('이제 작은 화면 안에서만 움직이지 않습니다. 큰 월드를 돌아다니며 몬스터를 피하고, 맵·무기·아이템을 선택해 수학 문제를 풀며 성장하는 버전입니다.','수학으로 강해지는 나만의 모험. 정답 구슬을 찾고, 귀여운 친구와 함께 세 개의 월드를 탐험하세요.');
page=page.replace('하: 덧셈·뺄셈·구구단 중심','전투: 편안하게').replace('중: 곱셈·나눗셈·괄호 계산','전투: 보통').replace('상: 분수·소수·혼합계산','전투: 도전');
page=page.replace('<button id="restartBtn">','<div id="learningReport"></div><div class="exports"><button id="exportJSON">JSON 저장</button><button id="exportCSV">CSV 저장</button></div><button id="restartBtn">');
page=page.replace('<div id="dashBtn">대시</div>','<div id="dashBtn" role="button" aria-label="대시">대시</div><button id="skillBtn">특수 스킬 E</button><div id="playControls"><button id="pauseBtn">⏸ 일시정지</button><button id="playSound">🔊 소리</button></div><div id="answerAccess" aria-label="정답 구슬 접근 버튼"></div><div id="explanation" aria-live="polite"></div>');
fs.writeFileSync('index.html',page);
fs.writeFileSync('docs/extraction.json',JSON.stringify({source:'https://github.com/gmlduqzhd123-lab/ysschool/blob/main/public/apps/math-survival.html',groups},null,2));
console.log('Extracted',names.length,'original functions into',Object.keys(groups).length,'systems.');
