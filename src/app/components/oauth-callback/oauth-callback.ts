import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-oauth-callback',
  imports: [CommonModule, MatProgressSpinnerModule],
  templateUrl: './oauth-callback.html',
  styleUrl: './oauth-callback.scss',
})
export class OauthCallback implements OnInit {
  provider: string;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
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
        this.router.navigate([''], { queryParams: { save: true } });
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
