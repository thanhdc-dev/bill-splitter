import { Pipe, PipeTransform, inject } from '@angular/core';
import { ImageCdnUrlService } from './image-cdn-url.service';
import type { ImageResizeOptions } from './image-cdn.types';

/**
 * Pipe `imageCdn` — build CDN URL từ storagePath (R2 object key).
 *
 * @example
 * <!-- Thumbnail -->
 * <img [src]="file.storagePath | imageCdn : { width: 300, quality: 75 }" />
 *
 * <!-- Ảnh gốc (lightbox / download) -->
 * <a [href]="file.storagePath | imageCdn">Full size</a>
 */
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
