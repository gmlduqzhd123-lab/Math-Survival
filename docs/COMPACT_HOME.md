# 간결한 시작 화면 검증 (2026-10-11)

- 교육과정 설명문·성취기준 설명·교육부 원문 링크를 시작 화면에서 제거했다. 교육과정 데이터와 문제 생성 규칙은 수정하지 않았다.
- 학년 선택과 게임 시작을 먼저 표시한다. 현재 모드와 단원을 한 줄로 확인할 수 있으며, 저장한 설정·공유 과제를 그대로 적용한다.
- 캐릭터·펫·무기·단원·난이도·음향·접근성은 ‘설정 바꾸기’에 모았다. 설명서는 독립적으로 펼친다. 성장·수집·기록·백업·교사 도구는 ‘기록·성장·교사용’에 모았다.
- 기존 DOM 제어와 이벤트를 재사용했다. 학습 저장 키, 성장 저장 키, 원본 파일을 변경하지 않았다. Supabase 연결·환경 변수·DB 변경은 포함하지 않는다.

## 로컬 검증

- `npm test`: 91/91 통과.
- `node tests/compact-home.cjs`: Chromium/Edge와 WebKit, 320×568·390×844·768×1024·1920×1080 총 8개 통과. 첫 화면에서 시작 버튼 노출, 학년 선택·게임 시작, 상세 설정 접기, 저장 설정 복원, 가로 넘침 및 콘솔 오류를 검사했다.
- `npm run test:browser`: 기존 학습·모드·백업·복습·키보드·터치 회귀 검사 통과.
- `npm run test:v3`: 전투·무기·캐릭터·펫·보스·성장·교사 과제 등 7개 브라우저 검사 통과.
- preferences·typography·curriculum-screen·sprites·movement·simple-play 브라우저 검사 통과 (Chromium).
- `npm run build`, `node tests/startup.cjs` (Chromium 5개 시나리오), `npm run test:build-browser`: Pages 하위 경로 빌드, 구형 API 대체, 로드 실패 복구, 오프라인 실행 통과.
- 접힌 설정은 테스트에서도 실제 summary 클릭으로 펼친다. 숨은 제어를 강제로 클릭하지 않는다.

화면 크기와 터치 입력은 데스크톱 브라우저의 에뮬레이션이며 실물 휴대폰 검수는 아니다. `original/index.html` SHA256은 `3B1F33DE3983D5B4ED789A8AB1DA1FFF62E07B46AA9F1B5B581B592B639D0AD9`로 유지한다. CI에도 compact-home 검사를 추가했다.
