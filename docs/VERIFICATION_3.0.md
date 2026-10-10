# 3.0 로컬 검증 결과

검증 환경: Windows, Node24, Playwright의 Chromium(Microsoft Edge)·WebKit. 실제 휴대폰/태블릿 하드웨어 검증은 아니다. 로컬 HTTP 및 dist의 GitHub Pages 하위 경로를 사용했으며 공개 배포 URL을 갱신하지 않았다.

| 검사 | 결과 |
|---|---|
| npm test | 83/83 통과. 기존 66개 포함, 공간 충돌/풀/AI/무기/진화/학습 보상/보존/진행/교사 집계 추가 |
| test:browser | 기존 30개 회귀 통과. 3모드, 학습/복습/난이도, 백업·복원·손상 격리·저장 차단·130회 기록 보존 포함 |
| test:devices | Chromium·WebKit × 9개 휴대폰/태블릿 화면, 18/18 통과. 터치 이동·해제·회전·답안·종료 포함 |
| test:preferences | Chromium·WebKit × 휴대폰/태블릿/PC, 6개 프로필 통과 |
| test:typography | 두 엔진 × 7화면, 14개 프로필 통과 |
| test:movement | PC1920×1080·휴대폰390×844, 2개 부하/이동·키 해제 검사 통과 |
| test:sprites | 두 엔진 × 4화면, 8개 검사 통과 |
| test:curriculum-screen | 390×844, 768×1024, 1920×1080, 2547×1293의 4개 검사 통과 |
| test:v3 | 5개 브라우저 시나리오 통과: 10무기/AI, 정지 팝업·힌트·보호막·중복, 캐릭터·펫·신규 보스·이벤트, 해금·영구강화·5모드·정산, 공유 과제·시간·파일 합치기·CSV |
| test:stress | 30분 전투 시간을 가속 실행한 불사·경험치 억제 부하 검사 통과 |
| npm run build | 정적 dist 생성 성공 |
| test:build-browser | dist /Math-Survival/에서 터치·팝업·대시, 서비스 워커 오프라인 재접속·전체 모듈 로딩 통과 |

## 성능

PC/휴대폰 크기 이동 검사에서 프레임 중앙값16.7ms, p95 각각16.8/16.9ms였다. 약12초 관측 중 HUD mutation은23/25회이며 렌더 픽셀은2,999,533/1,296,162였다. 자동 브라우저가 실행된 PC의 결과이며 모바일 실제 FPS를 보장하지 않는다.

가속 저사양 검사에서는 1,806초 전투 시간을 진행했다. 최대 적95(보스 포함), 투사체18, 보석34, 파티클88. 마지막 활성 풀70, 생성한 일반 적 객체85. 실행 시간 약20초. 생명력1e9·경험치-1e9·문제 비활성 조건이므로 자연 플레이/밸런스/발열 검사와 구분한다. 수치 원본은 verification-3.0/stress.json 및 movement.json이다.

## 보존

original/index.html SHA256: `3B1F33DE3983D5B4ED789A8AB1DA1FFF62E07B46AA9F1B5B581B592B639D0AD9`, 시작 시점과 동일. math-engine.js/mastery.js/original/index.html은 시작 커밋63ddb5d와 차이가 없다. 기존 학습 키와 schema2를 유지했고 게임 성장은 별도 키를 사용한다. 이관 스크립트는 실행하지 않았다.

## 배포 준비와 남은 확인

작업 브랜치 codex/math-survival-3. 단계별 로컬 커밋과 문서, 정적 dist, Pages CI 설정을 준비했다. push·병합·배포는 사용자 승인 전 실행하지 않았다. 원격 Actions/공개 URL 결과는 미검증이다.

실물 Android/iOS·태블릿의 장시간 전투/메모리/발열, 음원 청취, 학생·교사 밸런스 테스트, 추가 애니메이션·음원은 후속 작업이다. 세부 범위는 GAME_DESIGN_3.0.md의 추가 목록을 참고한다. CSV 결과 입력 합치기는 지원하지 않으며 JSON 원본으로 학급 집계를 제공한다.
