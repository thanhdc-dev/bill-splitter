import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';

interface ImagePreview {
  id?: number;
  file: File;
  url: string;
}

@Component({
  selector: 'app-image-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-upload.html',
  styleUrls: ['./image-upload.scss'],
})
export class ImageUploadComponent {
  private readonly snackBar = inject(MatSnackBar);
  previewIndex: number | null = null;

  @Input() maxFiles = 5;
  @Input() maxFileSize = this.maxFiles * 1024 * 1024; // 5MB
  @Input() acceptedTypes: string[] = ['image/jpeg', 'image/png', 'image/webp'];
  @Input() set imageUrls(images: { id?: number; url: string }[]) {
    if (!images?.length) return;
    this.images = [];
    const imageUrlsSet = new Set(this.images.map((img) => img.url));
    let imageIndex = 1;
    images.forEach(async ({ id, url }) => {
      if (!imageUrlsSet.has(url)) {
        try {
          const file = await this.urlToFile(url);
          this.images.push({ id, file, url });
          if (imageIndex === images.length) {
            this.emitImages();
          }
          imageIndex++;
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          // Nếu fetch lỗi, vẫn push url để hiển thị ảnh
          // this.images.push({ file: null, url });
          this.snackBar.open('Không thể tải ảnh', 'Đóng', {
            duration: 2000,
          });
        }
      }
    });
  }

  /**
   * Tải ảnh từ url và tạo File tương tự như upload local
   */
  private async urlToFile(url: string): Promise<File> {
    const response = await fetch(url, { mode: 'cors' });
    const blob = await response.blob();
    // Lấy tên file từ url hoặc tạo tên ngẫu nhiên
    const name = url.split('/').pop() || `image_${Date.now()}`;
    // Nếu blob.type không hợp lệ, fallback sang acceptedTypes[0]
    const type = this.acceptedTypes.includes(blob.type)
      ? blob.type
      : this.acceptedTypes[0];
    return new File([blob], name, { type });
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
      alert(`Chỉ có thể tải lên tối đa ${this.maxFiles} ảnh`);
      return;
    }

    let imageIndex = 1;
    validFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e: ProgressEvent<FileReader>) => {
        this.images.push({
          file: file,
          url: e.target?.result as string,
        });
        if (imageIndex === validFiles.length) {
          this.emitImages();
        }
        imageIndex++;
      };
      reader.readAsDataURL(file);
    });
  }

  private validateFile(file: File): boolean {
    if (!this.acceptedTypes.includes(file.type)) {
      alert(
        `Định dạng file không hợp lệ. Chỉ chấp nhận: ${this.acceptedTypes.join(', ')}`,
      );
      return false;
    }

    if (file.size > this.maxFileSize) {
      alert(
        `Kích thước file quá lớn. Tối đa: ${this.maxFileSize / (1024 * 1024)}MB`,
      );
      return false;
    }

    return true;
  }

  removeImage(index: number): void {
    this.images.splice(index, 1);
    this.emitImages();
  }

  clearAll(): void {
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
}
