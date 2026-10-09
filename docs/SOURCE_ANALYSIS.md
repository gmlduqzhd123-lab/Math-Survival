# 실제 원본 분석

원본은 약 3,000행의 HTML/CSS/Vanilla JavaScript 파일이며 Canvas 1000×650(모바일 1000×820)을 사용합니다. DOM 참조·키보드/터치 입력, 세 맵 정의, `state`·`player`·배열, 아이템 레지스트리, 오디오, 게임 시스템, RAF 루프 순서로 구성되어 있습니다.

## 호출 관계

```mermaid
flowchart TD
  start[start/restart 클릭] --> reset[resetGame]
  reset --> setup[맵·상태·플레이어·배열 초기화]
  reset --> deco[makeDecorations / makePortals / createMission]
  raf[requestAnimationFrame] --> loop[loop]
  loop --> update[update]
  loop --> draw[draw]
  update --> move[입력 이동·대시·updateCamera·checkPortals]
  update --> enemies[spawnEnemy / spawnBoss]
  update --> quiz[spawnQuiz]
  quiz --> problem[makeProblem]
  update --> attacks[shoot / fireLaser / fireBoomerang / fireChalkRain / updatePet]
  update --> collide[탄환·적·플레이어 충돌]
  collide --> drops[spawnExpDrops / spawnItem]
  update --> pickups[collectExpDrop / applyItem / resolveAnswer]
  pickups --> level[checkLevelUp]
  level --> cards[openLevelUpPanel / upgradeOptions]
  cards --> choose[chooseUpgrade]
  update --> end[endGame]
  menu[메뉴 클릭·Escape] --> return[returnToMainMenu]
  quit[종료 클릭·Q] --> end
```

## 상태와 의존성

- `state`: running/paused, 맵·월드/카메라, HP/EXP/level/score/time/combo, 정답/오답, 무기 레벨과 공격 타이머, 버프 만료 시각, 미션/업적, 보스 순서, 성장 카드 큐.
- `player`: 월드 좌표, 반경, 이동 속도, 대시 재사용 시간, 무적 시간, 눈 깜박임 상태.
- `enemies`, `projectiles`, `answerOrbs`, `items`, `expDrops`, `particles`, `floatingTexts`, `decorations`, `stars`, `portals`: 여러 시스템이 공유하고 필터링·재할당하는 배열.
- `makeProblem → spawnQuiz → resolveAnswer`: 문제의 answer/options/explain과 정답 구슬을 연결. resolveAnswer가 점수·EXP·체력·콤보·버프와 레벨업을 변경.
- `spawnEnemy`와 `spawnBoss`: 월드 좌표 객체를 만들고 update가 추적 이동·접촉 피해·처치 보상을 처리. 원본 보스의 고유 패턴은 없고 접촉 공격만 존재.
- `shoot`, 원본 추가 무기, 펫: 같은 projectiles를 공유. 기존 마법구·레이저·부메랑 칠판·분필 비·회전 위성 강화와 펫 공격 유지.
- `upgradeOptions → chooseUpgrade`: 현재 상태를 캡처하는 apply 콜백으로 원본 능력치를 수정. 따라서 전역 이름만 분리하면 상태가 끊어지므로 공유 런타임 getter/setter로 원본 배열 재할당을 보존.
- `draw`: 월드 좌표를 카메라 좌표로 변환하고 배경·아이템·구슬·적·투사체·펫·플레이어·미니맵 렌더링. DOM HUD는 update에서 갱신.
- `resetGame`: 음악 초기화, 맵 선택, 능력·타이머·배열과 UI 초기화. `returnToMainMenu`는 전투를 멈추고 배열을 비움. 원본 배경 음악은 메인 메뉴에서도 유지.

## 원본에서 확인한 문제와 보완

| 실제 코드 | 영향 | 2.0 처리 |
|---|---|---|
| 펫 투사체 생성 kind는 pet, 이동 조건은 orb/chalk만 포함 | 펫 탄환 정지·잔류 | pet도 이동과 생명 감소에 포함 |
| performance.now 기반 버프/공격 만료 | pause 동안 버프 소모 | 정지 가능한 게임 시계 |
| 프레임당 고정 이동/피해 | 주사율에 따라 속도 차이 | 60Hz 고정 시뮬레이션 |
| 레벨업 큐의 setTimeout | 메뉴/재시작 뒤 이전 콜백 위험 | 즉시 큐 처리 |
| 정답/오답 구슬을 항상 녹색/빨강으로 표시 | 문제를 풀지 않고 정답 발견 | 모두 파랑, 노트 아이템만 정답 힌트 |
| 개별 구슬 좌표를 맵 경계에 clamp | 끝에서 여러 구슬 중첩 가능 | 배치 중심을 clamp한 네 좌표 |
| 포털 그리기 블록이 magnetUntil 조건 안에 있음 | 자석 없을 때 포털이 보이지 않음 | 매 프레임 일반 렌더링 |

2.0 기능별 추출 위치는 `extraction.json`의 실제 함수 목록으로 확인할 수 있습니다. 원본 함수 몸체를 추출한 뒤 위 오류와 명시된 확장 부분만 수정했습니다.
