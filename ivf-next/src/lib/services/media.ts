import {
  MediaCycleOption,
  MediaItem,
  LibraryItem,
  MediaPrintData,
} from '@/lib/types/media';

function authHeaders(token: string, json = true): HeadersInit {
  const h: Record<string, string> = {
    Authorization: `Bearer ${token}`,
  };
  if (json) {
    h['Content-Type'] = 'application/json';
  }
  return h;
}

export async function fetchMediaCycles(
  token: string,
  patId: number,
  satId: number
): Promise<MediaCycleOption[]> {
  const res = await fetch(`/api/media/cycles?patId=${patId}&satId=${satId}`, {
    headers: authHeaders(token, false),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to load cycles.');
  }
  return data.data || [];
}

export async function fetchMediaList(
  token: string,
  cycId: string,
  patId: number,
  satId: number,
  catId = 0
): Promise<{ items: MediaItem[]; selectedCount: number }> {
  const res = await fetch(
    `/api/media?cycId=${encodeURIComponent(cycId)}&patId=${patId}&satId=${satId}&catId=${catId}`,
    {
      headers: authHeaders(token, false),
    }
  );
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to load media.');
  }
  return data.data || { items: [], selectedCount: 0 };
}

export async function saveMedia(
  token: string,
  formData: FormData
): Promise<{ success: boolean; message: string; mediaFile?: string }> {
  const res = await fetch('/api/media', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to save media.');
  }
  return data;
}

export async function deleteMedia(
  token: string,
  mediaId: number,
  cycId: string,
  patId: number,
  satId: number
): Promise<void> {
  const res = await fetch(
    `/api/media?mediaId=${mediaId}&cycId=${encodeURIComponent(cycId)}&patId=${patId}&satId=${satId}`,
    {
      method: 'DELETE',
      headers: authHeaders(token, false),
    }
  );
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to delete media.');
  }
}

export async function toggleMediaSelect(
  token: string,
  mediaId: number,
  patId: number,
  satId: number,
  selected: boolean
): Promise<void> {
  const res = await fetch('/api/media', {
    method: 'POST',
    headers: authHeaders(token, true),
    body: JSON.stringify({
      action: 'toggle-selected',
      mediaId,
      patId,
      satId,
      selected,
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to update selection.');
  }
}

export async function fetchLibraryFiles(token: string): Promise<LibraryItem[]> {
  const res = await fetch('/api/media/library', {
    headers: authHeaders(token, false),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to load media library.');
  }
  return data.data || [];
}

export async function uploadToLibrary(
  token: string,
  file: File
): Promise<{ fileName: string; url: string }> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch('/api/media/library', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to upload to library.');
  }
  return data.data;
}

export async function deleteFromLibrary(token: string, fileName: string): Promise<void> {
  const res = await fetch(`/api/media/library?fileName=${encodeURIComponent(fileName)}`, {
    method: 'DELETE',
    headers: authHeaders(token, false),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to delete file from library.');
  }
}

export async function fetchPrintReportData(
  token: string,
  cycId: string,
  patId: number,
  satId: number
): Promise<MediaPrintData> {
  const res = await fetch(
    `/api/media/print?cycId=${encodeURIComponent(cycId)}&patId=${patId}&satId=${satId}`,
    {
      headers: authHeaders(token, false),
    }
  );
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || 'Failed to fetch print report data.');
  }
  return data.data;
}
