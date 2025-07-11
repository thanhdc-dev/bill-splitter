import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, firstValueFrom, tap } from 'rxjs';
import { AuthTokens, AuthUser } from '../models/auth.model';
import { environment } from '../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient);

  private API_URL!: string;
  private userId = 0;
  private endPoint = 'auth';
  private userSubject = new BehaviorSubject<AuthUser | null>(null);
  public user$ = this.userSubject.asObservable();

  constructor() {
    this.API_URL = environment.apiUrl;
  }

  async initialize() {
    await this.loadStoredTokens();
  }

  // Load stored tokens on app init
  private async loadStoredTokens() {
    const token = this.getAccessToken();
    if (token) {
      await this.getUserInfo()
        .then((user) => this.setUser(user))
        .catch(() => this.logout());
    }
  }

  async getUserInfo(): Promise<AuthUser> {
    return await firstValueFrom(
      this.http.get<AuthUser>(`${this.API_URL}/${this.endPoint}/me`)
    );
  }

  refreshToken() {
    const refreshToken = this.getRefreshToken();
    return this.http.post<AuthTokens>(`${this.API_URL}/${this.endPoint}/refresh`, { refreshToken }).pipe(
      tap((tokens) => {
        this.setTokens(tokens);
      })
    );
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.userSubject.next(null);
  }

  setUser(user: AuthUser) {
    this.userId = user.id;
    this.userSubject.next(user);
  }

  getUserId() {
    return this.userId;
  }

  isLoggedIn(): boolean {
    return !!this.userSubject.value;
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  // Lấy Google OAuth URL từ backend
  async getAuthUrl(provider: string) {
    const res = await firstValueFrom(
      this.http.get<{ authUrl: string }>(
        `${this.API_URL}/${this.endPoint}/${provider}`
      )
    );
    return res.authUrl;
  }

  // Verify authorization code với backend
  async verifyCode(provider: string, code: string, state: string) {
    return await firstValueFrom(
      this.http.get<{ user: AuthUser; tokens: AuthTokens }>(
        `${this.API_URL}/${this.endPoint}/${provider}/callback`,
        {
          params: {
            code,
            state,
          },
        }
      )
    );
  }

  setTokens(tokens: AuthTokens): void {
    localStorage.setItem('accessToken', tokens.accessToken);
    localStorage.setItem('refreshToken', tokens.refreshToken);
  }
}
