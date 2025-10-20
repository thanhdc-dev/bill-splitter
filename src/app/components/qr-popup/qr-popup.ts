import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-qr-popup',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './qr-popup.html',
  styleUrl: './qr-popup.scss',
})
export class QrPopupComponent implements OnInit {
  title = 'QR Code';
  private dialogRef = inject<MatDialogRef<QrPopupComponent>>(MatDialogRef);
  data = inject<{
    title: string;
    qrImageUrl: string;
    qrImageDownloadUrl: string;
    fileName: string;
}>(MAT_DIALOG_DATA);


  ngOnInit(): void {
    if (this.data.title) {
      this.title = this.data.title || 'QR Code';
    }
  }

  async downloadQRCode() {
    try {
      const fileName = this.data.fileName || 'qr-code.png';

      if (!this.data.qrImageDownloadUrl) {
        console.error('No QR code image URL provided');
        return;
      }

      // Fetch the image
      const response = await fetch(this.data.qrImageDownloadUrl);
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileName;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading QR code:', error);
      // Fallback method
      this.fallbackDownload();
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  private fallbackDownload() {
    const fileName = this.data.fileName || 'qr-code.png';
    const link = document.createElement('a');
    link.href = this.data.qrImageDownloadUrl;
    link.target = '_blank';
    link.download = fileName;
    link.click();
  }
}
