import test from 'node:test';import assert from 'node:assert/strict';
import {RewardLedger,energyReward,bossDamage} from '../src/v3/math-combat.js';
test('문항 보상은 인스턴스당 한 번이며 복습의 새 인스턴스는 허용',()=>{const l=new RewardLedger();assert(l.claim('a'));assert(!l.claim('a'));assert(l.claim('b'));assert(!l.claim(''));l.clear();assert(l.claim('a'));});
test('정답 에너지와 전투 경험치 분리·보스 보호막·오답 보상 없음',()=>{assert.equal(energyReward(false,5),0);assert.equal(energyReward(true),12);assert.equal(energyReward(true,5),22);assert.equal(bossDamage(100,50,3),90);assert.equal(bossDamage(10,100,1),1);assert.equal(bossDamage(10,100,0),-90);});
