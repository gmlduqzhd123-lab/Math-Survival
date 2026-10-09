# 단계별 구현·검증 보고 · 2026-10-09

각 단계의 현재 동작을 원본 실행 검사와 2.0 통합 회귀로 확인했습니다. 아래 파일 목록은 주요 수정/추가 파일입니다. 별도의 단계별 배포를 실행한 것으로 해석하지 않습니다.

## Phase 1 · 원본 독립 실행

- 구현: 비어 있는 현재 작업 폴더 및 Git 원격 없음 확인. 별도 `Math-Survival-2/` 생성. 원본을 읽기 전용으로 다운로드하고 실행본 보존. 원본 core 기능을 변경 전에 실행 검사.
- 파일: `original/index.html`, 최초 복사본 `index.html`, `scripts/serve.cjs`, `tests/baseline.cjs`, `docs/baseline-results.json`, `docs/ORIGIN.md`.
- 재사용: 원본 HTML·CSS·Canvas 엔진 전체, makeProblem/spawnQuiz/resolveAnswer/spawnEnemy/spawnBoss/shoot/upgradeOptions/update/draw/loop/resetGame/returnToMainMenu.
- 검사: Edge 17개 모두 통과. 이동·자동 공격·충돌·체력·EXP·레벨업·구슬 4개·정답/오답·콤보·보스·강화·아이템·사운드 초기화·종료·재시작.
- 발견: 펫 투사체 이동 누락, 벽시계 타이머의 일시정지 소모, 포털 렌더링의 자석 효과 의존.
- 남은 작업: 원본 검사의 터치는 DOM 존재 검사였으므로 Phase 5에서 실제 브라우저 터치 입력 수행. 음악의 청취 검사는 미수행.

## Phase 2 · 구조 개선·회귀

- 구현: 범위 분석 기반 추출, 공유 런타임 getter/setter로 상태·배열 재할당 보존. 원본 함수 66개와 추가 시계 함수 1개를 5개 ES Module 시스템에 배치. 상태/맵/플레이어/아이템 초기 데이터 추가 분리.
- 파일: `scripts/migrate.cjs`, `src/main.js`, `core.js`, `entities.js`, `combat.js`, `math.js`, `ui.js`, `state.js`, `player.js`, `MAPS.js`, `items.js`, `original.css`, `docs/SOURCE_ANALYSIS.md`, `docs/extraction.json`.
- 재사용: update/draw/loop/resetGame/returnToMainMenu, camera/world 변환, 원본 몬스터·펫·강화·드롭·미션·오디오 함수.
- 검사: 실제 브라우저 모듈 로딩·원본 전투/아이템/펫/EXP/레벨업 회귀·10회 재시작·타이머/이벤트/루프 중복 방지 통과.
- 발견/수정: 추출 런타임 이름이 원본 지역 변수 r과 충돌한 초기 오류 수정. 게임 시계 고정/60Hz 업데이트, 펫 이동, 큐 setTimeout 제거.
- 남은 작업: 구조 분리의 검증은 최종 통합본 기준. 더 큰 프레임워크 도입 없음.

## Phase 3 · 수학 문제

- 구현: 1~6학년, 29개 연습 단원, 영역·단원 선택, 1~5단계, 별도 전투 난이도, 자동 난이도, 정답 유일성, 해설, 취약 재출제, 최근 기록 반영. 유리수/단위 정규화. 대표 145문항 JSON.
- 파일: `data/curriculum.json`, `data/question-bank.json`, `src/math-engine.js`, `src/math.js`, `src/v2.js`, `tests/math.test.js`, `scripts/question-bank.mjs`, `docs/math-tests.tap`.
- 재사용: spawnQuiz/resolveAnswer가 원본 정답 보상·오답 피해·EXP·콤보·미션·레벨업을 계속 처리. makeProblem 연결부만 신규 생성기 사용.
- 검사: 29단원 × 5단계 × 100개 = 14,500개 문항과 대표 145문항의 독립 계산/정답 유일성/선택지 동치 검사. 분수·소수·단위·난이도 검사를 포함한 총 34 테스트 통과.
- 발견/수정: 정답 구슬의 상시 색 노출 제거. 생성 오답이 모두 정답보다 큰 편향 제거. 분수 분자만/소수 10배 답 대신 실제 값 사용.
- 남은 작업: 데이터는 선택된 연습 단원의 범위. 전국 모든 교과서 단원 완전 수록·교육 전문가 감수는 미수행.

## Phase 4 · 캐릭터·전투·보스

