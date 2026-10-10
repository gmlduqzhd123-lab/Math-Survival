import {createSystem as createcore} from './core.js';
import {createSystem as createentities} from './entities.js';
import {createSystem as createcombat} from './combat.js';
import {createSystem as createmath} from './math.js';
import {createSystem as createui} from './ui.js';
import {MAPS} from './MAPS.js';
import {createstate} from './state.js';
import {createplayer} from './player.js';
import {createItemTypes} from './items.js';
import {createV2} from './v2.js';
import {validateCurriculum} from './configuration.js';
import {installInput} from './input.js';
import {loadSprites,spriteStatus} from './sprites.js';
const loading=document.createElement('section');loading.id='loadingPanel';loading.innerHTML='<p id="loadMessage" role="status">학습 데이터를 불러오는 중입니다.</p><button id="retryLoad" hidden>다시 불러오기</button>';document.body.append(loading);
let initialized=false,loadingNow=false;
async function boot(){if(initialized||loadingNow)return;loadingNow=true;document.getElementById('startBtn').disabled=true;document.getElementById('retryLoad').hidden=true;
 try{const response=await fetch(new URL('../data/curriculum.json',import.meta.url));if(!response.ok)throw new Error('HTTP '+response.status);const data=validateCurriculum(await response.json());initialize(data);initialized=true;loading.remove();window.dispatchEvent(new Event('math-game-ready'));}
 catch(e){document.getElementById('loadMessage').textContent='학습 데이터를 불러오지 못했습니다. '+e.message;document.getElementById('retryLoad').hidden=false;window.dispatchEvent(new CustomEvent('math-game-load-error',{detail:e.message}));}
 finally{loadingNow=false;}}
