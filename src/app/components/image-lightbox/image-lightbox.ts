import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

export interface ImageLightboxData {
  images: string[];
  startIndex: number;
}

/**
 * Xem ảnh phóng to trong MatDialog thay vì <div> tự chế: có focus trap,
 * đóng bằng Esc (mặc định của MatDialog) mà không "nuốt" mọi phím khác,
 * và role="dialog" + aria-modal do CDK gắn sẵn.
 */
@Component({
  selector: 'app-image-lightbox',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule, MatButtonModule],
  templateUrl: './image-lightbox.html',
  styleUrl: './image-lightbox.scss',
})
export class ImageLightboxComponent {
  private readonly dialogRef = inject<MatDialogRef<ImageLightboxComponent>>(MatDialogRef);
  readonly data = inject<ImageLightboxData>(MAT_DIALOG_DATA);

  index = this.data.startIndex;

  get currentUrl(): string {
    return this.data.images[this.index];
  }

  get hasMultiple(): boolean {
    return this.data.images.length > 1;
  }

  prev(): void {
    this.index = (this.index - 1 + this.data.images.length) % this.data.images.length;
  }

  next(): void {
    this.index = (this.index + 1) % this.data.images.length;
  }

  close(): void {
    this.dialogRef.close();
  }
}
