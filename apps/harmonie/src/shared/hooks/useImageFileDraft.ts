import { useEffect, useRef, useState } from 'react';

export const useImageFileDraft = () => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>();

  const revokeUrl = (url?: string) => {
    if (url) URL.revokeObjectURL(url);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextFile = e.target.files?.[0];
    if (!nextFile) return;

    setPreviewUrl((previous) => {
      revokeUrl(previous);
      return URL.createObjectURL(nextFile);
    });
    setFile(nextFile);
  };

  const clear = () => {
    setPreviewUrl((previous) => {
      revokeUrl(previous);
      return undefined;
    });
    setFile(null);
    if (inputRef.current) inputRef.current.value = '';
  };

  useEffect(() => {
    return () => revokeUrl(previewUrl);
  }, [previewUrl]);

  return {
    inputRef,
    file,
    previewUrl,
    onFileChange,
    clear,
  };
};