- 구현: 탐험가/마법사/수호자의 능력·외형 색·스킬. 신규 무기 4종·강화·진화. 맵별 배경·장식·몬스터 색·효과. 세 보스 각 공격 2종과 1.25초 예고·피해·체력·보상.
- 파일: `src/combat-v2.js`, `src/v2.js`, `src/entities.js`, `src/combat.js`, `src/MAPS.js`, `tests/browser.cjs`.
- 재사용: spawnBoss/spawnEnemy/shoot/fireLaser/fireBoomerang/fireChalkRain/updatePet/explode/upgradeOptions/chooseUpgrade/원본 처치 보상.
- 검사: 캐릭터 3종·고유 스킬·전투/수학 분리, 신규 4무기 Lv.3/5콤보 진화·공격, 보스 3종 각 2패턴·예고/충돌·보상·3연전 완료 통과.
- 발견/수정: 신규 렌더러가 메뉴에서 미초기화 무기를 읽던 초기 오류 수정. 원본 포털을 일반 렌더링으로 이동.
- 남은 작업: 전투 밸런스는 설정된 수치와 기능 검사 기준. 교실 장시간 플레이를 통한 난이도 조정은 미수행.

## Phase 5 · UI·모바일

- 구현: 밝은 판타지 메뉴·캐릭터 카드·분리된 HUD/문제/컨트롤. 원본 조이스틱 유지, 대시/특수 스킬/일시정지/음소거, 글자 크기, 감소 모션·저사양 옵션. 탭 숨김 자동 정지, 구슬 이동 버튼, 가로 화면 전용 Canvas 비율.
- 파일: `index.html`, `src/v2.css`, `src/v2.js`, `src/core.js`, `src/main.js`, `src/entities.js`, `tests/browser.cjs`, `docs/*-menu.png`, `docs/*-play.png`, `docs/mobile-landscape.png`.
- 재사용: updateJoystick/stopJoystick/stopDash/원본 터치 리스너·P 정지·AudioContext.
- 검사: 키보드 이동·대시·스킬, 뷰포트 변경, 맵 경계 구슬 중복 방지, 390×844 터치 이동·해제·취소·대시·스킬, 핵심 HUD 경계/겹침, 모바일 가로 모드, 설정 기능 통과. 캡처를 열어 시각 확인.
- 발견/수정: 프레임 사이에 끝나는 짧은 대시 입력 누락 수정. 테스트는 입력 직후 시뮬레이션 프레임 반영을 기다리도록 정리.
- 남은 작업: 실제 휴대폰·태블릿·iOS Safari에서의 사용자 조작 검사는 미수행. 오디오 청취 미수행.

## Phase 6 · 분석·교사 설정

- 구현: 탐험의 교사 학년·단원·목표·시간, 몬스터 없는 문제 모드. 정답/오답·영역별 정답률·취약/복습 해설·점수·생존·레벨·처치·콤보. 최근 100회 익명 브라우저 저장. JSON/CSV 다운로드. 제한 시간과 목표 달성을 구분한 결과.
- 파일: `src/learning.js`, `src/v2.js`, `index.html`, `src/v2.css`, `tests/math.test.js`, `tests/browser.cjs`, `docs/desktop-results.png`, `docs/math-survival-2026-10-08.json`, `docs/math-survival-2026-10-08.csv`.
- 재사용: 원본 endGame/resetGame/resolveAnswer 결과와 UI 전환.
- 검사: 탐험 목표 달성·시간 종료, 브라우저 새로고침 기록 유지, 영역 집계·CSV 인용·저장 제한 처리, 실제 JSON/CSV 다운로드 통과. 내보내기 증거 파일은 자동 테스트 데이터이며 학생 기록 아님.
- 발견/수정: 마지막 응답이 레벨업을 일으키더라도 목표 달성 결과가 즉시 나오도록 후처리 추가.
- 남은 작업: 브라우저 간 동기화·서버 저장은 요구사항에 따라 없음.

## Phase 7 · 최종 검증·배포 준비

- 구현: 실행 가능한 전체 소스, README·CHANGELOG·원본 비교표, 테스트, 정적 dist 빌드, 수동 Pages 워크플로 준비.
- 파일: `README.md`, `CHANGELOG.md`, `package.json`, `package-lock.json`, `.gitignore`, `.github/workflows/pages.yml`, `scripts/build.mjs`, `docs/COMPARISON.md`, `docs/PHASE_REPORT.md`, `docs/browser-results.json`.
- 재사용: 모든 원본 게임 시스템을 포함한 최종 모듈과 2.0 확장.
- 검사: 원본 17/17, 자동 34/34, 2.0 Edge 브라우저 21/21, 브라우저 오류/정적 자원 4xx 0. 독립 dist 하위 경로 실행 검사 결과는 `static-build-results.json`.
- 발견: 원본 코드에서 확인한 게임 오류와 작업 중 초기화/추출 오류는 회귀 검사 후 수정 완료. 현재 자동 검사 실패 없음.
- 남은 작업: 사용자 명시적 승인 후 **새 저장소 생성·원격 푸시·실제 Pages 배포**. 워크플로의 GitHub 실행과 실제 배포 URL 검증은 배포 이후 수행. 원본 저장소 변경은 필요 없음.
