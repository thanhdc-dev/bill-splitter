# Tích hợp Angular với image-resize Worker

Worker phục vụ ảnh từ R2 qua `fetch` + `cf.image`. Angular chỉ cần build URL đúng contract. Chi tiết Worker (deploy, rule query, bucket) nằm ở repo Worker riêng, không thuộc repo này.

## URL contract

| Mục đích | URL |
|----------|-----|
| **Full-size** | `{cdnBase}/{storagePath}` |
| **Resize** | `{cdnBase}/{storagePath}?width=320&quality=75` |

- `storagePath` = key trên bucket R2 (vd. `users/123/albums/456/photo.jpg`), khớp pathname Worker. Backend trả về field này; FE không tự dựng key.
- `cdnBase` = domain CDN của Worker (hiện là `https://cdn-chiatien.thanhdc.app`; không dùng `*.r2.dev` trên `<img>`).
- Query hợp lệ: `width`/`w`, `height`/`h`, `quality`/`q`, `fit`, `dpr`. Resize bắt buộc có `width`. _(Rule phía Worker.)_
- `width` chỉ nhận preset `[64, 128, 320, 640, 960, 1280, 1920]`: Worker làm tròn về preset gần nhất (hòa thì lấy giá trị lớn hơn, vd. 800 → 960) và kẹp trong 64–1920. FE ép đúng preset bằng kiểu `ImageWidthPreset` để URL, cache key và descriptor `srcset` khớp ảnh thật.
- Chỉ có `width` mà thiếu `height` thì Worker tự bỏ `fit=crop`.
- Định dạng WebP/AVIF: browser gửi `Accept`; Worker tự negotiate — không cần query `format`.

## Cấu trúc file (trong repo này)

```
src/
  environments/
    environment.ts               # production (build mặc định)
    environment.development.ts   # dev, thay thế environment.ts qua fileReplacements
  app/core/cdn/
    image-cdn.types.ts
    image-cdn-url.service.ts
    image-cdn-url.pipe.ts
    index.ts                     # barrel: export types + service + pipe
```

## Environment

`angular.json` (configuration `development`) dùng `fileReplacements` để thay `environment.ts` bằng `environment.development.ts`. Không có `environment.prod.ts`.

```typescript
// src/environments/environment.ts (production)
export const environment = {
  production: true,
  appUrl: 'https://chiatien.thanhdc.app',
  apiUrl: 'https://api.thanhdc.app',
  appKey: 'chiatien',
  cdnBase: 'https://cdn-chiatien.thanhdc.app',
};
```

```typescript
// src/environments/environment.development.ts
export const environment = {
  production: false,
  appUrl: 'http://localhost:4200',
  apiUrl: 'http://localhost:3000',
  appKey: 'chiatien',
  cdnBase: 'https://cdn-chiatien.thanhdc.app',
};
```

> Dev và prod dùng chung `cdnBase` vì `wrangler dev` không áp dụng `cf.image` — resize chỉ test được trên môi trường đã deploy.

## Types

```typescript
// src/app/core/cdn/image-cdn.types.ts
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
```

## Service

```typescript
// src/app/core/cdn/image-cdn-url.service.ts
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import {
  IMAGE_WIDTH_PRESETS,
  type ImageResizeOptions,
  type ImageWidthPreset,
} from './image-cdn.types';

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
   * Mặc định dùng toàn bộ preset của Worker.
   */
  srcset(
    storagePath: string,
    widths: readonly ImageWidthPreset[] = IMAGE_WIDTH_PRESETS,
    quality = 75,
  ): string {
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
```

### Ví dụ output

```typescript
const key = 'users/123/albums/456/photo.jpg';

cdn.fullSize(key);
// → https://cdn-chiatien.thanhdc.app/users/123/albums/456/photo.jpg

cdn.url(key, { width: 320, quality: 75 });
// → https://cdn-chiatien.thanhdc.app/users/123/albums/456/photo.jpg?quality=75&width=320

cdn.srcset(key, [320, 640], 75);
// → ...?quality=75&width=320 320w, ...?quality=75&width=640 640w
```

## Pipe

