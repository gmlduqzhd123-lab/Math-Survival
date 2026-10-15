// Measures visible thinking time independently of the paused combat clock.
export function createResponseTimer(now = () => performance.now()) {
  let running = false, active = false, started = 0, total = 0;
  function elapsed() { return total + (running && active ? Math.max(0, now() - started) : 0); }
  function setActive(value) {
    if (!running || active === value) return;
    total = elapsed(); active = value; started = now();
  }
  return {
    start(value = true) { total = 0; running = true; active = value; started = now(); },
    setActive,
    stop() { total = elapsed(); running = false; active = false; return total; },
    reset() { total = 0; running = false; active = false; },
    elapsed
  };
}
