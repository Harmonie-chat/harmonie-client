import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { DEFAULT_PARTICIPANT_VOLUME, useParticipantVolumes } from './useParticipantVolumes';

const audioElement = (participantId: string) => {
  const audio = document.createElement('audio');
  audio.dataset.participantId = participantId;
  return audio;
};

describe('useParticipantVolumes', () => {
  it('reads stored volumes and clamps invalid values', () => {
    localStorage.setItem(
      'harmonie:voiceParticipantVolumes',
      JSON.stringify({
        low: -1,
        normal: 0.7,
        high: 2,
        invalid: 'loud',
      })
    );

    const { result } = renderHook(() => useParticipantVolumes({ current: new Map() }));

    expect(result.current.participantVolumes).toEqual({
      low: 0,
      normal: 0.7,
      high: 1,
    });
  });

  it('sets participant volume, persists it, and applies it to matching audio elements', () => {
    const adaAudio = audioElement('ada');
    const graceAudio = audioElement('grace');
    const audioMap = new Map([
      ['audio-1', adaAudio],
      ['audio-2', graceAudio],
    ]);
    const { result } = renderHook(() => useParticipantVolumes({ current: audioMap }));

    act(() => {
      result.current.setParticipantVolume('ada', 1.5);
    });

    expect(result.current.getParticipantVolume('ada')).toBe(1);
    expect(adaAudio.volume).toBe(1);
    expect(graceAudio.volume).toBe(1);
    expect(localStorage.getItem('harmonie:voiceParticipantVolumes')).toContain('"ada":1');
  });

  it('toggles mute and restores the previous non-zero volume', () => {
    const adaAudio = audioElement('ada');
    const { result } = renderHook(() =>
      useParticipantVolumes({ current: new Map([['audio-1', adaAudio]]) })
    );

    expect(result.current.getParticipantVolume('ada')).toBe(DEFAULT_PARTICIPANT_VOLUME);

    act(() => {
      result.current.setParticipantVolume('ada', 0.25);
    });
    act(() => {
      result.current.toggleParticipantMute('ada');
    });

    expect(result.current.getParticipantVolume('ada')).toBe(0);
    expect(adaAudio.volume).toBe(0);

    act(() => {
      result.current.toggleParticipantMute('ada');
    });

    expect(result.current.getParticipantVolume('ada')).toBe(0.25);
    expect(adaAudio.volume).toBe(0.25);
  });
});
