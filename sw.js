// 매쓰 서바이벌 서비스 워커: 앱 설치(홈 화면에 추가)와 오프라인 열기를 돕는다.
// 우리 사이트 파일은 새 버전을 먼저 받아 오므로 보통은 CACHE_VERSION을 올릴 필요가 없다.
// 학습 기록(브라우저 저장소)은 건드리지 않는다.
const CACHE_VERSION = 'math-survival-v3.0.1';
// 같은 주소(gmlduqzhd123-lab.github.io)의 다른 앱들과 저장소를 함께 쓰므로, 이 앱의 이전 캐시만 지운다.
const CACHE_PREFIX = 'math-survival-v';
const APP_SHELL = [
    './',
    './src/v3/dungeon.js',
    './src/v3/music.js',
    './src/v3/assets/cat-walk.svg',
    './src/v3/assets/dragon-walk.svg',
    './src/v3/assets/enemy-archer.svg',
    './src/v3/assets/enemy-bat.svg',
    './src/v3/assets/enemy-frost.svg',
    './src/v3/assets/enemy-healer.svg',
    './src/v3/assets/enemy-jelly.svg',
    './src/v3/assets/enemy-ram.svg',
    './src/v3/assets/enemy-sentinel.svg',
    './src/v3/assets/enemy-shaman.svg',
    './src/v3/assets/enemy-sprout.svg',
    './src/v3/assets/enemy-turtle.svg',
    './src/v3/assets/fox-walk.svg',
    './src/v3/assets/otter-walk.svg',
    './src/v3/assets/owl-walk.svg',
    './src/v3/assets/panda-walk.svg',
    './src/v3/assets/rabbit-walk.svg',

    './src/combat-v2.js',
    './src/combat.js',
    './src/configuration.js',
    './src/core.js',
    './src/entities.js',
    './src/input.js',
    './src/items.js',
    './src/learning.js',
    './src/main.js',
    './src/MAPS.js',
    './src/mastery.js',
    './src/math-engine.js',
    './src/math.js',
    './src/player.js',
    './src/question-visual.js',
    './src/render-budget.js',
    './src/sprites.js',
    './src/state.js',
    './src/storage.js',
    './src/ui.js',
    './src/v2.js',
    './src/version.js',
    './src/v3/content-data.js',
    './src/v3/content.js',
    './src/v3/graphics.js',
    './src/v3/index.js',
    './src/v3/math-combat.js',
    './src/v3/modes.js',
    './src/v3/monsters.js',
    './src/v3/performance.js',
    './src/v3/progress-ui.js',
    './src/v3/progress.js',
    './src/v3/survival.js',
    './src/v3/teacher.js',
    './src/v3/weapons-data.js',
    './src/v3/weapons.js',
    './data/curriculum.json',
    './src/v3/assets/cat.svg',
    './src/v3/assets/dragon.svg',
    './src/v3/assets/fox.svg',
    './src/v3/assets/otter.svg',
    './src/v3/assets/owl.svg',
    './src/v3/assets/panda.svg',
    './src/v3/assets/rabbit.svg',

    './index.html',
    './manifest.webmanifest',
    './ys-install.js',
    './src/original.css',
    './src/v2.css',
    './src/question-visual.js',
    './src/layout.css',
    './src/typography.css',
    './src/sprites.css',
    './src/sprites.js',
    './src/assets/sprites/freeze-clock.png',
    './src/assets/sprites/healing-heart.png',
    './src/assets/sprites/invincibility-shield.png',
    './src/assets/sprites/knowledge-book.png',
    './src/assets/sprites/knowledge-staff.png',
    './src/assets/sprites/magic-quill.png',
    './src/assets/sprites/math-bomb.png',
    './src/assets/sprites/math-boomerang.png',
    './src/assets/sprites/math-magnet.png',
    './src/assets/sprites/pencil-sword.png',
    './src/assets/sprites/speed-boots.png',
    './src/assets/sprites/treasure-chest.png',
    './src/fonts/Jua-Regular.woff2',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
    event.waitUntil(caches.open(CACHE_VERSION).then(cache => cache.addAll([...new Set(APP_SHELL)])).catch(() => {}));
    self.skipWaiting();
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(keys.filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_VERSION).map(key => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

// 우리 사이트 파일만: 새 버전을 먼저 받아 오고, 인터넷이 없으면 저장해 둔 것을 보여준다
self.addEventListener('fetch', event => {
    const request = event.request;
    if (request.method !== 'GET') return;
    if (new URL(request.url).origin !== self.location.origin) return;
    event.respondWith(
        fetch(request)
            .then(response => {
                if (response.ok) {
                    const copy = response.clone();
                    caches.open(CACHE_VERSION).then(cache => cache.put(request, copy));
                }
                return response;
            })
            .catch(() => caches.match(request, { ignoreSearch: true })
                .then(cached => cached || (request.mode === 'navigate' ? caches.match('./index.html') : undefined))
                .then(res => res || Response.error()))
    );
});
