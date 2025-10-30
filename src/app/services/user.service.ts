import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { USER_SETTING_KEYS } from '../constants';
import { SettingsData } from '../interfaces';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly endPoint = 'user';
  private readonly http = inject(HttpClient);
  private readonly API_URL = environment.apiUrl;

  async getSetting(key: string) {
    const URL = `${this.API_URL}/${this.endPoint}/settings/${key}`;
    return await firstValueFrom(this.http.get(URL));
  }

  async getSettingBankAccount(): Promise<SettingsData['bankAccount']> {
    return await this.getSetting(USER_SETTING_KEYS.BANK_ACCOUNT) as SettingsData['bankAccount'];
  }

  async getSettingMomoWallet(): Promise<SettingsData['momoWallet']> {
    return await this.getSetting(USER_SETTING_KEYS.MOMO_WALLET) as SettingsData['momoWallet'];
  }

  async updateSetting(settings: unknown) {
    const URL = `${this.API_URL}/${this.endPoint}/settings`;
    return await firstValueFrom(this.http.put(URL, settings));
  }
}
