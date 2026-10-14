# 2026-10-15 게임·모바일 재점검

현재 배포본의 문제 글자 확대·새 문제 알림까지 동기화한 소스로 검사했다. 원본 `original/index.html`, 기존 학습·성장 기록 형식 및 Supabase 작업은 변경하지 않았다.

## 발견·수정

오디오 컨텍스트가 종료된 상황에서 다음 터치로 재생이 복구되지 않는 문제를 재현했다. 기존 코드는 `audioReady`만 확인해 종료된 그래프를 계속 재사용했다. 종료 상태면 오디오 그래프와 BGM 재생기를 새로 만들고, 일시 중단·인터럽트 상태는 기존 컨텍스트를 재개하도록 수정했다. 음소거와 기존 음량은 유지한다.

`tests/mobile-lifecycle.cjs`로 앱 전환 알림에 따른 일시정지, 입력 해제, 복귀 후 사용자 조작으로 음악·게임 재개, 종료된 오디오 컨텍스트 복구를 검증했다. 앱 전환은 visibility 이벤트로 모사하고 종료는 실제 `AudioContext.close()`로 재현했다. 수정 전 복구에 실패했고 수정 후 통과했다. CI에 이 검사와 작은 화면·가로 화면·태블릿 터치 검사를 추가했다. 모바일 자동 플레이도 CI에서 설치된 Chromium을 사용하도록 정리했다.

## 검증 결과

| 범위 | 결과 |
| --- | --- |
| 단위 테스트 | 101개 통과: 수학 생성·복습·자동 난이도·저장·전투·오디오 |
| 기기 프로필 | Chromium/WebKit 각각 9개, 총 18/18 통과 |
| 화면 크기 | 320×568, 360×640, 390×844, 430×932, 844×390, 768×1024, 820×1180, 1024×768, 1280×800 |
| 터치·회전 | 조이스틱, 대시, 스킬, 포인터 취소, 회전 후 입력 해제, 일시정지·재개 |
| UI | 큰 글자·문제 알림·해설·답 버튼, 메뉴 스크롤, 아래로 당기기 방지, 가로 넘침 검사 |
| 일반 회귀 | 기존 모드, 신규 무기·AI·보스·펫·상인·던전·성장·교사 과제·파일 합치기 |
| 데이터 | 학습 저장·복원·중복 방지·차단 저장소·틀린 문제 해설 다운로드 |
| 모바일 자동 플레이 | 실시간 125.367초, 게임 시간 121.733초, 처치 197, 레벨 10, 정답 5, 입력 걸림·런타임 오류 없음 |
| 이동 프레임 | 모바일 뷰포트 중앙값 약 16.7ms, 95백분위 약 16.7ms, 50ms 초과 0회 |
| 장시간 개체 제한 | 가속 모의 전투 1806초, 최대 적 92·투사체 27·경험치 보석 68·입자 78, 제한 통과 |
| 맵 | 직접 이동·보물·비밀 포털·상인, 4K 배경 캐시 재사용 |
| 시작·오프라인 | 시작 실패·재시도 5개 시나리오, 준비 화면, Pages 경로·오프라인 게임 및 MP3 |

18개 기기 프로필은 PC의 브라우저 에뮬레이션이다. 실물 Android/iPhone의 발열·배터리·전화 수신·주소창 동작을 인증한 결과는 아니다. 30분 검사는 무적·저사양 설정의 가속 시뮬레이션이며 30분 실시간 플레이가 아니다. Windows WebKit에는 Web Audio API가 없어 해당 환경의 음악 재생 검증은 제외했고, Chromium에서 실제 MP3 출력과 오프라인 재생을 검증했다. 성능 수치는 이 PC의 단일 실행 측정치다.

## 재현 자료

- 명령: `npm test`, `npm run test:devices`, `npm run test:browser`, `npm run test:v3`, `npm run test:movement`, `npm run test:stress`, `npm run build`, `npm run test:build-browser`.
- 추가 브라우저 검사: `mobile-refresh.cjs`, `mobile-gestures.cjs`, `mobile-size.cjs`, `question-cue.cjs`(두 엔진), `mobile-lifecycle.cjs`, `world-playtest.cjs`, `bgm-browser.cjs`, `review-export.cjs`, `first-paint.cjs`, `startup.cjs`.
- 자동 플레이: `CI=true`, `PLAY_PROFILE=phone-star`, `PLAY_LABEL=mobile-audit`로 `tests/v3-playtest.cjs` 실행.
- 빌드 음악: `GAME_URL=http://127.0.0.1:4174/Math-Survival/`, `BGM_OFFLINE=1`로 `tests/bgm-browser.cjs` 실행.
- 로컬 결과: `test-results/mobile-tablet/report.json`, `test-results/playtest/mobile-audit.json`, `test-results/v3-stress/report.json` 및 각 검사 캡처.
