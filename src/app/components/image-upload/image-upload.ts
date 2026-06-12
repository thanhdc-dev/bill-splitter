import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ImageCdnUrlService } from '../../core/cdn/image-cdn-url.service';

/**
 * Đại diện cho một ảnh trong component.
 * - Ảnh mới upload: `file` có giá trị, `storagePath` là undefined.
 * - Ảnh đã lưu từ server: `storagePath` có giá trị, `file` là undefined.
 *   Preview hiển thị qua CDN URL (không fetch blob về client).
 */
export interface ImagePreview {
  id?: number;
  file?: File;
  /** R2 object key, ví dụ: "bills/123/photo.jpg" */
  storagePath?: string;
  /** URL preview local (blob URL cho ảnh mới upload) hoặc CDN URL */
  previewUrl: string;
}

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-upload.html',
  styleUrls: ['./image-upload.scss'],
})
export class ImageUploadComponent {
  public readonly snackBar = inject(MatSnackBar);
  public readonly cdn = inject(ImageCdnUrlService);

  previewIndex: number | null = null;

  @Input() isEditable = true;
  @Input() maxFiles = 5;
  @Input() maxFileSize = this.maxFiles * 1024 * 1024; // 5MB mỗi file
  @Input() acceptedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp'];

  /**
   * Ảnh đã lưu từ server — nhận storagePath (R2 key).
   * Không cần fetch blob; hiển thị thẳng qua CDN URL resize.
   */
  @Input() set imageStoragePaths(images: { id?: number; storagePath: string }[]) {
    if (!images?.length) return;
    this.images = images.map(({ id, storagePath }) => ({
      id,
      storagePath,
      previewUrl: this.cdn.url(storagePath, { width: 800, quality: 85 }),
    }));
    this.emitImages();
  }

  @Output() imagesChanged = new EventEmitter<ImagePreview[]>();

  images: ImagePreview[] = [];
  dragOver = false;

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.handleFiles(Array.from(input.files));
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;

    if (event.dataTransfer?.files) {
      this.handleFiles(Array.from(event.dataTransfer.files));
    }
  }

  private handleFiles(files: File[]): void {
    const validFiles = files.filter((file) => this.validateFile(file));

    if (this.images.length + validFiles.length > this.maxFiles) {
      this.snackBar.open(`Chỉ có thể tải lên tối đa ${this.maxFiles} ảnh`, 'Đóng', {
        duration: 2000,
      });
      return;
    }

    validFiles.forEach((file) => {
      const previewUrl = URL.createObjectURL(file);
      this.images.push({ file, previewUrl });
    });

    if (validFiles.length) {
      this.emitImages();
    }
  }

  private validateFile(file: File): boolean {
    if (!this.acceptedTypes.includes(file.type)) {
      this.snackBar.open(
        `Định dạng file không hợp lệ. Chỉ chấp nhận: ${this.acceptedTypes.join(', ')}`,
        'Đóng',
        { duration: 2000 },
      );
      return false;
    }

    if (file.size > this.maxFileSize) {
      this.snackBar.open(
        `Kích thước file quá lớn. Tối đa: ${this.maxFileSize / (1024 * 1024)}MB`,
        'Đóng',
        { duration: 2000 },
      );
      return false;
    }

    return true;
  }

  removeImage(index: number): void {
    const removed = this.images[index];
    // Giải phóng blob URL nếu là ảnh mới upload (tránh memory leak)
    if (removed.file && removed.previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(removed.previewUrl);
    }
    this.images.splice(index, 1);
    this.emitImages();
  }

  clearAll(): void {
    this.images.forEach((img) => {
      if (img.file && img.previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(img.previewUrl);
      }
    });
    this.images = [];
    this.emitImages();
  }

  private emitImages(): void {
    this.imagesChanged.emit(this.images);
  }

  triggerFileInput(): void {
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    fileInput?.click();
  }

  openPreview(index: number): void {
    this.previewIndex = index;
  }

  closePreview(): void {
    this.previewIndex = null;
  }

  /** URL chất lượng cao cho lightbox preview */
  getLightboxUrl(image: ImagePreview): string {
    if (image.storagePath) {
      return this.cdn.fullSize(image.storagePath);
    }
    return image.previewUrl;
  }
}
