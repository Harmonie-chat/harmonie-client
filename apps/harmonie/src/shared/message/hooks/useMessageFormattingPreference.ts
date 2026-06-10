import { useEffect, useState } from 'react';

const STORAGE_KEY = 'harmonie:message-formatting-open';

const readStoredPreference = () => {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY) === 'true';
};

export const useMessageFormattingPreference = () => {
  const [formattingOpen, setFormattingOpen] = useState(readStoredPreference);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, String(formattingOpen));
  }, [formattingOpen]);

  const toggleFormattingOpen = () => {
    setFormattingOpen((current) => !current);
  };

  return {
    formattingOpen,
    toggleFormattingOpen,
  };
};
