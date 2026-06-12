export type ImageFit = 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';

export interface ImageResizeOptions {
  width: number;
  height?: number;
  quality?: number;
  fit?: ImageFit;
  dpr?: number;
}
