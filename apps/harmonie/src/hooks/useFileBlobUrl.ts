import { useEffect, useState } from 'react';
import { downloadFileBlob } from '@/api/files';

export const useFileBlobUrl = (fileId?: string | null): string | undefined => {
  const [blobUrl, setBlobUrl] = useState<string>();

  useEffect(() => {
    let active = true;
    let currentUrl: string | undefined;

    if (!fileId) {
      setBlobUrl(undefined);
      return;
    }

    downloadFileBlob(fileId)
      .then((blob) => {
        if (!active) return;
        currentUrl = URL.createObjectURL(blob);
        setBlobUrl(currentUrl);
      })
      .catch(() => {
        if (active) setBlobUrl(undefined);
      });

    return () => {
      active = false;
      if (currentUrl) URL.revokeObjectURL(currentUrl);
    };
  }, [fileId]);

  return blobUrl;
};
