import { useEffect, useState } from 'react';
import { downloadFileBlob } from '@/api/files';

const CACHE_TTL_MS = 10 * 60 * 1000;
const FAILURE_TTL_MS = 30 * 1000;
const MAX_CACHE_ENTRIES = 200;

interface CachedBlobUrlEntry {
  url: string;
  expiresAt: number;
  lastAccessedAt: number;
}

const blobUrlCache = new Map<string, CachedBlobUrlEntry>();
const inFlightDownloads = new Map<string, Promise<string | undefined>>();
const failedDownloadsUntil = new Map<string, number>();

const revokeAndDeleteCacheEntry = (fileId: string) => {
  const existing = blobUrlCache.get(fileId);
  if (existing) URL.revokeObjectURL(existing.url);
  blobUrlCache.delete(fileId);
};

const purgeExpiredCacheEntries = (now: number) => {
  for (const [fileId, entry] of blobUrlCache) {
    if (entry.expiresAt <= now) revokeAndDeleteCacheEntry(fileId);
  }
  for (const [fileId, blockedUntil] of failedDownloadsUntil) {
    if (blockedUntil <= now) failedDownloadsUntil.delete(fileId);
  }
};

const enforceCacheLimit = () => {
  if (blobUrlCache.size <= MAX_CACHE_ENTRIES) return;
  const sortedByAccess = Array.from(blobUrlCache.entries()).sort(
    (a, b) => a[1].lastAccessedAt - b[1].lastAccessedAt
  );
  const itemsToEvict = blobUrlCache.size - MAX_CACHE_ENTRIES;
  for (let i = 0; i < itemsToEvict; i += 1) {
    const [fileId] = sortedByAccess[i];
    revokeAndDeleteCacheEntry(fileId);
  }
};

export const loadBlobUrl = async (fileId: string): Promise<string | undefined> => {
  const now = Date.now();
  purgeExpiredCacheEntries(now);

  const cachedEntry = blobUrlCache.get(fileId);
  if (cachedEntry) {
    cachedEntry.lastAccessedAt = now;
    cachedEntry.expiresAt = now + CACHE_TTL_MS;
    return cachedEntry.url;
  }

  const blockedUntil = failedDownloadsUntil.get(fileId);
  if (blockedUntil && blockedUntil > now) return undefined;

  const ongoing = inFlightDownloads.get(fileId);
  if (ongoing) return ongoing;

  const request = downloadFileBlob(fileId)
    .then((blob) => {
      const url = URL.createObjectURL(blob);
      const cacheNow = Date.now();
      blobUrlCache.set(fileId, {
        url,
        expiresAt: cacheNow + CACHE_TTL_MS,
        lastAccessedAt: cacheNow,
      });
      enforceCacheLimit();
      return url;
    })
    .catch(() => {
      failedDownloadsUntil.set(fileId, Date.now() + FAILURE_TTL_MS);
      return undefined;
    })
    .finally(() => {
      inFlightDownloads.delete(fileId);
    });

  inFlightDownloads.set(fileId, request);
  return request;
};

interface BlobUrlState {
  fileId: string;
  url: string | undefined;
}

export const useFileBlobUrl = (fileId?: string | null): string | undefined => {
  const [state, setState] = useState<BlobUrlState>({ fileId: '', url: undefined });

  useEffect(() => {
    let active = true;

    if (!fileId) return;

    loadBlobUrl(fileId)
      .then((url) => {
        if (!active) return;
        setState({ fileId, url });
      })
      .catch(() => {
        if (active) setState({ fileId, url: undefined });
      });

    return () => {
      active = false;
    };
  }, [fileId]);

  return fileId && state.fileId === fileId ? state.url : undefined;
};
