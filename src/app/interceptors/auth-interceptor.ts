import {
  HttpInterceptorFn,
  HttpRequest,
  HttpHandlerFn,
  HttpErrorResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import {
  BehaviorSubject,
  catchError,
  filter,
  finalize,
  switchMap,
  take,
  throwError,
} from 'rxjs';

let isRefreshing = false;
const tokenRefreshedSubject = new BehaviorSubject<string | null>(null);

/**
 * Các endpoint public tự dùng 401 làm mã lỗi nghiệp vụ (chữ ký passkey sai,
 * passkey bị thu hồi). Không được nuốt chúng bằng luồng refresh token, nếu
 * không component sẽ mất mã lỗi gốc để hiển thị cảnh báo cho user.
 */
const SKIP_REFRESH_URLS = ['/auth/refresh', '/auth/passkey/login/'];

function shouldSkipRefresh(url: string): boolean {
  return SKIP_REFRESH_URLS.some((path) => url.includes(path));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const authService = inject(AuthService);
  const accessToken = authService.getAccessToken();

  let authReq = req;
  if (accessToken) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${accessToken}` },
    });
  }

  return next(authReq).pipe(
    catchError((error) => {
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        !shouldSkipRefresh(req.url)
      ) {
        return handle401Error(authReq, next, authService);
      }
      return throwError(() => error);
    })
  );
};

function handle401Error(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  req: HttpRequest<any>,
  next: HttpHandlerFn,
  authService: AuthService
) {
  if (!isRefreshing) {
    isRefreshing = true;
    tokenRefreshedSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((tokens) => {
        tokenRefreshedSubject.next(tokens.accessToken);
        return next(
          req.clone({
            setHeaders: { Authorization: `Bearer ${tokens.accessToken}` },
          })
        );
      }),
      catchError((err) => {
        return throwError(() => err);
      }),
      finalize(() => {
        isRefreshing = false;
      })
    );
  } else {
    return tokenRefreshedSubject.pipe(
      filter((token) => token != null),
      take(1),
      switchMap((token) =>
        next(
          req.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
          })
        )
      )
    );
  }
}
