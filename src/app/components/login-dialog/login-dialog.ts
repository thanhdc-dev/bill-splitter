import { Component, inject } from '@angular/core';
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
  private snackBar = inject(MatSnackBar);
  private dialogRef = inject<MatDialogRef<LoginDialogComponent>>(MatDialogRef);
  private authService = inject(AuthService);

  isLoading = false;

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
