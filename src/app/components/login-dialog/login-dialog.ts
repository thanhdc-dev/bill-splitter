import { Component } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-login-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule, MatDialogModule],
  templateUrl: './login-dialog.html',
  styleUrl: './login-dialog.scss'
})
export class LoginDialogComponent {
  isLoading = false;

  constructor(
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<LoginDialogComponent>,
    private authService: AuthService
  ) {}

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

  onCancel(): void {
    this.dialogRef.close();
  }
}
