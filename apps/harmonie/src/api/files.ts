import { apiFetch } from './client';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export const downloadFileBlob = async (fileId: string): Promise<Blob> => {
  const response = await apiFetch(`${API_BASE}/files/${encodeURIComponent(fileId)}`);
  if (!response.ok) {
    throw new Error(`Failed to download file (${response.status})`);
  }
  return response.blob();
};
