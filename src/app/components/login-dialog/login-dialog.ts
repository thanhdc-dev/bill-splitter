import { Component, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { BillSplitterService, PasskeyService } from '../../services';

@Component({
  selector: 'app-login-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './login-dialog.html',
  styleUrl: './login-dialog.scss'
})
export class LoginDialogComponent {
  private readonly snackBar = inject(MatSnackBar);
  private readonly dialogRef = inject<MatDialogRef<LoginDialogComponent>>(MatDialogRef);
  private readonly authService = inject(AuthService);
  private readonly passkeyService = inject(PasskeyService);
  private readonly billSplitterService = inject(BillSplitterService);
  private readonly router = inject(Router);

  isLoading = false;
  isPasskeySupported = this.passkeyService.isSupported();

  async loginWith(provider: string): Promise<void> {
    try {
      this.isLoading = true;
      const authUrl = await this.authService.getAuthUrl(provider);
      this.dialogRef.close(true);
      sessionStorage.setItem('oauth_flow', provider);
      window.location.href = authUrl;
    } catch (error) {
      console.error(`${provider} login error:`, error);
      this.snackBar.open('Có lỗi xảy ra. Vui lòng thử lại.', 'Đóng', {
        duration: 3000,
      });
    } finally {
      this.isLoading = false;
    }
  }

  async loginWithPasskey(): Promise<void> {
    try {
      this.isLoading = true;
      const { accessToken, refreshToken, user } =
        await this.passkeyService.login();
      this.authService.setTokens({ accessToken, refreshToken });
      this.authService.setUser(user);

      // Đóng dialog bằng giá trị falsy để phía gọi dừng luồng đang dở, rồi
      // điều hướng về /?save=true giống OauthCallback. Nếu đóng bằng true,
      // create-bill sẽ vừa chạy tiếp createBill() vừa bị save lại lần nữa
      // qua query param -> tạo trùng hoá đơn.
      this.dialogRef.close(false);

      const queryParams: Record<string, string> = {};
      if (!this.billSplitterService.isBillEmptyInStorage()) {
        queryParams['save'] = 'true';
      }
      await this.router.navigate([''], { queryParams });
    } catch (error) {
      // User bấm huỷ hoặc quá 60 giây -> không hiện lỗi
      if (this.passkeyService.isCeremonyAborted(error)) return;
      console.error('Passkey login error:', error);
      this.snackBar.open(this.passkeyService.getErrorMessage(error), 'Đóng', {
        duration: 6000,
      });
    } finally {
      this.isLoading = false;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
