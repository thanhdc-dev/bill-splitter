import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  Output,
  inject,
} from '@angular/core';

import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { firstValueFrom } from 'rxjs';
import { ImageCdnUrlService } from '../../core/cdn/image-cdn-url.service';
import { AuthService } from '../../services/auth.service';
import { BillSplitterService } from '../../services/bill-splitter.service';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';
import { ImageLightboxComponent } from '../image-lightbox/image-lightbox';
import { LoginDialogComponent } from '../login-dialog/login-dialog';

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
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-image-upload',
  standalone: true,
  imports: [],
  templateUrl: './image-upload.html',
  styleUrls: ['./image-upload.scss'],
})
export class ImageUploadComponent {
  public readonly snackBar = inject(MatSnackBar);
  public readonly cdn = inject(ImageCdnUrlService);
  private readonly dialog = inject(MatDialog);
  private readonly authService = inject(AuthService);
  private readonly billSplitterService = inject(BillSplitterService);

  /** Tránh mở chồng nhiều popup khi user click/kéo thả liên tiếp. */
  private isPromptingLogin = false;

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

  async onDrop(event: DragEvent): Promise<void> {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver = false;

    // Đọc files trước khi await: dataTransfer bị vô hiệu sau khi handler đồng bộ kết thúc.
    const files = event.dataTransfer?.files ? Array.from(event.dataTransfer.files) : [];
    if (!files.length || !(await this.ensureLoggedIn())) return;
    this.handleFiles(files);
  }

  /**
   * Upload ảnh yêu cầu đăng nhập để backend gắn ảnh với user.
   * Guest: hiện popup xác nhận rồi mở LoginDialog, trả về false (user chọn ảnh lại sau khi đăng nhập).
   */
  private async ensureLoggedIn(): Promise<boolean> {
    await this.authService.whenReady();
    if (this.authService.isLoggedIn()) return true;
    if (this.isPromptingLogin) return false;

    this.isPromptingLogin = true;
    try {
      const confirmLogin = await firstValueFrom(
        this.dialog
          .open(ConfirmDialogComponent, {
            data: {
              title: 'Xác nhận',
              message: 'Bạn cần đăng nhập để sử dụng tính năng tải hình ảnh lên',
              confirmText: 'Đăng nhập',
              cancelText: 'Hủy',
            },
          })
          .afterClosed(),
      );
      if (confirmLogin) {
        // OAuth là redirect toàn trang nên state trong bộ nhớ sẽ mất: lưu nháp để khôi phục sau login.
        this.billSplitterService.saveDraftForRestore();
        const loginResult = await firstValueFrom(this.dialog.open(LoginDialogComponent).afterClosed());
        // OAuth đóng dialog bằng `true` rồi redirect; đóng mà chưa đăng nhập = user huỷ -> bỏ nháp.
        if (loginResult !== true && !this.authService.isLoggedIn()) {
          this.billSplitterService.discardDraftForRestore();
        }
      }
    } finally {
      this.isPromptingLogin = false;
    }
    return false;
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

  async triggerFileInput(): Promise<void> {
    if (!(await this.ensureLoggedIn())) return;
    const fileInput = document.getElementById('file-input') as HTMLInputElement;
    fileInput?.click();
  }

  openPreview(index: number): void {
    this.dialog.open(ImageLightboxComponent, {
      panelClass: 'image-lightbox-panel',
      maxWidth: '95vw',
      data: {
        images: this.images.map((image) => this.getLightboxUrl(image)),
        startIndex: index,
      },
    });
  }

  /** URL chất lượng cao cho lightbox preview */
  private getLightboxUrl(image: ImagePreview): string {
    if (image.storagePath) {
      return this.cdn.fullSize(image.storagePath);
    }
    return image.previewUrl;
  }
}
