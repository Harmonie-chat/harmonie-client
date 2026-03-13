import { apiFetch } from './client';

const API_BASE = import.meta.env.VITE_API_BASE_URL;

export interface UploadedFile {
  fileId: string;
  filename: string;
  contentType: string;
  sizeBytes: number;
}

export const downloadFileBlob = async (fileId: string): Promise<Blob> => {
  const response = await apiFetch(`${API_BASE}/files/${encodeURIComponent(fileId)}`);
  if (!response.ok) {
    throw new Error(`Failed to download file (${response.status})`);
  }
  return response.blob();
};

export const uploadFile = async (file: File): Promise<UploadedFile> => {
  const formData = new FormData();
  formData.append('file', file);

  const response = await apiFetch(`${API_BASE}/files/uploads`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw await response.json();
  }

  return response.json();
};
