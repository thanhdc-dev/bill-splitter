import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = async (_route, _state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Phiên đăng nhập được khôi phục bất đồng bộ lúc khởi động — chờ xong mới quyết định.
  await authService.whenReady();
  if (!authService.isLoggedIn()) {
    router.navigate(['/']);
    return false;
  }
  return true;
};
