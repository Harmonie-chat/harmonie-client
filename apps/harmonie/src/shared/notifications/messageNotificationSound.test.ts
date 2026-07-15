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
  return import('./messageNotificationSound');
};

describe('messageNotificationSound', () => {
  beforeEach(() => {
    FakeAudio.instances = [];
    FakeAudio.playResult = () => Promise.resolve();
    vi.stubGlobal('Audio', FakeAudio);
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:message-notification'),
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('does not play when output is muted or Audio is unavailable', async () => {
    const { playMessageNotificationSound } = await importModule();
    const applySinkId = vi.fn();

    playMessageNotificationSound(applySinkId, true);

    expect(FakeAudio.instances).toHaveLength(0);
    expect(applySinkId).not.toHaveBeenCalled();

    vi.stubGlobal('Audio', undefined);
    playMessageNotificationSound(applySinkId, false);

    expect(FakeAudio.instances).toHaveLength(0);
    expect(applySinkId).not.toHaveBeenCalled();
  });

  it('generates a cached sound and plays it through the selected output', async () => {
    const { playMessageNotificationSound } = await importModule();
    const applySinkId = vi.fn();

    playMessageNotificationSound(applySinkId, false);
    playMessageNotificationSound(applySinkId, false);

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(FakeAudio.instances).toHaveLength(2);
    expect(FakeAudio.instances[0].src).toBe('blob:message-notification');
    expect(FakeAudio.instances[0].volume).toBe(0.5);
    expect(FakeAudio.instances[0].play).toHaveBeenCalledOnce();
    expect(applySinkId).toHaveBeenCalledTimes(2);
  });

  it('logs playback failures without throwing', async () => {
    const { playMessageNotificationSound } = await importModule();
    const error = new Error('blocked');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    FakeAudio.playResult = () => Promise.reject(error);

    playMessageNotificationSound(vi.fn(), false);
    await Promise.resolve();

    expect(consoleError).toHaveBeenCalledWith(
      '[Notifications] Failed to play message sound',
      error
    );
  });
});