document.getElementById('retryLoad').addEventListener('click',boot);boot();
function initialize(curriculum){
const systems = {};
let clock = 0, accumulator = 0;
const gameNow = (...args) => systems.gameNow(...args);

    const surface = document.getElementById("game");
    const viewport={width:1000,height:650,dpr:1,scale:1};
    const canvas={get width(){return viewport.width;},get height(){return viewport.height;}};
    const ctx = surface.getContext("2d", {alpha:false});
    const sprites={ready:loadSprites(),status:spriteStatus};

    const syncCanvasViewport = (...args) => systems.syncCanvasViewport(...args);

    const hud = document.getElementById("hud");
    const hpEl = document.getElementById("hp");
    const scoreEl = document.getElementById("score");
    const levelEl = document.getElementById("level");
    const expEl = document.getElementById("exp");
    const weaponLevelEl = document.getElementById("weaponLevel");
    const comboEl = document.getElementById("combo");
    const shieldEl = document.getElementById("shield");
    const timeEl = document.getElementById("time");
    const startPanel = document.getElementById("startPanel");
    const gameOverPanel = document.getElementById("gameOverPanel");
    const questionBox = document.getElementById("questionBox");
    const questionText = document.getElementById("questionText");
    const questionSub = document.getElementById("questionSub");
    const toast = document.getElementById("toast");
    const difficultyEl = document.getElementById("difficulty");
    const mapSelect = document.getElementById("mapSelect");
    const muteBtn = document.getElementById("muteBtn");
    const musicBtn = document.getElementById("musicBtn");
    const mainMenuBtn = document.getElementById("mainMenuBtn");
    const quitGameBtn = document.getElementById("quitGameBtn");
    const activeItems = document.getElementById("activeItems");
    const weaponInfo = document.getElementById("weaponInfo");
    const missionInfo = document.getElementById("missionInfo");
    const achievementPop = document.getElementById("achievementPop");
    const levelUpPanel = document.getElementById("levelUpPanel");
    const upgradeChoices = document.getElementById("upgradeChoices");

    const joystickZone = document.getElementById("joystickZone");
    const joystickStick = document.getElementById("joystickStick");
    const dashBtn = document.getElementById("dashBtn");

    let isJoystickActive = false;
    let joystickCenter = { x: 0, y: 0 };
    let joystickDelta = { x: 0, y: 0 };

    const stopJoystick = (...args) => systems.stopJoystick(...args);


    const updateJoystick = (...args) => systems.updateJoystick(...args);

    const stopDash = (...args) => systems.stopDash(...args);

    const keys = {};
    let muted = false;
    let audioReady = false;
    let audioCtx, masterGain, musicGain, sfxGain, musicTimer;



    const state = createstate();

    const player = createplayer();

    let enemies = [];
    let projectiles = [];
    let particles = [];
    let answerOrbs = [];
    let items = [];
    let expDrops = [];
    let floatingTexts = [];
    let decorations = [];
    let stars = [];
    let portals = [];

    let itemTypes;

    const rand = (...args) => systems.rand(...args);
    const randint = (...args) => systems.randint(...args);
    const clamp = (...args) => systems.clamp(...args);
    const distance = (...args) => systems.distance(...args);

    const initAudio = (...args) => systems.initAudio(...args);

    const setMuted = (...args) => systems.setMuted(...args);

    const playTone = (...args) => systems.playTone(...args);

    const startPersistentMusic = (...args) => systems.startPersistentMusic(...args);

    const sfx = (...args) => systems.sfx(...args);

    const showToast = (...args) => systems.showToast(...args);

    const scorePlus = (...args) => systems.scorePlus(...args);


    const unlockAchievement = (...args) => systems.unlockAchievement(...args);

    const giveChestReward = (...args) => systems.giveChestReward(...args);

    const createMission = (...args) => systems.createMission(...args);

    const updateMission = (...args) => systems.updateMission(...args);

    const completeMission = (...args) => systems.completeMission(...args);

    const updateMissionUI = (...args) => systems.updateMissionUI(...args);

    const makePortals = (...args) => systems.makePortals(...args);

    const checkPortals = (...args) => systems.checkPortals(...args);

    const spawnBoss = (...args) => systems.spawnBoss(...args);

    const updatePet = (...args) => systems.updatePet(...args);

    const petPosition = (...args) => systems.petPosition(...args);

    const makeDecorations = (...args) => systems.makeDecorations(...args);

    const worldToScreenX = (...args) => systems.worldToScreenX(...args);
    const worldToScreenY = (...args) => systems.worldToScreenY(...args);
    const isNearScreen = (...args) => systems.isNearScreen(...args);

    const updateCamera = (...args) => systems.updateCamera(...args);

    const randomPointAroundPlayer = (...args) => systems.randomPointAroundPlayer(...args);

    const randomVisiblePoint = (...args) => systems.randomVisiblePoint(...args);

    const makeProblem = (...args) => systems.makeProblem(...args);

    const spawnQuiz = (...args) => systems.spawnQuiz(...args);

    const resolveAnswer = (...args) => systems.resolveAnswer(...args);

    const expNeed = (...args) => systems.expNeed(...args);

    const checkLevelUp = (...args) => systems.checkLevelUp(...args);

    const upgradeOptions = (...args) => systems.upgradeOptions(...args);

    const openLevelUpPanel = (...args) => systems.openLevelUpPanel(...args);

    const chooseUpgrade = (...args) => systems.chooseUpgrade(...args);

    const updateWeaponInfo = (...args) => systems.updateWeaponInfo(...args);

    const spawnEnemy = (...args) => systems.spawnEnemy(...args);


    const spawnExpDrops = (...args) => systems.spawnExpDrops(...args);

    const collectExpDrop = (...args) => systems.collectExpDrop(...args);

    const spawnItem = (...args) => systems.spawnItem(...args);

    const applyItem = (...args) => systems.applyItem(...args);

    const shoot = (...args) => systems.shoot(...args);

    const fireLaser = (...args) => systems.fireLaser(...args);

    const fireBoomerang = (...args) => systems.fireBoomerang(...args);

    const fireChalkRain = (...args) => systems.fireChalkRain(...args);

    const burst = (...args) => systems.burst(...args);

    const explode = (...args) => systems.explode(...args);

    const resetGame = (...args) => systems.resetGame(...args);

    const endGame = (...args) => systems.endGame(...args);

    const updateBuffUI = (...args) => systems.updateBuffUI(...args);

    const update = (...args) => systems.update(...args);

    const drawBackground = (...args) => systems.drawBackground(...args);

    const drawCutePlayer = (...args) => systems.drawCutePlayer(...args);

    const drawEnemy = (...args) => systems.drawEnemy(...args);


    const drawPet = (...args) => systems.drawPet(...args);


    const drawMiniMap = (...args) => systems.drawMiniMap(...args);

    const draw = (...args) => systems.draw(...args);

    let last = performance.now();
    const loop = (...args) => systems.loop(...args);
    const quitGame = (...args) => systems.quitGame(...args);

    const returnToMainMenu = (...args) => systems.returnToMainMenu(...args);

const runtime = { damageEnemy(e,amount){if(runtime.v3)runtime.v3.math.damage(e,amount);else e.hp-=amount;}, get clock(){return clock;}, set clock(value){clock=value;},
get accumulator(){return accumulator;}, set accumulator(value){accumulator=value;},
get canvas(){return canvas;}, get surface(){return surface;}, get viewport(){return viewport;},
get ctx(){return ctx;},
get hud(){return hud;},
get hpEl(){return hpEl;},
get scoreEl(){return scoreEl;},
get levelEl(){return levelEl;},
get expEl(){return expEl;},
get weaponLevelEl(){return weaponLevelEl;},
get comboEl(){return comboEl;},
get shieldEl(){return shieldEl;},
get timeEl(){return timeEl;},
get startPanel(){return startPanel;},
get gameOverPanel(){return gameOverPanel;},
get questionBox(){return questionBox;},
get questionText(){return questionText;},
get questionSub(){return questionSub;},
get toast(){return toast;},
get difficultyEl(){return difficultyEl;},
get mapSelect(){return mapSelect;},
get muteBtn(){return muteBtn;},
get musicBtn(){return musicBtn;},
get mainMenuBtn(){return mainMenuBtn;},
get quitGameBtn(){return quitGameBtn;},
get activeItems(){return activeItems;},
get weaponInfo(){return weaponInfo;},
get missionInfo(){return missionInfo;},
get achievementPop(){return achievementPop;},
get levelUpPanel(){return levelUpPanel;},
get upgradeChoices(){return upgradeChoices;},
get joystickZone(){return joystickZone;},
get joystickStick(){return joystickStick;},
get dashBtn(){return dashBtn;},
get isJoystickActive(){return isJoystickActive;}, set isJoystickActive(value){isJoystickActive=value;},
get joystickCenter(){return joystickCenter;}, set joystickCenter(value){joystickCenter=value;},
get joystickDelta(){return joystickDelta;}, set joystickDelta(value){joystickDelta=value;},
get keys(){return keys;},
get muted(){return muted;}, set muted(value){muted=value;},
get audioReady(){return audioReady;}, set audioReady(value){audioReady=value;},
get audioCtx(){return audioCtx;}, set audioCtx(value){audioCtx=value;},
get masterGain(){return masterGain;}, set masterGain(value){masterGain=value;},
get musicGain(){return musicGain;}, set musicGain(value){musicGain=value;},
get sfxGain(){return sfxGain;}, set sfxGain(value){sfxGain=value;},
get musicTimer(){return musicTimer;}, set musicTimer(value){musicTimer=value;},
get MAPS(){return MAPS;},
get state(){return state;},
get player(){return player;},
get enemies(){return enemies;}, set enemies(value){enemies=value;},
get projectiles(){return projectiles;}, set projectiles(value){projectiles=value;},
get particles(){return particles;}, set particles(value){particles=value;},
get answerOrbs(){return answerOrbs;}, set answerOrbs(value){answerOrbs=value;},
get items(){return items;}, set items(value){items=value;},
get expDrops(){return expDrops;}, set expDrops(value){expDrops=value;},
get floatingTexts(){return floatingTexts;}, set floatingTexts(value){floatingTexts=value;},
get decorations(){return decorations;}, set decorations(value){decorations=value;},
get stars(){return stars;}, set stars(value){stars=value;},
get portals(){return portals;}, set portals(value){portals=value;},
get itemTypes(){return itemTypes;},
get last(){return last;}, set last(value){last=value;},
get gameNow(){return gameNow;},
get syncCanvasViewport(){return syncCanvasViewport;},
get rand(){return rand;},
get randint(){return randint;},
get clamp(){return clamp;},
get distance(){return distance;},
get worldToScreenX(){return worldToScreenX;},
get worldToScreenY(){return worldToScreenY;},
get isNearScreen(){return isNearScreen;},
get updateCamera(){return updateCamera;},
get randomPointAroundPlayer(){return randomPointAroundPlayer;},
get randomVisiblePoint(){return randomVisiblePoint;},
get resetGame(){return resetGame;},
get update(){return update;},
get loop(){return loop;},
get quitGame(){return quitGame;},
get returnToMainMenu(){return returnToMainMenu;},
get makePortals(){return makePortals;},
get checkPortals(){return checkPortals;},
get spawnBoss(){return spawnBoss;},
get updatePet(){return updatePet;},
get petPosition(){return petPosition;},
get makeDecorations(){return makeDecorations;},
get spawnEnemy(){return spawnEnemy;},
get drawBackground(){return drawBackground;},
get drawCutePlayer(){return drawCutePlayer;},
get drawEnemy(){return drawEnemy;},
get drawPet(){return drawPet;},
get drawMiniMap(){return drawMiniMap;},
get draw(){return draw;},
get giveChestReward(){return giveChestReward;},
get expNeed(){return expNeed;},
get checkLevelUp(){return checkLevelUp;},
get upgradeOptions(){return upgradeOptions;},
get chooseUpgrade(){return chooseUpgrade;},
get spawnExpDrops(){return spawnExpDrops;},
get collectExpDrop(){return collectExpDrop;},
get spawnItem(){return spawnItem;},
get applyItem(){return applyItem;},
get shoot(){return shoot;},
get fireLaser(){return fireLaser;},
get fireBoomerang(){return fireBoomerang;},
get fireChalkRain(){return fireChalkRain;},
get burst(){return burst;},
get explode(){return explode;},
get makeProblem(){return makeProblem;},
get spawnQuiz(){return spawnQuiz;},
get resolveAnswer(){return resolveAnswer;},
get stopJoystick(){return stopJoystick;},
get updateJoystick(){return updateJoystick;},
get stopDash(){return stopDash;},
get initAudio(){return initAudio;},
get setMuted(){return setMuted;},
get playTone(){return playTone;},
get startPersistentMusic(){return startPersistentMusic;},
get sfx(){return sfx;},
get showToast(){return showToast;},
get scorePlus(){return scorePlus;},
get unlockAchievement(){return unlockAchievement;},
get createMission(){return createMission;},
get updateMission(){return updateMission;},
get completeMission(){return completeMission;},
get updateMissionUI(){return updateMissionUI;},
get openLevelUpPanel(){return openLevelUpPanel;},
get updateWeaponInfo(){return updateWeaponInfo;},
get endGame(){return endGame;},
get updateBuffUI(){return updateBuffUI;},
get sprites(){return sprites;},
get v2(){return v2;} };
itemTypes = createItemTypes(runtime);
const v2 = createV2(runtime, curriculum);
Object.assign(systems, createcore(runtime));
Object.assign(systems, createentities(runtime));
Object.assign(systems, createcombat(runtime));
Object.assign(systems, createmath(runtime));
Object.assign(systems, createui(runtime));
v2.mount();
const input=installInput(runtime);
v2.setInput(input);
if(new URLSearchParams(location.search).has('qa')) window.__game = runtime;

    document.getElementById("startBtn").addEventListener("click", () => {if(v2.validate()) resetGame();});
    document.getElementById("restartBtn").addEventListener("click", resetGame);
    mainMenuBtn.addEventListener("click", returnToMainMenu);
    quitGameBtn.addEventListener("click", quitGame);
    document.getElementById("toStartBtn").addEventListener("click", () => {
      gameOverPanel.classList.add("hidden");
      mainMenuBtn.classList.add("hidden");
      quitGameBtn.classList.add("hidden");
      startPanel.classList.remove("hidden");
      initAudio();
    });

    muteBtn.addEventListener("click", () => { initAudio(); setMuted(!muted); });
    musicBtn.addEventListener("click", () => { initAudio(); setMuted(!muted); });

    window.addEventListener("resize", () => {
      if (syncCanvasViewport()) {
        updateCamera();v2.reposition();input.clear();
      }
    });

    document.fonts?.ready.then(()=>{for(const orb of answerOrbs)orb.labelKey=null;});
    syncCanvasViewport();
    makeDecorations();
    updateCamera();
    requestAnimationFrame(loop);
    new ResizeObserver(()=>{if(syncCanvasViewport()){updateCamera();v2.reposition();input.clear();}}).observe(surface.parentElement);
}
