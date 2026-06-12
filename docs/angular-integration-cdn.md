# Tích hợp Angular với image-resize Worker

Worker phục vụ ảnh từ R2 qua `fetch` + `cf.image`. Angular chỉ cần build URL đúng contract — xem [image-resize-worker.md](./image-resize-worker.md) để biết chi tiết Worker.

## URL contract

| Mục đích | URL |
|----------|-----|
| **Full-size** | `{cdnBase}/{objectKey}` |
| **Resize** | `{cdnBase}/{objectKey}?width=300&quality=75` |

- `objectKey` = key trên bucket R2 (vd. `users/123/albums/456/photo.jpg`), khớp pathname Worker.
- `cdnBase` = URL Worker đã deploy (không dùng `*.r2.dev` trên `<img>`).
- Query hợp lệ: `width`/`w`, `height`/`h`, `quality`/`q`, `fit`, `dpr`. Resize bắt buộc có `width` (1–2000).
- Định dạng WebP/AVIF: browser gửi `Accept`; Worker tự negotiate — không cần query `format`.

## Cấu trúc file gợi ý (trong app Angular)

```
src/
  environments/
    environment.ts
    environment.prod.ts
  app/core/cdn/
    image-cdn.types.ts
    image-cdn-url.service.ts
    image-cdn-url.pipe.ts          # tùy chọn
```

## Environment

```typescript
// src/environments/environment.ts
export const environment = {
  production: false,
  cdnBase: 'https://image-resize.<account>.workers.dev',
};
```

```typescript
// src/environments/environment.prod.ts
export const environment = {
  production: true,
  cdnBase: 'https://cdn.example.com',
};
```

## Types

```typescript
// src/app/core/cdn/image-cdn.types.ts
export type ImageFit = 'scale-down' | 'contain' | 'cover' | 'crop' | 'pad';

export interface ImageResizeOptions {
  width: number;
  height?: number;
  quality?: number;
  fit?: ImageFit;
  dpr?: number;
}
```

## Service

```typescript
// src/app/core/cdn/image-cdn-url.service.ts
import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import type { ImageResizeOptions } from './image-cdn.types';

@Injectable({ providedIn: 'root' })
export class ImageCdnUrlService {
  /** Ảnh gốc — không có query resize. */
  fullSize(objectKey: string): string {
    const key = this.normalizeKey(objectKey);
    return `${this.trimBase(environment.cdnBase)}/${key}`;
  }

  /** Có `width` → resize; không có → `fullSize`. */
  url(objectKey: string, resize?: ImageResizeOptions): string {
    const key = this.normalizeKey(objectKey);
    const base = `${this.trimBase(environment.cdnBase)}/${key}`;
    if (resize?.width == null) {
      return base;
    }
    const qs = this.buildQuery(resize);
    return qs ? `${base}?${qs}` : base;
  }

  /** Responsive images: `"url 300w, url 600w, ..."`. */
  srcset(objectKey: string, widths: number[], quality = 75): string {
    return widths
      .map((w) => `${this.url(objectKey, { width: w, quality })} ${w}w`)
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
// → https://image-resize.<account>.workers.dev/users/123/albums/456/photo.jpg

cdn.url(key, { width: 300, quality: 75 });
// → https://image-resize.<account>.workers.dev/users/123/albums/456/photo.jpg?quality=75&width=300

cdn.srcset(key, [300, 600], 75);
// → ...?quality=75&width=300 300w, ...?quality=75&width=600 600w
```

## Pipe (tùy chọn)

```typescript
// src/app/core/cdn/image-cdn-url.pipe.ts
import { Pipe, PipeTransform, inject } from '@angular/core';
import { ImageCdnUrlService } from './image-cdn-url.service';
import type { ImageResizeOptions } from './image-cdn.types';

@Pipe({ name: 'imageCdn', standalone: true })
export class ImageCdnUrlPipe implements PipeTransform {
  private readonly cdn = inject(ImageCdnUrlService);

  transform(
    objectKey: string | null | undefined,
    resize?: ImageResizeOptions,
  ): string {
    if (!objectKey) return '';
    return resize?.width != null
      ? this.cdn.url(objectKey, resize)
      : this.cdn.fullSize(objectKey);
  }
}
```

## Model từ API

Backend chỉ cần trả **object key** (path trên R2), không build URL CDN:

```typescript
export interface Photo {
  id: string;
  objectKey: string; // "users/123/albums/456/photo.jpg"
}
```

## Component mẫu

```typescript
import { Component, inject, input } from '@angular/core';
import { ImageCdnUrlService } from '../core/cdn/image-cdn-url.service';

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

  objectKey = input.required<string>();
  alt = input('');

  thumbUrl = () =>
    this.cdn.url(this.objectKey(), { width: 300, quality: 75 });

  thumbSrcset = () =>
    this.cdn.srcset(this.objectKey(), [300, 600, 900], 75);

  fullUrl = () => this.cdn.fullSize(this.objectKey());
}
```

### Template với pipe

```html
<img
  [src]="photo.objectKey | imageCdn : { width: 300, quality: 75 }"
  [srcset]="cdn.srcset(photo.objectKey, [300, 600], 75)"
  sizes="(max-width: 600px) 100vw, 50vw"
  alt=""
/>

<a [href]="photo.objectKey | imageCdn">Full size</a>
```

## Checklist

- [ ] `environment.cdnBase` trỏ Worker (sau `npm run deploy`), không trỏ `pub-*.r2.dev`.
- [ ] `objectKey` khớp key upload lên bucket `api-thanhdc-dev`.
- [ ] Thumbnail/list: `url(key, { width, quality })` + `srcset` nhiều `width`.
- [ ] Lightbox / download: `fullSize(key)`.
- [ ] Test resize trên môi trường đã deploy (`wrangler dev` không áp dụng `cf.image`).
