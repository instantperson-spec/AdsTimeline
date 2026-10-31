import { CommercialAd, CommercialShow } from '@/types/timeline';

async function parseJson<T>(res: Response): Promise<T> {
  const data = await res.json();
  if (!res.ok) {
    throw new Error(typeof data.error === 'string' ? data.error : 'Request failed');
  }
  return data as T;
}

export async function fetchTimelineData(): Promise<{ shows: CommercialShow[]; ads: CommercialAd[] }> {
  const res = await fetch('/api/timeline', { cache: 'no-store' });
  return parseJson(res);
}

export async function apiCreateShow(show: CommercialShow): Promise<CommercialShow> {
  const res = await fetch('/api/shows', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(show),
  });
  return parseJson(res);
}

export async function apiDeleteShow(showId: string): Promise<void> {
  const res = await fetch(`/api/shows/${encodeURIComponent(showId)}`, { method: 'DELETE' });
  await parseJson(res);
}

export async function apiUpdateShowBreakCount(showId: string, breakCount: number): Promise<void> {
  const res = await fetch(`/api/shows/${encodeURIComponent(showId)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ breakCount }),
  });
  await parseJson(res);
}

export async function apiRemoveBreak(
  showId: string,
  breakNumber: number
): Promise<{ shows: CommercialShow[]; ads: CommercialAd[] }> {
  const res = await fetch(`/api/shows/${encodeURIComponent(showId)}/remove-break`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ breakNumber }),
  });
  return parseJson(res);
}

export async function apiCreateAd(ad: CommercialAd): Promise<CommercialAd> {
  const res = await fetch('/api/ads', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ad),
  });
  return parseJson(res);
}

export async function apiUpdateAd(ad: CommercialAd): Promise<CommercialAd> {
  const res = await fetch(`/api/ads/${encodeURIComponent(ad.id)}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(ad),
  });
  return parseJson(res);
}

export async function apiDeleteAd(adId: string): Promise<void> {
  const res = await fetch(`/api/ads/${encodeURIComponent(adId)}`, { method: 'DELETE' });
  await parseJson(res);
}

export async function uploadMediaFile(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append('file', file);
  const res = await fetch('/api/media/upload', { method: 'POST', body: formData });
  return parseJson(res);
}
