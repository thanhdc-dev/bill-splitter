import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  IApiErrorRO,
  IPasskeyCredentialRO,
  IPasskeyLoginOptionsRO,
  IPasskeyLoginRO,
  IPasskeyRegisterOptionsRO,
  IPasskeyRegisterVerifyRO,
} from '../models';

/** Số passkey tối đa backend cho phép trên mỗi user / appKey */
export const PASSKEY_MAX_CREDENTIALS = 10;

/** Độ dài tối đa của deviceName theo validation của backend */
export const PASSKEY_DEVICE_NAME_MAX_LENGTH = 100;

/** Cờ localStorage đánh dấu đã mời user tạo passkey, để chỉ mời đúng một lần */
export const PASSKEY_PROMPT_SHOWN_KEY = 'passkeyPromptShown';

type SimpleWebAuthnModule = typeof import('@simplewebauthn/browser');

@Injectable({
  providedIn: 'root',
})
export class PasskeyService {
  private readonly http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;
  private readonly appKey = environment.appKey;
  private readonly endPoint = 'auth/passkey';

  /** Cache promise để chỉ tải @simplewebauthn/browser đúng một lần */
  private libPromise?: Promise<SimpleWebAuthnModule>;

  /**
   * Kiểm tra hỗ trợ WebAuthn bằng API gốc của trình duyệt thay vì
   * browserSupportsWebAuthn() của thư viện, để việc gọi hàm này ở màn hình
   * đăng nhập / cài đặt không kéo theo bundle của @simplewebauthn/browser.
   */
  isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      typeof window.PublicKeyCredential === 'function' &&
      typeof navigator?.credentials?.create === 'function'
    );
  }

  /** Thiết bị có sẵn vân tay / FaceID / Windows Hello hay không */
  async hasPlatformAuthenticator(): Promise<boolean> {
    if (!this.isSupported()) return false;
    try {
      return await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    } catch {
      return false;
    }
  }

  /** Danh sách passkey còn hiệu lực của user trong app hiện tại */
  async listCredentials(): Promise<IPasskeyCredentialRO[]> {
    return await firstValueFrom(
      this.http.get<IPasskeyCredentialRO[]>(
        `${this.API_URL}/${this.endPoint}/credentials`,
        { params: { appKey: this.appKey } }
      )
    );
  }

  /** Xoá một passkey theo id */
  async deleteCredential(id: number): Promise<void> {
    await firstValueFrom(
      this.http.delete<void>(
        `${this.API_URL}/${this.endPoint}/credentials/${id}`
      )
    );
  }

  /**
   * Đăng ký passkey cho thiết bị hiện tại (user phải đang đăng nhập).
   * Tự thử lại một lần khi challenge hết hạn theo khuyến nghị của tài liệu.
   */
  async register(deviceName?: string): Promise<void> {
    try {
      await this.runRegisterCeremony(deviceName);
    } catch (error) {
      if (!this.isChallengeExpired(error)) throw error;
      await this.runRegisterCeremony(deviceName);
    }
  }

  /**
   * Đăng nhập bằng passkey đã đăng ký (không cần token).
   * Tự thử lại một lần khi challenge hết hạn.
   */
  async login(): Promise<IPasskeyLoginRO> {
    try {
      return await this.runLoginCeremony();
    } catch (error) {
      if (!this.isChallengeExpired(error)) throw error;
      return await this.runLoginCeremony();
    }
  }

  /** User bấm huỷ hoặc quá 60 giây — không phải lỗi hệ thống */
  isCeremonyAborted(error: unknown): boolean {
    return this.getWebAuthnErrorCode(error) === 'ERROR_CEREMONY_ABORTED';
  }

  /** Thiết bị hiện tại đã có passkey cho tài khoản này */
  isAlreadyRegistered(error: unknown): boolean {
    return (
      this.getWebAuthnErrorCode(error) ===
      'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED'
    );
  }

  /** Chuyển lỗi API / lỗi ceremony thành thông báo tiếng Việt cho user */
  getErrorMessage(error: unknown): string {
    const ceremonyCode = this.getWebAuthnErrorCode(error);
    if (ceremonyCode) {
      return this.getCeremonyErrorMessage(ceremonyCode);
    }

    if (error instanceof HttpErrorResponse) {
      return this.getApiErrorMessage(error);
    }

    return 'Có lỗi xảy ra. Vui lòng thử lại.';
  }

  private getCeremonyErrorMessage(code: string): string {
    switch (code) {
      case 'ERROR_AUTHENTICATOR_PREVIOUSLY_REGISTERED':
        return 'Thiết bị này đã được đăng ký passkey rồi.';
      case 'ERROR_INVALID_DOMAIN':
      case 'ERROR_INVALID_RP_ID':
        return 'Cấu hình passkey của ứng dụng chưa đúng. Vui lòng liên hệ quản trị viên.';
      case 'ERROR_AUTHENTICATOR_MISSING_DISCOVERABLE_CREDENTIAL_SUPPORT':
      case 'ERROR_AUTHENTICATOR_MISSING_USER_VERIFICATION_SUPPORT':
        return 'Thiết bị này không hỗ trợ passkey. Hãy thử trên thiết bị hoặc trình duyệt khác.';
      default:
        return 'Không thể thực hiện xác thực passkey. Vui lòng thử lại.';
    }
  }

  private getApiErrorMessage(error: HttpErrorResponse): string {
    // Hai loại throttle của backend trả code khác nhau nên bắt theo statusCode
    if (error.status === 429) {
      return 'Bạn đã thử quá nhiều lần. Vui lòng đợi khoảng 1 phút rồi thử lại.';
    }

    switch (this.getApiErrorCode(error)) {
      case 'ERR_PASSKEY_APP_NOT_CONFIGURED':
        return 'Ứng dụng chưa được cấu hình passkey. Vui lòng liên hệ quản trị viên.';
      case 'ERR_PASSKEY_LIMIT_REACHED':
        return `Bạn đã đạt tối đa ${PASSKEY_MAX_CREDENTIALS} passkey. Hãy xoá bớt trước khi thêm mới.`;
      case 'ERR_PASSKEY_CHALLENGE_EXPIRED':
        return 'Phiên xác thực đã hết hạn. Vui lòng thử lại.';
      case 'ERR_PASSKEY_CREDENTIAL_REVOKED':
        return 'Passkey này đã bị thu hồi vì phát hiện dấu hiệu bị sao chép. Hãy đăng nhập bằng cách khác, xoá passkey cũ và đăng ký lại.';
      case 'ERR_PASSKEY_VERIFICATION_FAILED':
        return 'Xác thực passkey thất bại. Vui lòng thử lại.';
      case 'ERR_PASSKEY_NOT_FOUND':
        return 'Không tìm thấy passkey này. Danh sách sẽ được tải lại.';
      case 'ERR_USER_NOT_FOUND':
        return 'Tài khoản không còn tồn tại. Vui lòng đăng nhập lại.';
      default:
        return 'Có lỗi xảy ra. Vui lòng thử lại.';
    }
  }

  private async runRegisterCeremony(deviceName?: string): Promise<void> {
    const { startRegistration } = await this.loadLib();

    const optionsJSON = await firstValueFrom(
      this.http.post<IPasskeyRegisterOptionsRO>(
        `${this.API_URL}/${this.endPoint}/register/options`,
        { appKey: this.appKey }
      )
    );

    // Trình duyệt / OS hỏi vân tay, FaceID, PIN... (tối đa 60s)
    const attestationResponse = await startRegistration({ optionsJSON });

    await firstValueFrom(
      this.http.post<IPasskeyRegisterVerifyRO>(
        `${this.API_URL}/${this.endPoint}/register/verify`,
        {
          appKey: this.appKey,
          attestationResponse,
          ...(deviceName ? { deviceName } : {}),
        }
      )
    );
  }

  private async runLoginCeremony(): Promise<IPasskeyLoginRO> {
    const { startAuthentication } = await this.loadLib();

    const { challengeId, options } = await firstValueFrom(
      this.http.post<IPasskeyLoginOptionsRO>(
        `${this.API_URL}/${this.endPoint}/login/options`,
        { appKey: this.appKey }
      )
    );

    const assertionResponse = await startAuthentication({
      optionsJSON: options,
    });

    return await firstValueFrom(
      this.http.post<IPasskeyLoginRO>(
        `${this.API_URL}/${this.endPoint}/login/verify`,
        { challengeId, appKey: this.appKey, assertionResponse }
      )
    );
  }

  private loadLib(): Promise<SimpleWebAuthnModule> {
    this.libPromise ??= import('@simplewebauthn/browser');
    return this.libPromise;
  }

  private isChallengeExpired(error: unknown): boolean {
    return this.getApiErrorCode(error) === 'ERR_PASSKEY_CHALLENGE_EXPIRED';
  }

  private getApiErrorCode(error: unknown): string | null {
    if (!(error instanceof HttpErrorResponse)) return null;
    const body = error.error as IApiErrorRO | null;
    return body?.code ?? null;
  }

  /**
   * Nhận diện WebAuthnError bằng hình dạng thay vì instanceof để không phải
   * giữ tham chiếu tới module được nạp động.
   */
  private getWebAuthnErrorCode(error: unknown): string | null {
    if (!(error instanceof Error)) return null;
    const code = (error as Error & { code?: unknown }).code;
    return typeof code === 'string' && code.startsWith('ERROR_') ? code : null;
  }
}
