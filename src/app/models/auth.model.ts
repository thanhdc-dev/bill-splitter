export interface AuthUser {
  id: number;
  fullname: string;
  email: string;
  picture: string;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface PopupMessage {
  type: 'AUTH_SUCCESS' | 'AUTH_ERROR' | 'popupClosed';
  data?: AuthTokens;
  error?: string;
}
