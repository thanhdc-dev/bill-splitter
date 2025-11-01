import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService, BillSplitterService } from '../../services';

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

  provider: string;
  constructor() {
    this.provider = this.route.snapshot.paramMap.get('provider') as string;
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
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
      const response = await this.authService.verifyCode(
        this.provider,
        code,
        state
      );

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
}
