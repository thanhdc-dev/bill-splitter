export type ImageFit = 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';

/**
 * Width preset mà Worker hỗ trợ. Worker làm tròn về preset gần nhất
 * (hòa thì lấy lớn hơn) và kẹp trong 64–1920.
 */
export const IMAGE_WIDTH_PRESETS = [64, 128, 320, 640, 960, 1280, 1920] as const;

export type ImageWidthPreset = (typeof IMAGE_WIDTH_PRESETS)[number];

export interface ImageResizeOptions {
  width: ImageWidthPreset;
  height?: number;
  quality?: number;
  /** Worker bỏ `fit=crop` nếu thiếu `height`. */
  fit?: ImageFit;
  dpr?: number;
}
