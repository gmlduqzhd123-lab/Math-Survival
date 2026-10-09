import test from 'node:test';
import assert from 'node:assert/strict';
import {createSystem} from '../src/ui.js';

test('오디오 API 없음·생성 차단·재개 거부가 게임 시작을 중단하지 않음', async () => {
  const previous = globalThis.window;
  try {
    for (const AudioContext of [undefined, class { constructor() { throw new Error('blocked'); } }]) {
      globalThis.window = {AudioContext};
      const runtime = {audioReady: false};
      assert.doesNotThrow(() => createSystem(runtime).initAudio());
      assert.equal(runtime.audioReady, false);
    }
    const runtime = {audioReady: true, audioCtx: {state: 'suspended', resume: () => Promise.reject(new Error('blocked'))}};
    assert.doesNotThrow(() => createSystem(runtime).initAudio());
    await new Promise(resolve => setImmediate(resolve));
  } finally {
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});
