export const syncKeyboardInset = () => {
  if (typeof window === 'undefined' || !window.visualViewport) return;

  const updateKeyboardInset = () => {
    const viewport = window.visualViewport;
    if (!viewport) return;

    const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
    document.documentElement.style.setProperty('--keyboard-inset', `${Math.round(inset)}px`);
  };

  updateKeyboardInset();
  window.visualViewport.addEventListener('resize', updateKeyboardInset, { passive: true });
  window.visualViewport.addEventListener('scroll', updateKeyboardInset, { passive: true });
  window.addEventListener('orientationchange', updateKeyboardInset);
};
