type ApplySinkId = (element: HTMLAudioElement) => void;

const SAMPLE_RATE = 44100;
const DURATION_SECONDS = 0.36;
const VOLUME = 0.5;
const NOTE_STARTS = [0, 0.09];
const NOTE_FREQUENCIES = [185, 277.18];
const NOTE_GAINS = [0.48, 0.58];
let cachedSoundUrl: string | null = null;

const writeString = (view: DataView, offset: number, value: string) => {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
};

const createMessageNotificationSoundUrl = () => {
  const sampleCount = Math.floor(SAMPLE_RATE * DURATION_SECONDS);
  const bytesPerSample = 2;
  const dataSize = sampleCount * bytesPerSample;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, SAMPLE_RATE, true);
  view.setUint32(28, SAMPLE_RATE * bytesPerSample, true);
  view.setUint16(32, bytesPerSample, true);
  view.setUint16(34, 8 * bytesPerSample, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < sampleCount; i += 1) {
    const time = i / SAMPLE_RATE;
    let sample = 0;

    for (let noteIndex = 0; noteIndex < NOTE_STARTS.length; noteIndex += 1) {
      const noteTime = time - NOTE_STARTS[noteIndex];
      if (noteTime < 0) continue;

      const frequency = NOTE_FREQUENCIES[noteIndex];
      const attack = Math.min(1, noteTime / 0.006);
      const decay = Math.exp(-13 * noteTime);
      const envelope = attack * decay * NOTE_GAINS[noteIndex];
      const fundamental = Math.sin(2 * Math.PI * frequency * noteTime);
      const warmth = Math.sin(2 * Math.PI * frequency * 0.5 * noteTime) * 0.08;
      const shimmer = Math.sin(2 * Math.PI * frequency * 2 * noteTime) * 0.14;

      sample += (fundamental + warmth + shimmer) * envelope;
    }

    const normalizedSample = Math.max(-1, Math.min(1, sample));
    view.setInt16(44 + i * bytesPerSample, normalizedSample * 0x7fff, true);
  }

  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
};

export const playMessageNotificationSound = (applySinkId: ApplySinkId, muted: boolean) => {
  if (muted || typeof Audio === 'undefined') return;

  cachedSoundUrl ??= createMessageNotificationSoundUrl();

  const audioElement = new Audio(cachedSoundUrl);
  audioElement.volume = VOLUME;
  applySinkId(audioElement);

  void audioElement.play().catch((error) => {
    console.error('[Notifications] Failed to play message sound', error);
  });
};
