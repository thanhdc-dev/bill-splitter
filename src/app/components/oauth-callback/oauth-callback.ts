import { CommonModule } from '@angular/common';
import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import {
  AuthService,
  BillSplitterService,
  PASSKEY_PROMPT_SHOWN_KEY,
  PasskeyService,
} from '../../services';

@Component({
  selector: 'app-oauth-callback',
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './oauth-callback.html',
  styleUrl: './oauth-callback.scss',
})
export class OauthCallback implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly billSplitterService = inject(BillSplitterService);
  private readonly passkeyService = inject(PasskeyService);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    this.route.queryParams.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((params) => {
      const code = params['code'];
      const state = params['state'];
      const error = params['error'];

      if (error) {
        console.error('OAuth error:', error);
        this.snackBar.open('Đăng nhập thất bại:', 'Đóng', {
          duration: 3000,
        });
        this.router.navigate(['/']);
        return;
      }

      if (code) {
        this.handleCallback(code, state);
      } else {
        console.error('No authorization code received');
        this.snackBar.open('Không nhận được mã xác thực từ Google', 'Đóng', {
          duration: 3000,
        });
        this.router.navigate(['/']);
      }
    });
  }

  private async handleCallback(code: string, state: string): Promise<void> {
    try {
      // 4. Gửi code về backend để verify và tạo user
      const response = await this.authService.verifyCode(code, state);

      if (response) {
        // 5. Lưu tokens và user info
        this.authService.setTokens(response.tokens);
        this.authService.setUser(response.user);

        // Clear oauth flow state
        sessionStorage.removeItem('oauth_flow');

        // Chuyển hướng về trang chính
        const queryParams: Record<string, string> = {};
        if (!this.billSplitterService.isBillEmptyInStorage()) {
          queryParams['save'] = 'true';
        }
        this.router.navigate([''], { queryParams });

        // Mời tạo passkey sau khi đã điều hướng, không chặn luồng đăng nhập
        this.promptPasskeySetup();
      }
    } catch (error) {
      console.error('Error verifying Google code:', error);
      this.snackBar.open(
        'Có lỗi xảy ra trong quá trình xác thực. Vui lòng thử lại',
        'Đóng',
        {
          duration: 3000,
        }
      );
      this.router.navigate(['/']);
    }
  }

  /**
   * Gợi ý tạo passkey cho user vừa đăng nhập bằng OAuth, chỉ khi thiết bị có
   * sẵn sinh trắc học và user chưa có passkey nào. Chỉ mời đúng một lần —
   * cờ được ghi ngay khi hiện snackbar để không làm phiền ở các lần sau.
   */
  private async promptPasskeySetup(): Promise<void> {
    try {
      const passkeyPromptShown = localStorage.getItem(PASSKEY_PROMPT_SHOWN_KEY);
      if (passkeyPromptShown && passkeyPromptShown === '1') return;
      if (!(await this.passkeyService.hasPlatformAuthenticator())) return;

      const credentials = await this.passkeyService.listCredentials();
      if (credentials.length) return;

      localStorage.setItem(PASSKEY_PROMPT_SHOWN_KEY, '1');
      const snackBarRef = this.snackBar.open(
        'Lần sau đăng nhập nhanh hơn bằng vân tay hoặc FaceID?',
        'Thiết lập',
        { duration: 10000 }
      );
      snackBarRef.onAction().subscribe(() => {
        this.router.navigate(['/setting'], {
          queryParams: { tab: 'security' },
        });
      });
    } catch (error) {
      // Gợi ý là tuỳ chọn, lỗi ở đây không được ảnh hưởng luồng đăng nhập
      console.error('Passkey prompt error:', error);
    }
  }
}
