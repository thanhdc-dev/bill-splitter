import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import type { ImageResizeOptions } from './image-cdn.types';

@Injectable({ providedIn: 'root' })
export class ImageCdnUrlService {
  /** Ảnh gốc — không có query resize. Dùng cho lightbox / download. */
  fullSize(storagePath: string): string {
    const key = this.normalizeKey(storagePath);
    return `${this.trimBase(environment.cdnBase)}/${key}`;
  }

  /**
   * Có `width` → resize qua Worker; không có → trả `fullSize`.
   * Dùng cho thumbnail, card, preview.
   */
  url(storagePath: string, resize?: ImageResizeOptions): string {
    const key = this.normalizeKey(storagePath);
    const base = `${this.trimBase(environment.cdnBase)}/${key}`;
    if (resize?.width == null) {
      return base;
    }
    const qs = this.buildQuery(resize);
    return qs ? `${base}?${qs}` : base;
  }

  /**
   * Responsive images srcset — `"url 300w, url 600w, ..."`.
   * Dùng với thuộc tính `srcset` và `sizes` của `<img>`.
   */
  srcset(storagePath: string, widths: number[], quality = 75): string {
    return widths
      .map((w) => `${this.url(storagePath, { width: w, quality })} ${w}w`)
      .join(', ');
  }

  buildQuery(opts: ImageResizeOptions): string {
    const params = new URLSearchParams();
    const set = (k: string, v: string | number | undefined) => {
      if (v !== undefined && v !== '') {
        params.set(k, String(v));
      }
    };
    set('width', opts.width);
    set('height', opts.height);
    set('quality', opts.quality);
    set('fit', opts.fit);
    set('dpr', opts.dpr);
    params.sort();
    return params.toString();
  }

  private normalizeKey(key: string): string {
    return key
      .replace(/^\/+/, '')
      .split('/')
      .map((segment) => encodeURIComponent(segment))
      .join('/');
  }

  private trimBase(base: string): string {
    return base.replace(/\/+$/, '');
  }
}
