import { beforeEach, describe, expect, it, vi } from 'vitest';
import { publishScreenShareWithAudio } from './screenSharePublishing';

vi.mock('livekit-client', () => ({
  Room: vi.fn(),
  Track: {
    Source: {
      ScreenShare: 'screen-share',
      ScreenShareAudio: 'screen-share-audio',
    },
  },
}));

const createTrack = () => ({
  addEventListener: vi.fn(),
  stop: vi.fn(),
});

const createRoom = () => ({
  localParticipant: {
    identity: 'user-1',
    publishTrack: vi.fn().mockResolvedValue(undefined),
    setScreenShareEnabled: vi.fn().mockResolvedValue(undefined),
  },
});

const createStream = ({
  audioTrack,
  id = 'stream-1',
  videoTrack,
}: {
  audioTrack?: ReturnType<typeof createTrack>;
  id?: string;
  videoTrack?: ReturnType<typeof createTrack>;
}) => {
  const tracks = [videoTrack, audioTrack].filter(Boolean);

  return {
    id,
    getAudioTracks: () => (audioTrack ? [audioTrack] : []),
    getTracks: () => tracks,
    getVideoTracks: () => (videoTrack ? [videoTrack] : []),
  };
};

describe('publishScreenShareWithAudio', () => {
  beforeEach(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getDisplayMedia: vi.fn(),
      },
    });
  });

  it('publishes screen video and audio with the captured stream name', async () => {
    const room = createRoom();
    const videoTrack = createTrack();
    const audioTrack = createTrack();
    vi.mocked(navigator.mediaDevices.getDisplayMedia).mockResolvedValue(
      createStream({ audioTrack, videoTrack }) as unknown as MediaStream
    );

    await expect(publishScreenShareWithAudio(room as never)).resolves.toBe(true);

    expect(navigator.mediaDevices.getDisplayMedia).toHaveBeenCalledWith(
      expect.objectContaining({ audio: true, video: true })
    );
    expect(room.localParticipant.publishTrack).toHaveBeenNthCalledWith(1, videoTrack, {
      source: 'screen-share',
      stream: 'stream-1',
    });
    expect(room.localParticipant.publishTrack).toHaveBeenNthCalledWith(2, audioTrack, {
      dtx: false,
      red: false,
      source: 'screen-share-audio',
      stream: 'stream-1',
    });
    expect(videoTrack.addEventListener).toHaveBeenCalledWith('ended', expect.any(Function), {
      once: true,
    });

    const endedHandler = videoTrack.addEventListener.mock.calls[0][1] as () => void;
    endedHandler();
    await Promise.resolve();

    expect(room.localParticipant.setScreenShareEnabled).toHaveBeenCalledWith(false);
  });

  it('uses a fallback stream name and returns false when no audio track exists', async () => {
    const room = createRoom();
    const videoTrack = createTrack();
    vi.mocked(navigator.mediaDevices.getDisplayMedia).mockResolvedValue(
      createStream({ id: '', videoTrack }) as unknown as MediaStream
    );

    await expect(publishScreenShareWithAudio(room as never)).resolves.toBe(false);

    expect(room.localParticipant.publishTrack).toHaveBeenCalledWith(videoTrack, {
      source: 'screen-share',
      stream: 'screen-share-user-1',
    });
  });

  it('stops all tracks and throws when capture does not include video', async () => {
    const audioTrack = createTrack();
    vi.mocked(navigator.mediaDevices.getDisplayMedia).mockResolvedValue(
      createStream({ audioTrack }) as unknown as MediaStream
    );

    await expect(publishScreenShareWithAudio(createRoom() as never)).rejects.toThrow(
      'Screen share did not provide a video track.'
    );
    expect(audioTrack.stop).toHaveBeenCalledTimes(1);
  });

  it('stops audio and keeps screen sharing when audio publishing fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const room = createRoom();
    const videoTrack = createTrack();
    const audioTrack = createTrack();
    room.localParticipant.publishTrack
      .mockResolvedValueOnce(undefined)
      .mockRejectedValueOnce(new Error('audio failed'));
    vi.mocked(navigator.mediaDevices.getDisplayMedia).mockResolvedValue(
      createStream({ audioTrack, videoTrack }) as unknown as MediaStream
    );

    await expect(publishScreenShareWithAudio(room as never)).resolves.toBe(false);

    expect(audioTrack.stop).toHaveBeenCalledTimes(1);
    expect(consoleError).toHaveBeenCalledWith(
      '[Voice] Failed to publish screen share audio track',
      expect.objectContaining({ error: expect.any(Error) })
    );
  });

  it('stops captured tracks when video publishing fails', async () => {
    const room = createRoom();
    const videoTrack = createTrack();
    const audioTrack = createTrack();
    room.localParticipant.publishTrack.mockRejectedValueOnce(new Error('video failed'));
    vi.mocked(navigator.mediaDevices.getDisplayMedia).mockResolvedValue(
      createStream({ audioTrack, videoTrack }) as unknown as MediaStream
    );

    await expect(publishScreenShareWithAudio(room as never)).rejects.toThrow('video failed');
    expect(videoTrack.stop).toHaveBeenCalledTimes(1);
    expect(audioTrack.stop).toHaveBeenCalledTimes(1);
  });

  it('logs when stopping screen share after capture ended fails', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const room = createRoom();
    const videoTrack = createTrack();
    room.localParticipant.setScreenShareEnabled.mockRejectedValueOnce(new Error('stop failed'));
    vi.mocked(navigator.mediaDevices.getDisplayMedia).mockResolvedValue(
      createStream({ videoTrack }) as unknown as MediaStream
    );

    await publishScreenShareWithAudio(room as never);

    const endedHandler = videoTrack.addEventListener.mock.calls[0][1] as () => void;
    endedHandler();
    await Promise.resolve();

    expect(consoleError).toHaveBeenCalledWith(
      '[Voice] Failed to stop screen share after capture ended',
      expect.objectContaining({ error: expect.any(Error) })
    );
  });
});
