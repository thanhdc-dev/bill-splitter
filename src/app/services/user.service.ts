import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { HttpClient } from '@angular/common/http';

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

  async updateSetting(settings: unknown) {
    const URL = `${this.API_URL}/${this.endPoint}/settings/`;
    return await firstValueFrom(this.http.put(URL, settings));
  }
}