```typescript
// src/app/core/cdn/image-cdn-url.pipe.ts
import { Pipe, PipeTransform, inject } from '@angular/core';
import { ImageCdnUrlService } from './image-cdn-url.service';
import type { ImageResizeOptions } from './image-cdn.types';

@Pipe({ name: 'imageCdn', standalone: true })
export class ImageCdnUrlPipe implements PipeTransform {
  private readonly cdn = inject(ImageCdnUrlService);

  transform(
    storagePath: string | null | undefined,
    resize?: ImageResizeOptions,
  ): string {
    if (!storagePath) return '';
    return resize?.width != null
      ? this.cdn.url(storagePath, resize)
      : this.cdn.fullSize(storagePath);
  }
}
```

> Pipe đã được triển khai nhưng **hiện chưa có template nào dùng** (`image-upload` gọi thẳng `ImageCdnUrlService`).

## Model từ API

Backend chỉ trả **storagePath** (key trên R2), không build URL CDN. Input thực tế của `image-upload`:

```typescript
// src/app/components/image-upload/image-upload.ts
@Input() set imageStoragePaths(images: { id?: number; storagePath: string }[]) { ... }
```

## Sử dụng thực tế trong repo

Nơi duy nhất dùng CDN hiện tại là component `image-upload` ([image-upload.ts](../src/app/components/image-upload/image-upload.ts), [image-upload.html](../src/app/components/image-upload/image-upload.html)):

| Mục đích | Cách dùng |
|----------|-----------|
| Preview ảnh đã lưu | `cdn.url(storagePath, { width: 960, quality: 85 })` → `previewUrl` |
| Responsive | `[attr.srcset]="cdn.srcset(image.storagePath, [128, 320, 640, 960])"` + `sizes="(max-width: 767px) 50vw, (min-width: 768px) 300px, 100vw"` |
| Lightbox / full-size | `cdn.fullSize(image.storagePath)` |
| Ảnh mới upload (chưa lưu) | Không qua CDN — dùng blob URL local |

`cdn` được khai báo `public readonly cdn = inject(ImageCdnUrlService)` để template gọi trực tiếp.

## Component mẫu (generic)

Ví dụ minh hoạ — **không tồn tại trong repo**.

```typescript
import { Component, inject, input } from '@angular/core';
import { ImageCdnUrlService } from '../core/cdn';

@Component({
  selector: 'app-photo-card',
  standalone: true,
  template: `
    <img
      [src]="thumbUrl()"
      [srcset]="thumbSrcset()"
      sizes="(max-width: 600px) 100vw, 300px"
      [alt]="alt()"
      loading="lazy"
      decoding="async"
    />
    <a [href]="fullUrl()" target="_blank" rel="noopener">Xem gốc</a>
  `,
})
export class PhotoCardComponent {
  private readonly cdn = inject(ImageCdnUrlService);

  storagePath = input.required<string>();
  alt = input('');

  thumbUrl = () =>
    this.cdn.url(this.storagePath(), { width: 320, quality: 75 });

  thumbSrcset = () =>
    this.cdn.srcset(this.storagePath(), [320, 640, 960], 75);

  fullUrl = () => this.cdn.fullSize(this.storagePath());
}
```

### Template với pipe (minh hoạ)

```html
<img
  [src]="file.storagePath | imageCdn : { width: 320, quality: 75 }"
  [attr.srcset]="cdn.srcset(file.storagePath, [320, 640], 75)"
  sizes="(max-width: 600px) 100vw, 50vw"
  alt=""
/>

<a [href]="file.storagePath | imageCdn">Full size</a>
```

## Checklist

- [ ] `environment.cdnBase` trỏ domain CDN của Worker, không trỏ `pub-*.r2.dev`.
- [ ] `storagePath` khớp key upload lên bucket R2 (backend trả về).
- [ ] Thumbnail/list: `url(path, { width, quality })` + `srcset` nhiều `width`, luôn dùng giá trị trong preset.
- [ ] Lightbox / download: `fullSize(path)`.
- [ ] Test resize trên môi trường đã deploy (`wrangler dev` không áp dụng `cf.image`).
