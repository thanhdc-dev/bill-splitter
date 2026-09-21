import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { firstValueFrom } from 'rxjs';
import { IPasskeyCredentialRO } from '../../models';
import { PASSKEY_MAX_CREDENTIALS, PasskeyService } from '../../services';
import { ConfirmDialogComponent } from '../confirm-dialog/confirm-dialog';
import { PasskeyNameDialogComponent } from '../passkey-name-dialog/passkey-name-dialog';

@Component({
  selector: 'app-passkey-manager',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
  templateUrl: './passkey-manager.html',
  styleUrl: './passkey-manager.scss',
})
export class PasskeyManager implements OnInit {
  private readonly passkeyService = inject(PasskeyService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly maxCredentials = PASSKEY_MAX_CREDENTIALS;
  readonly isSupported = this.passkeyService.isSupported();

  credentials: IPasskeyCredentialRO[] = [];
  isLoading = false;
  isProcessing = false;

  get isLimitReached(): boolean {
    return this.credentials.length >= this.maxCredentials;
  }

  ngOnInit(): void {
    if (this.isSupported) {
      this.loadCredentials();
    }
  }

  async loadCredentials(): Promise<void> {
    try {
      this.isLoading = true;
      this.credentials = await this.passkeyService.listCredentials();
    } catch (error) {
      console.error('Load passkeys error:', error);
      this.snackBar.open(this.passkeyService.getErrorMessage(error), 'Đóng');
    } finally {
      this.isLoading = false;
    }
  }

  async addPasskey(): Promise<void> {
    const deviceName: string | undefined = await firstValueFrom(
      this.dialog.open(PasskeyNameDialogComponent).afterClosed()
    );
    // undefined = user bấm Hủy; chuỗi rỗng = user xoá hết tên, vẫn cho đăng ký
    if (deviceName === undefined) return;

    try {
      this.isProcessing = true;
      await this.passkeyService.register(deviceName || undefined);
      this.snackBar.open('Đã thêm passkey cho thiết bị này.', 'Đóng');
      await this.loadCredentials();
    } catch (error) {
      if (this.passkeyService.isCeremonyAborted(error)) return;
      console.error('Register passkey error:', error);
      this.snackBar.open(this.passkeyService.getErrorMessage(error), 'Đóng', {
        duration: 6000,
      });
    } finally {
      this.isProcessing = false;
    }
  }

  async removePasskey(credential: IPasskeyCredentialRO): Promise<void> {
    const isLastOne = this.credentials.length === 1;
    const confirmed = await firstValueFrom(
      this.dialog
        .open(ConfirmDialogComponent, {
          data: {
            title: isLastOne ? 'Xoá passkey cuối cùng?' : 'Xoá passkey',
            message: isLastOne
              ? `Đây là passkey duy nhất của bạn. Sau khi xoá, bạn chỉ còn đăng nhập được bằng Google hoặc Zalo. Vẫn xoá "${this.getDisplayName(credential)}"?`
              : `Xoá passkey "${this.getDisplayName(credential)}"? Thiết bị này sẽ không đăng nhập bằng passkey được nữa.`,
            confirmText: 'Xoá',
            cancelText: 'Hủy',
          },
        })
        .afterClosed()
    );
    if (!confirmed) return;

    try {
      this.isProcessing = true;
      await this.passkeyService.deleteCredential(credential.id);
      this.snackBar.open(
        'Đã xoá. Hãy xoá thêm trong trình quản lý mật khẩu của thiết bị (iCloud Keychain, Google Password Manager...) nếu muốn dọn sạch.',
        'Đóng',
        { duration: 8000 }
      );
    } catch (error) {
      console.error('Delete passkey error:', error);
      this.snackBar.open(this.passkeyService.getErrorMessage(error), 'Đóng');
    } finally {
      this.isProcessing = false;
      await this.loadCredentials();
    }
  }

  getDisplayName(credential: IPasskeyCredentialRO): string {
    return credential.deviceName || 'Thiết bị không tên';
  }
}
