# Math Survival 2.0 · 매쓰 서바이벌

원본 `ysschool/public/apps/math-survival.html`의 실제 Canvas 게임 엔진을 확장한 정적 게임입니다. 기본 전투·아이템·펫·포털·미션을 유지하면서 초등 수학 연습, 캐릭터·무기·보스, 학습 분석을 추가했습니다.

## 실행

Node.js 24 환경에서 프로젝트 폴더를 열고 실행합니다.

```powershell
npm ci
npm start
```

브라우저: **http://127.0.0.1:4173/Math-Survival/**

플레이에는 외부 라이브러리·API 키가 필요하지 않습니다. `npm ci`는 개발 테스트 도구 설치입니다. `npm start`는 파일을 제공하는 로컬 미리보기이며 게임 로직이나 데이터를 처리하는 백엔드가 아닙니다. ES Modules와 JSON 로딩 때문에 `index.html`을 `file://`로 직접 여는 방식 대신 HTTP로 실행하세요.

## 플레이

- 이동: WASD / 방향키 / 모바일 조이스틱
- 대시: Space / 모바일 대시 버튼
- 고유 스킬: E / 특수 스킬 버튼, 재사용 14초
- 공격: 원본 마법구·펫 자동 공격, 레벨업 카드로 원본·신규 무기 강화
- 문제: 네 구슬 중 답을 찾아 이동. 화면 아래 버튼으로 해당 구슬에 이동하는 접근성 조작도 지원
- 일시정지: P / 일시정지 버튼. 보이지 않는 탭에서는 자동 정지
- Q: 종료, Escape: 메인 메뉴
- 원본의 16종 아이템·경험치 젤리·미션·업적·포털·지속 배경 음악 유지

## 모드와 캐릭터

| 모드 | 동작 |
|---|---|
| 서바이벌 | 전투와 수학을 병행하여 180초 생존. 일반 몬스터와 시간에 따른 보스 등장 |
| 수학 탐험 | 몬스터 없이 문제를 풀기. 교사가 학년·영역·단원·목표 1~100문항·제한 30~1800초 설정. 정답/오답 모두 문항 수에 포함 |
| 보스 챌린지 | 선택한 맵부터 세 맵의 보스를 연속 처치. 전체 제한 300초 |

| 캐릭터 | 시작 능력 | 스킬 |
|---|---|---|
| 용감한 탐험가 | HP 140, 이동 4.8, 공격력 24 | 주변 폭발 + 2초 무적 |
| 번개 마법사 | HP 100, 공격 간격 350ms, 공격력 26 | 주변 공격 + 적 3초 정지 |
| 수학 수호자 | HP 170, 보호막 2, 이동 3.9 | HP 45 회복 + 보호막 2 + 주변 공격 |

신규 무기는 숫자 폭풍(방사형 탄환), 황금 컴퍼스(회전 부메랑), 분수 방패(근거리 지속 피해·보호막), 연산 번개(연쇄 즉시 공격)입니다. **개별 무기 Lv.3 + 최고 5콤보**에서 자동 진화하며 실제 공격 빈도·대미지·개수·보호막 효과가 강화됩니다. 시작 무기 한 종류를 선택하고 다른 무기는 성장 카드로 획득합니다.

보스: 구구단 골렘(내려찍기/방사 충격파), 분수 드래곤(화염/운석), 도형 마왕(사각 봉인/고리). 1.25초 예고, 피해 판정, 체력 표시, 원본 보물상자·보석·클로버·경험치 보상을 제공합니다.

## 학습 데이터와 기록

`data/curriculum.json`은 1~6학년의 **29개 연습 단원**을 관리합니다. 선택한 수학 난이도 1~5에서 수를 생성하고, 수학 난이도와 전투 난이도를 독립적으로 적용합니다. 이 데이터는 연습 범위이며 모든 교과서 단원을 빠짐없이 담은 공식 교육과정 데이터는 아닙니다.

`src/math-engine.js`는 정답과 해설을 계산하고 정규화된 유리수로 선택지 동치·유일성을 판정합니다. 분수, 실제 소수 답, 길이·시간·넓이·부피 등의 단위를 지원합니다. `data/question-bank.json`은 같은 생성기의 단원별 난이도 대표 **145문항**입니다. 실제 플레이 문항은 매번 생성하며 오답은 같은 조건의 복습 문항으로 돌아옵니다.

자동 난이도는 최근 5개 응답에서 4개 이상 정답이면 +1, 2개 이하이면 −1입니다. 최근 저장 기록 중 같은 학년·영역·단원의 응답을 시작 난이도와 취약 문항에 반영합니다. 단원마다 3번째 출제 기회에 대기 중인 복습 문제를 우선 사용합니다.

