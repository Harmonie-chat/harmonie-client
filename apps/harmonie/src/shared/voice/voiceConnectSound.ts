type ApplySinkId = (el: HTMLAudioElement) => void;

const SAMPLE_RATE = 44100;
const DURATION_SECONDS = 0.22;
const VOLUME = 0.26;
let cachedSoundUrl: string | null = null;

const writeString = (view: DataView, offset: number, value: string) => {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
};

const createConnectSoundUrl = () => {
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
    const progress = i / sampleCount;
    const frequency = 360 + 220 * (1 - Math.exp(-5 * progress));
    const attack = Math.min(1, progress / 0.05);
    const decay = Math.exp(-4.8 * progress);
    const envelope = attack * decay;
    const fundamental = Math.sin(2 * Math.PI * frequency * (i / SAMPLE_RATE));
    const shimmer = Math.sin(2 * Math.PI * frequency * 1.5 * (i / SAMPLE_RATE)) * 0.14;
    const sample = (fundamental + shimmer) * envelope;
    view.setInt16(44 + i * bytesPerSample, sample * 0x7fff, true);
  }

  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
};

export const playVoiceConnectSound = (applySinkId: ApplySinkId, muted: boolean) => {
  if (muted || typeof Audio === 'undefined') return;

  cachedSoundUrl ??= createConnectSoundUrl();

  const audioElement = new Audio(cachedSoundUrl);
  audioElement.volume = VOLUME;
  applySinkId(audioElement);

  void audioElement.play().catch((error) => {
    console.error('[Voice] Failed to play connect sound', error);
  });
};
