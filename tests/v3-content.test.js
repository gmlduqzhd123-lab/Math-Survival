import test from 'node:test';import assert from 'node:assert/strict';
import {NEW_CHARACTERS,PETS,NEW_WORLDS,BOSSES,phaseFor} from '../src/v3/content-data.js';
import {CHARACTERS} from '../src/combat-v2.js';import {MAPS} from '../src/MAPS.js';
test('10 캐릭터·8 펫·6 월드와 보스 데이터 및 3페이즈',()=>{assert.equal(Object.keys(CHARACTERS).length,10);assert.equal(Object.keys(PETS).length,8);assert.equal(Object.keys(MAPS).length,6);assert.equal(Object.keys(BOSSES).length,6);for(const c of Object.values(NEW_CHARACTERS))assert(c.weapon&&c.skill&&c.hp>0);assert.equal(phaseFor(1),1);assert.equal(phaseFor(.5),2);assert.equal(phaseFor(.1),3);});
