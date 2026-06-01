type ApplySinkId = (el: HTMLAudioElement) => void;

const SAMPLE_RATE = 44100;
const DURATION_SECONDS = 5.4;
const VOLUME = 0.32;
let cachedSoundUrl: string | null = null;
let activeAudioElement: HTMLAudioElement | null = null;

const writeString = (view: DataView, offset: number, value: string) => {
  for (let i = 0; i < value.length; i += 1) {
    view.setUint8(offset + i, value.charCodeAt(i));
  }
};

const createIncomingCallSoundUrl = () => {
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

  let noise = 0;
  const patternStarts = [0, 1.35, 2.7, 4.05];
  const patternHitStarts = [0.06, 0.26, 0.46, 0.68];
  const patternBodyFrequencies = [215, 235, 285, 220];
  const patternBodyGains = [2.35, 1.45, 1, 1];
  const patternTapGains = [0.18, 0.45, 0.38, 0.38];

  for (let i = 0; i < sampleCount; i += 1) {
    const time = i / SAMPLE_RATE;
    const patternIndex = patternStarts.findIndex((start) => time >= start && time < start + 0.92);
    const patternTime = patternIndex === -1 ? 0 : time - patternStarts[patternIndex];
    const hitIndex = patternHitStarts.findIndex(
      (start) => patternTime >= start && patternTime < start + 0.24
    );
    const isActiveHit = hitIndex !== -1;
    const hitTime = isActiveHit ? patternTime - patternHitStarts[hitIndex] : 0;
    const bodyFrequency = isActiveHit ? patternBodyFrequencies[hitIndex] : 185;
    const hitAttack = Math.min(1, hitTime / 0.008);
    const hitEnvelope = isActiveHit ? hitAttack * Math.exp(-24 * hitTime) : 0;
    const body =
      (Math.sin(2 * Math.PI * bodyFrequency * hitTime) +
        Math.sin(2 * Math.PI * (bodyFrequency / 2) * hitTime) * 0.22) *
      hitEnvelope;

    noise = noise * 0.82 + (Math.random() * 2 - 1) * 0.18;
    const softTap = noise * hitAttack * Math.exp(-52 * hitTime) * (isActiveHit ? 1 : 0);
    const rawSample =
      body * 0.62 * (isActiveHit ? patternBodyGains[hitIndex] : 0) +
      softTap * 0.38 * (isActiveHit ? patternTapGains[hitIndex] : 0);
    const sample = Math.max(-1, Math.min(1, rawSample));

    view.setInt16(44 + i * bytesPerSample, sample * 0x7fff, true);
  }

  return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
};

export const playConversationCallIncomingSound = (applySinkId: ApplySinkId, muted: boolean) => {
  if (muted || typeof Audio === 'undefined') return;

  cachedSoundUrl ??= createIncomingCallSoundUrl();
  stopConversationCallIncomingSound();

  const audioElement = new Audio(cachedSoundUrl);
  activeAudioElement = audioElement;
  audioElement.volume = VOLUME;
  applySinkId(audioElement);
  audioElement.addEventListener(
    'ended',
    () => {
      if (activeAudioElement === audioElement) {
        activeAudioElement = null;
      }
    },
    { once: true }
  );

  void audioElement.play().catch((error) => {
    if (activeAudioElement === audioElement) {
      activeAudioElement = null;
    }
    console.error('[ConversationCall] Failed to play incoming call sound', error);
  });
};

export const stopConversationCallIncomingSound = () => {
  if (!activeAudioElement) return;

  activeAudioElement.pause();
  activeAudioElement.currentTime = 0;
  activeAudioElement = null;
};
