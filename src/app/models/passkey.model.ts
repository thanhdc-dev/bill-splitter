import type {
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
  RegistrationResponseJSON,
} from '@simplewebauthn/browser';
import { AuthTokens, AuthUser } from './auth.model';

/** Một passkey đã đăng ký, trả về từ GET /auth/passkey/credentials */
export interface IPasskeyCredentialRO {
  id: number;
  deviceName: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

/** Response của POST /auth/passkey/register/options (cấu trúc chuẩn W3C) */
export type IPasskeyRegisterOptionsRO = PublicKeyCredentialCreationOptionsJSON;

/** Response của POST /auth/passkey/register/verify */
export interface IPasskeyRegisterVerifyRO {
  success: boolean;
}

/** Response của POST /auth/passkey/login/options */
export interface IPasskeyLoginOptionsRO {
  challengeId: string;
  options: PublicKeyCredentialRequestOptionsJSON;
}

/** Response của POST /auth/passkey/login/verify — cùng dạng với login OAuth */
export interface IPasskeyLoginRO extends AuthTokens {
  user: AuthUser;
}

/** Body của POST /auth/passkey/register/verify */
export interface IPasskeyRegisterVerifyDTO {
  appKey: string;
  attestationResponse: RegistrationResponseJSON;
  deviceName?: string;
}

/** Body của POST /auth/passkey/login/verify */
export interface IPasskeyLoginVerifyDTO {
  challengeId: string;
  appKey: string;
  assertionResponse: AuthenticationResponseJSON;
}

/** Format lỗi thống nhất của API */
export interface IApiErrorRO {
  timestamp: string;
  method: string;
  path: string;
  statusCode: number;
  code: string | null;
  error: unknown;
}
