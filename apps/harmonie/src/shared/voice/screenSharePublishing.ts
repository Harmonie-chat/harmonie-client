import { Room, Track } from 'livekit-client';

type DisplayMediaOptionsWithAudioHints = DisplayMediaStreamOptions & {
  selfBrowserSurface?: 'include' | 'exclude';
  surfaceSwitching?: 'include' | 'exclude';
  systemAudio?: 'include' | 'exclude';
  windowAudio?: 'exclude' | 'window' | 'system';
  preferCurrentTab?: boolean;
};

const SCREEN_SHARE_CAPTURE_OPTIONS: DisplayMediaOptionsWithAudioHints = {
  audio: true,
  video: true,
  surfaceSwitching: 'include',
  systemAudio: 'include',
  windowAudio: 'system',
};

export const publishScreenShareWithAudio = async (room: Room): Promise<boolean> => {
  const stream = await navigator.mediaDevices.getDisplayMedia(SCREEN_SHARE_CAPTURE_OPTIONS);
  const [videoTrack] = stream.getVideoTracks();
  const [audioTrack] = stream.getAudioTracks();

  if (!videoTrack) {
    stream.getTracks().forEach((track) => track.stop());
    throw new Error('Screen share did not provide a video track.');
  }

  const streamName = stream.id || `screen-share-${room.localParticipant.identity}`;
  let audioPublished = false;

  try {
    await room.localParticipant.publishTrack(videoTrack, {
      source: Track.Source.ScreenShare,
      stream: streamName,
    });

    if (audioTrack) {
      try {
        await room.localParticipant.publishTrack(audioTrack, {
          source: Track.Source.ScreenShareAudio,
          stream: streamName,
          dtx: false,
          red: false,
        });
        audioPublished = true;
      } catch (error) {
        audioTrack.stop();
        console.error('[Voice] Failed to publish screen share audio track', { error });
      }
    }
  } catch (error) {
    stream.getTracks().forEach((track) => track.stop());
    throw error;
  }

  videoTrack.addEventListener(
    'ended',
    () => {
      void room.localParticipant.setScreenShareEnabled(false).catch((error) => {
        console.error('[Voice] Failed to stop screen share after capture ended', { error });
      });
    },
    { once: true }
  );

  return audioPublished;
};
