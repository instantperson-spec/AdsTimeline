export type MediaAssetKind = 'image_only' | 'video_and_poster';

export interface MediaAsset {
  id: string;
  label: string;
  kind: MediaAssetKind;
  posterUrl: string;
  posterPathname: string;
  videoUrl?: string;
  videoPathname?: string;
  referenceCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface MediaAssetListItem extends MediaAsset {}
