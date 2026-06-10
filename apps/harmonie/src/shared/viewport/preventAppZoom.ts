export const preventAppZoom = () => {
  if (typeof window === 'undefined') return;
  if (!window.matchMedia('(hover: none), (pointer: coarse), (max-width: 767px)').matches) return;

  const preventGesture = (event: Event) => {
    event.preventDefault();
  };

  document.addEventListener('gesturestart', preventGesture, { passive: false });
  document.addEventListener('gesturechange', preventGesture, { passive: false });
  document.addEventListener('gestureend', preventGesture, { passive: false });
};
