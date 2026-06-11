import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class FakeAudio {
  static instances: FakeAudio[] = [];
  static playResult: () => Promise<void> = () => Promise.resolve();

  play = vi.fn<() => Promise<void>>(() => FakeAudio.playResult());
  src: string;
  volume = 0;

  constructor(src: string) {
    this.src = src;
    FakeAudio.instances.push(this);
  }
}

const importModule = async () => {
  vi.resetModules();
  return import('./voiceDisconnectSound');
};

describe('voiceDisconnectSound', () => {
  beforeEach(() => {
    FakeAudio.instances = [];
    FakeAudio.playResult = () => Promise.resolve();
    vi.stubGlobal('Audio', FakeAudio);
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:voice-disconnect'),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('does not play when muted or Audio is unavailable', async () => {
    const { playVoiceDisconnectSound } = await importModule();
    const applySinkId = vi.fn();

    playVoiceDisconnectSound(applySinkId, true);

    expect(FakeAudio.instances).toHaveLength(0);
    expect(applySinkId).not.toHaveBeenCalled();

    vi.stubGlobal('Audio', undefined);
    playVoiceDisconnectSound(applySinkId, false);

    expect(FakeAudio.instances).toHaveLength(0);
    expect(applySinkId).not.toHaveBeenCalled();
  });

  it('creates a cached sound URL and plays it through the selected output', async () => {
    const { playVoiceDisconnectSound } = await importModule();
    const applySinkId = vi.fn();

    playVoiceDisconnectSound(applySinkId, false);
    playVoiceDisconnectSound(applySinkId, false);

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(FakeAudio.instances).toHaveLength(2);
    expect(FakeAudio.instances[0].src).toBe('blob:voice-disconnect');
    expect(FakeAudio.instances[0].volume).toBe(0.28);
    expect(FakeAudio.instances[0].play).toHaveBeenCalledOnce();
    expect(applySinkId).toHaveBeenCalledTimes(2);
  });

  it('logs playback failures without throwing', async () => {
    const { playVoiceDisconnectSound } = await importModule();
    const error = new Error('blocked');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    FakeAudio.playResult = () => Promise.reject(error);

    playVoiceDisconnectSound(vi.fn(), false);
    await Promise.resolve();

    expect(consoleError).toHaveBeenCalledWith('[Voice] Failed to play disconnect sound', error);
  });
});
