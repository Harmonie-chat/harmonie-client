import { useState } from 'react';
import { loadBlobUrl } from './useFileBlobUrl';

export const useFileDownload = () => {
  const [downloading, setDownloading] = useState(false);

  const download = async (fileId: string, fileName: string) => {
    if (downloading) return;
    setDownloading(true);
    const error = await loadBlobUrl(fileId).then(
      (url) => {
        if (!url) return;
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        return undefined;
      },
      (err: unknown) => err
    );
    setDownloading(false);
    if (error) throw error;
  };

  return { download, downloading };
};
