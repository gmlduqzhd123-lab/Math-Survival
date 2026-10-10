import {NEW_CHARACTERS,NEW_WORLDS} from './v3/content-data.js';
import {NEW_WEAPONS} from './v3/weapons-data.js';
export function availableUnits(config, curriculum) {
  const grade = curriculum.grades.find(g => g.grade === Number(config.grade));
  return (grade?.units || []).filter(u => (config.domain === 'all' || u.domain === config.domain) && (config.unit === 'all' || u.id === config.unit));
}
export function validateConfig(config, curriculum) {
  const errors = [];
  if (!curriculum.grades.some(g => g.grade === config.grade)) errors.push('학년을 선택하세요.');
  if (config.domain !== 'all' && !Object.hasOwn(curriculum.domains, config.domain)) errors.push('지원하지 않는 학습 영역입니다.');
  const units = availableUnits(config, curriculum);
  if (!units.length) errors.push('선택한 학년·영역·단원은 준비 중입니다. 다른 지원 범위를 선택하세요.');
  if (!Number.isInteger(config.level) || config.level < 1 || config.level > 5 || config.unit !== 'all' && units.some(u => u.supportedLevels && !u.supportedLevels.includes(config.level))) errors.push('선택 범위에서 지원하는 수학 단계를 선택하세요.');
  if(config.gameMode!=null&&!['survival','explore','boss','timed','defense','dungeon','endless','daily'].includes(config.gameMode))errors.push('지원하지 않는 게임 모드입니다.');
  if(config.gameMode==='timed'&&![8,15,20,30].includes(config.duration))errors.push('지원하는 생존 시간을 선택하세요.');
  if (!['survival','explore','boss'].includes(config.mode)) errors.push('지원하지 않는 모드입니다.');
  if (config.map != null && !['forest','desert','library',...Object.keys(NEW_WORLDS)].includes(config.map) || config.combat != null && !['easy','normal','hard'].includes(config.combat)) errors.push('맵과 전투 난이도를 다시 선택하세요.');
  if (!['explorer','mage','guardian',...Object.keys(NEW_CHARACTERS)].includes(config.character) || !['storm','compass','fraction','lightning',...Object.keys(NEW_WEAPONS)].includes(config.weapon)) errors.push('캐릭터와 무기를 다시 선택하세요.');
  if (config.mode === 'explore') {
    if (!Number.isInteger(config.target) || config.target < 1 || config.target > 100) errors.push('목표는 1~100의 정수로 입력하세요.');
    if (config.limit !== 0 && (!Number.isInteger(config.limit) || config.limit < 30 || config.limit > 1800)) errors.push('제한 시간은 무제한(0) 또는 30~1800초의 정수로 입력하세요.');
  }
  return errors;
}
export function validateCurriculum(data) {
  if (!data || !data.domains || !Array.isArray(data.grades) || data.grades.length !== 6) throw Error('학년 데이터 형식이 올바르지 않습니다.');
  const ids = new Set();
  for (const grade of data.grades) {
    if (!Number.isInteger(grade.grade) || !Array.isArray(grade.units)) throw Error('학년/단원 형식 오류');
    for (const unit of grade.units) {
      if (!unit.id || ids.has(unit.id) || !unit.type || !data.domains[unit.domain] || !Array.isArray(unit.supportedLevels) || !unit.supportedLevels.length || !unit.policy?.levels || unit.supportedLevels.some(l=>!Number.isInteger(l)||l<1||l>5||!unit.policy.levels[l])) throw Error('단원 데이터 형식 오류');
      ids.add(unit.id);
    }
  }
  return data;
}
