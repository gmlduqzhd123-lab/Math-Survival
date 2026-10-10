// This classic script also reports failures that prevent the module graph from loading.
(function () {
  var scriptURL = new URL(document.currentScript.src);
  var status = document.getElementById('startupStatus');
  var retry = document.getElementById('repairStartup');
  var ready = false;
  // Game records contain JSON data. Older Android browsers lack these APIs.
  if (typeof window.structuredClone !== 'function') {
    window.structuredClone = function (value) { return JSON.parse(JSON.stringify(value)); };
  }
  if (!Array.prototype.at) Object.defineProperty(Array.prototype, 'at', {value: function (index) {
    index = Math.trunc(Number(index) || 0); return this[index < 0 ? this.length + index : index];
  }, configurable: true, writable: true});
  if (window.crypto && !crypto.randomUUID) crypto.randomUUID = function () {
    var bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
    return Array.from(bytes, function (b, i) { return ([4,6,8,10].includes(i) ? '-' : '') + b.toString(16).padStart(2, '0'); }).join('');
  };
  function failed(message) {
    if (ready) return;
    status.hidden = false;
    status.textContent = '게임 준비가 중단됐어요. 새로 불러오기를 눌러 주세요. ' + (message || '연결 상태를 확인해 주세요.');
    retry.hidden = false;
    var loading = document.getElementById('loadingPanel');
    if (loading) loading.append(status, retry);
  }
  var timer = setTimeout(function () { failed('파일을 불러오는 데 시간이 걸리고 있어요.'); }, 20000);
  window.addEventListener('math-game-ready', function () {
    ready = true; clearTimeout(timer); status.hidden = true; retry.hidden = true;
  });
  window.addEventListener('math-game-load-error', function (event) { failed(event.detail); });
  retry.addEventListener('click', async function () {
    retry.disabled = true; status.textContent = '새 게임 파일을 불러오는 중입니다. 학습 기록은 그대로 유지됩니다.';
    try {
      if ('serviceWorker' in navigator) {
        var scope = new URL('../', scriptURL).href;
        var registrations = await navigator.serviceWorker.getRegistrations();
        for (var registration of registrations) if (registration.scope === scope) await registration.update();
      }
    } catch (_) { /* A reload can still recover when SW access is blocked. */ }
    var next = new URL(location.href); next.searchParams.set('reload', String(Date.now())); location.replace(next.href);
  });
  var moduleURL = new URL('./main.js', scriptURL);
  moduleURL.searchParams.set('v', scriptURL.searchParams.get('v') || 'startup-2');
  import(moduleURL.href).catch(function (error) { clearTimeout(timer); failed(error.message); });
})();
