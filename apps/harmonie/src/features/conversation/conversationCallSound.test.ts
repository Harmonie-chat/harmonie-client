import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

class FakeAudio {
  static instances: FakeAudio[] = [];
  static playResult: () => Promise<void> = () => Promise.resolve();

  currentTime = 0;
  listeners = new Map<string, EventListener>();
  pause = vi.fn();
  play = vi.fn<() => Promise<void>>(() => FakeAudio.playResult());
  src: string;
  volume = 0;

  constructor(src: string) {
    this.src = src;
    FakeAudio.instances.push(this);
  }

  addEventListener(type: string, listener: EventListener) {
    this.listeners.set(type, listener);
  }

  emit(type: string) {
    this.listeners.get(type)?.(new Event(type));
  }
}

const importModule = async () => {
  vi.resetModules();
  return import('./conversationCallSound');
};

describe('conversationCallSound', () => {
  beforeEach(() => {
    FakeAudio.instances = [];
    FakeAudio.playResult = () => Promise.resolve();
    vi.stubGlobal('Audio', FakeAudio);
    vi.stubGlobal('URL', {
      ...URL,
      createObjectURL: vi.fn(() => 'blob:incoming-call'),
    });
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('does not play when muted or Audio is unavailable', async () => {
    const { playConversationCallIncomingSound } = await importModule();
    const applySinkId = vi.fn();

    playConversationCallIncomingSound(applySinkId, true);

    expect(FakeAudio.instances).toHaveLength(0);
    expect(applySinkId).not.toHaveBeenCalled();

    vi.stubGlobal('Audio', undefined);
    playConversationCallIncomingSound(applySinkId, false);

    expect(FakeAudio.instances).toHaveLength(0);
    expect(applySinkId).not.toHaveBeenCalled();
  });

  it('creates, plays, stops, and clears the active incoming call sound', async () => {
    const { playConversationCallIncomingSound, stopConversationCallIncomingSound } =
      await importModule();
    const applySinkId = vi.fn();

    playConversationCallIncomingSound(applySinkId, false);
    playConversationCallIncomingSound(applySinkId, false);

    expect(URL.createObjectURL).toHaveBeenCalledTimes(1);
    expect(FakeAudio.instances).toHaveLength(2);
    expect(FakeAudio.instances[0].pause).toHaveBeenCalledOnce();
    expect(FakeAudio.instances[0].currentTime).toBe(0);
    expect(FakeAudio.instances[1].src).toBe('blob:incoming-call');
    expect(FakeAudio.instances[1].volume).toBe(0.32);
    expect(applySinkId).toHaveBeenCalledTimes(2);

    FakeAudio.instances[1].emit('ended');
    stopConversationCallIncomingSound();

    expect(FakeAudio.instances[1].pause).not.toHaveBeenCalled();
  });

  it('clears the active sound and logs when playback fails', async () => {
    const { playConversationCallIncomingSound, stopConversationCallIncomingSound } =
      await importModule();
    const error = new Error('blocked');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    FakeAudio.playResult = () => Promise.reject(error);

    playConversationCallIncomingSound(vi.fn(), false);
    await Promise.resolve();
    stopConversationCallIncomingSound();

    expect(consoleError).toHaveBeenCalledWith(
      '[ConversationCall] Failed to play incoming call sound',
      error
    );
    expect(FakeAudio.instances[0].pause).not.toHaveBeenCalled();
  });
});
