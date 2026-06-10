import { useSyncExternalStore } from 'react';

const MOBILE_INTERACTION_QUERY = '(hover: none), (pointer: coarse), (max-width: 767px)';

export const isCoarsePointerDevice = () =>
  typeof window !== 'undefined' && window.matchMedia(MOBILE_INTERACTION_QUERY).matches;

const subscribeToCoarsePointer = (callback: () => void) => {
  if (typeof window === 'undefined') return () => {};

  const media = window.matchMedia(MOBILE_INTERACTION_QUERY);
  media.addEventListener('change', callback);
  return () => media.removeEventListener('change', callback);
};

const getServerCoarsePointerSnapshot = () => false;

export const useCoarsePointer = () => {
  return useSyncExternalStore(
    subscribeToCoarsePointer,
    isCoarsePointerDevice,
    getServerCoarsePointerSnapshot
  );
};