결과에는 점수, 생존 시간, 레벨, 처치 수, 정답·오답, 정답률, 최고 콤보, 영역별 정답률, 취약 문제와 해설이 표시됩니다. 실명·학번을 받지 않으며 `localStorage`에 최근 100회 기록을 저장합니다. 저장 용량 제한 시 오류를 알리고 JSON/CSV 다운로드를 제공합니다. 브라우저·기기 사이 자동 동기화는 없습니다.

## 구조

```text
index.html                     정적 진입 화면
src/main.js                    DOM·입력 연결, 공유 런타임, ES Module 초기화
src/core.js                    원본 루프·업데이트·카메라·충돌·시작/종료
src/state.js, player.js         원본 상태·플레이어 초기값
src/MAPS.js, entities.js        원본 맵·몬스터·보스·펫·Canvas 렌더링
src/combat.js, items.js         원본 공격·강화·보상·16종 아이템
src/math.js                    원본 spawnQuiz/resolveAnswer 연결
src/math-engine.js             2.0 문제 생성·정확한 정답 비교·자동 난이도
src/combat-v2.js                캐릭터·신규 무기·스킬·보스 예고/패턴
src/ui.js, v2.js                원본 UI + 2.0 설정·모드·학습 연결
src/learning.js                분석·브라우저 저장·JSON/CSV
src/original.css, v2.css        원본 스타일과 2.0 반응형 개선
data/                          학년/단원·대표 문제은행 JSON
original/index.html            바이트 그대로 보존한 원본 실행본
tests/                         문제 자동 검증·원본/2.0 브라우저 회귀
scripts/                       미리보기·정적 빌드·문제은행 생성·원본 추출 이력
docs/                          원본 분석·단계별 보고·테스트 증거·화면
.github/workflows/pages.yml    승인 후 수동 실행하는 Pages 워크플로
```

`scripts/migrate.cjs`는 범위 분석으로 원본 함수의 외부 참조를 런타임 접근자로 옮긴 일회성 추출 도구입니다. 이후 직접 수정한 추출 모듈을 덮어쓰므로 일반 실행·빌드 때 실행하지 않습니다. 추출본은 원본 함수 66개와 시뮬레이션 시계 함수 1개를 5개 시스템으로 분리합니다.

## 검증

```powershell
npm test
# 별도 터미널에서 npm start 실행 후
npm run test:baseline
npm run test:browser
npm run build
```

Windows 브라우저 검사는 설치된 Edge를 사용합니다. 다른 PC나 Linux에서는 `npx playwright install chromium` 후 `BROWSER_CHANNEL=chromium`을 지정합니다. 테스트 URL에만 `?qa=1`로 런타임 접근을 열어 내부 충돌·보상·종료 조건을 검사합니다.

2026-10-09 검증: 원본 브라우저 17개, 자동 테스트 34개(14,500개 생성 문항 + 대표 145문항 포함), 2.0 브라우저 21개 통과. 브라우저 오류 및 정적 자원 4xx 없음. 증거: `docs/baseline-results.json`, `docs/math-tests.tap`, `docs/browser-results.json`.

검사 환경은 Windows의 Microsoft Edge와 Playwright입니다. 모바일은 브라우저 뷰포트와 터치 입력으로 검사했으며 실제 휴대폰·iOS Safari 검사와 오디오 청취 검사는 수행하지 않았습니다. 화면은 PC·세로/가로 모바일에서 캡처했습니다.

## GitHub Pages 준비

`npm run build`가 `index.html`, `src/`, `data/`를 `dist/`에 복사합니다. 상대 경로만 사용합니다. 배포에는 서버·데이터베이스·Vercel·Supabase·유료 AI API가 없습니다.

사용자가 지정한 저장소: **https://github.com/gmlduqzhd123-lab/Math-Survival** / Pages 목표: **https://gmlduqzhd123-lab.github.io/Math-Survival/**.

사용자가 지정한 Math-Survival 저장소에 전체 소스를 연결합니다. Pages 배포는 Settings → Pages에서 GitHub Actions를 선택한 뒤 `Verify and deploy Math Survival 2`를 수동 실행합니다. 원본 `ysschool`에는 원격 쓰기를 수행하지 않습니다. 워크플로의 Linux 실행과 실제 Pages 주소는 배포 후 검증할 작업입니다.

출처와 분석: [ORIGIN.md](docs/ORIGIN.md), [SOURCE_ANALYSIS.md](docs/SOURCE_ANALYSIS.md), [PHASE_REPORT.md](docs/PHASE_REPORT.md), [COMPARISON.md](docs/COMPARISON.md).
