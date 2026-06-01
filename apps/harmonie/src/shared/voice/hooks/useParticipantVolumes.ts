import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

const PARTICIPANT_VOLUME_STORAGE_KEY = 'harmonie:voiceParticipantVolumes';
export const DEFAULT_PARTICIPANT_VOLUME = 0.5;

export const useParticipantVolumes = (
  remoteAudioElementsRef: RefObject<Map<string, HTMLAudioElement>>
) => {
  const [participantVolumes, setParticipantVolumes] = useState<Record<string, number>>(() => {
    if (typeof window === 'undefined') return {};
    try {
      const stored = window.localStorage.getItem(PARTICIPANT_VOLUME_STORAGE_KEY);
      if (!stored) return {};
      const parsed = JSON.parse(stored) as Record<string, unknown>;
      return Object.fromEntries(
        Object.entries(parsed)
          .filter(([, value]) => typeof value === 'number' && Number.isFinite(value))
          .map(([participantId, value]) => [
            participantId,
            Math.min(1, Math.max(0, value as number)),
          ])
      );
    } catch {
      return {};
    }
  });
  const participantVolumesRef = useRef(participantVolumes);

  useEffect(() => {
    participantVolumesRef.current = participantVolumes;
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(PARTICIPANT_VOLUME_STORAGE_KEY, JSON.stringify(participantVolumes));
  }, [participantVolumes]);

  const getParticipantVolume = useCallback(
    (participantId: string) => participantVolumes[participantId] ?? DEFAULT_PARTICIPANT_VOLUME,
    [participantVolumes]
  );

  const applyParticipantVolume = useCallback(
    (participantId: string, volume: number) => {
      remoteAudioElementsRef.current?.forEach((audioEl) => {
        if (audioEl.dataset.participantId === participantId) {
          audioEl.volume = volume;
        }
      });
    },
    [remoteAudioElementsRef]
  );

  const setParticipantVolume = useCallback(
    (participantId: string, volume: number) => {
      const nextVolume = Math.min(1, Math.max(0, volume));
      setParticipantVolumes((prev) => {
        const next = { ...prev, [participantId]: nextVolume };
        participantVolumesRef.current = next;
        return next;
      });
      applyParticipantVolume(participantId, nextVolume);
    },
    [applyParticipantVolume]
  );

  return {
    participantVolumes,
    participantVolumesRef,
    getParticipantVolume,
    setParticipantVolume,
  };
};
