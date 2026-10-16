# 첫 화면 디자인 시안 (비교용, 게임에 연결되지 않음)

게임 코드(`index.html`, `src/`)는 바꾸지 않았다. 캡처할 때만 아래 파일을 페이지에 주입한다.

| 파일 | 내용 |
|---|---|
| `theme-a.css` | 시안 A · 파스텔 스티커북 (Dongle Bold 제목, 민트·복숭아·라벤더) |
| `theme-b.css` | 시안 B · 모험 지도 게임판 (Do Hyeon 제목, 진한 초록·노랑·하늘) |
| `theme-b-title.css` | 시안 B의 제목 변형: B-1 큰 간판형(가운데 두 줄), B-2 현수막형(나무 간판 한 줄). `?homeTheme=b1` / `b2` |
| `drafts.js` | 공통: 1~6학년 버튼(기존 `#grade` 선택값을 그대로 바꿈), 캐릭터 그림 배치 |
| `fonts/` | 시안에 쓰인 글자만 담은 WOFF2(약 10KB씩), OFL 라이선스 전문 |
| `screens/` | 390px·1440px 캡처와 현재 화면 비교본 |

글꼴: Dongle(OFL), Do Hyeon(OFL), 출처 google/fonts. 본문은 기존 Pretendard 그대로.
채택하면 글자 범위를 실제 화면 문구 전체로 다시 만들고, 시안 CSS를 `src/`로 옮겨 기존 회귀 검사(compact-home, typography, first-paint 등)와 함께 검증한다.
