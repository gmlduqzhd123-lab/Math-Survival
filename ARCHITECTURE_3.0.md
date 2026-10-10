# 매쓰 서바이벌 3.0 구조

## 기존 엔진 연동

`main.js`의 공유 런타임과 `core.js`의 고정 시간 업데이트·Canvas 렌더링을 유지한다. `v2.js`가 기존 학습 세션·저장·숙련도·문제 생성·보고서를 담당하고 `v3/index.js`가 전투 확장 모듈의 생명주기를 조합한다. 학습 엔진을 복제하지 않았다.

| 모듈 | 역할 |
|---|---|
| v3/performance.js | 공간 격자, 개체 풀, 경험치 보석 병합, 시간 웨이브, 성능 등급 |
| v3/survival.js · monsters.js | 10종 AI, 적/탄 풀, 화면 밖 갱신 축소, 개체 제한 |
| v3/weapons-data.js · weapons.js | 10종 신규 공격, 슬롯, 패시브, 진화 조합, 합체, 한계 돌파 |
| v3/math-combat.js | 정답 보상 원장, 수학 에너지, 보호막 피해 경로, 팝업 정지 |
| v3/content-data.js · content.js · graphics.js | 캐릭터, 펫, 월드, 보스 페이즈, 이벤트, SVG 캐시 |
| v3/progress.js · progress-ui.js | 별도 골드/해금/업적/게임 기록 저장·복원·HUD·음량 |
| v3/dungeon.js · music.js | 독립 방·벽 충돌·전환, 6개 원본 작곡과 음높이 |
| v3/modes.js | 신규 모드를 기존 학습 모드에 매핑, 제한 시간·성문·던전 보상 |
| v3/teacher.js | 허용 필드 과제 URL 검증, 기존 학습 schema2 결과 파일 집계 |

공격 피해는 `runtime.damageEnemy`/수학 보호막 경로로 전달한다. 치명타·프로젝타일·범위 공격 모두 실제 피해 판정을 사용한다. 개체 풀은 런 시작 때 초기화한다. 상자는 ID별, 학습 보상은 instanceId별, 게임 정산은 runId별로 중복을 막는다.

## 데이터 보존

- 원본 `original/index.html`과 `ysschool`은 수정하지 않았다. migrate 스크립트를 실행하지 않았다.
- 기존 `math-survival-2.learning.v2`, v1 이관·원문 백업·체크포인트 복구를 유지한다. `math-engine.js`와 `mastery.js`는 기존 코드다.
- 신규 게임 성장은 `math-survival-3.progress.v1`만 사용한다. 학습 저장/복원과 독립이며 손상된 게임 성장 원문은 자동으로 덮어쓰지 않는다.
- 기존 학습 schemaVersion 2의 mode는 survival/explore/boss를 유지하고 추가 gameMode 필드로 신규 모드를 표시한다.
- 학급 결과 합치기는 메모리에서만 처리하며 학습/성장 저장소에 기록하지 않는다.

## 성능과 정적 배포

128px 공간 격자로 주변 개체만 검색한다. 일반 적은 정상220/저사양90까지 생성하며 보스는 별도다. 풀 최대240, 적 탄100, 화면 밖 AI는100ms 간격이다. 경험치 보석은500ms마다 병합하며 가치 합을 보존한다. 투사체·파티클·문자·아이템·지속 효과를 제한하고 느린 프레임 비율에 따라 저사양으로 전환한다. 기존 배경 스프라이트 캐시와 약300만 backing pixel 상한을 유지한다. HUD는 바뀐 텍스트만 갱신한다.

`npm run build`는 src/data/icons를 상대 경로 정적 파일로 dist에 복사한다. 서비스 워커는 v3 캐시를 사용하고 앱 범위의 이전 캐시만 정리한다. 모듈·데이터·SVG를 사전 캐시하며 학습 localStorage를 건드리지 않는다. GitHub Pages의 `/Math-Survival/` 경로에서 실행한다. 개발 HTTP 미리보기 이외의 서버나 DB는 없다.

## 검증의 한계

자동 브라우저는 Chromium 및 WebKit의 지정 viewport/touch 환경이다. 실제 Android/iOS 하드웨어를 의미하지 않는다. 30분 검사는 불사·경험치 억제 조건의 가속 부하 시뮬레이션이며 자연스러운 30분 밸런스 검증과 다르다. 음악은 원본 WebAudio 작곡이며 녹음 음원·실시간 학급 서비스·원격 순위표는 구현하지 않았다.
