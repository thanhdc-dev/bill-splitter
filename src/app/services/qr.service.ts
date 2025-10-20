import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class QRService {
  private readonly endPoint = 'qr';

  /**
   * Builds a QR code URL with the given parameters.
   */
  buildQRCodeUrl(
    accountNumber: string,
    bankCode: string,
    options?: {
      amount?: number;
      description?: string;
      isDownload?: boolean;
    }
  ): string {
    const base = `${environment.apiUrl}/${this.endPoint}/bank`;
    const url = new URL(base);
    const params: {
      accountNumber: string;
      bankCode: string;
      amount?: string;
      description?: string;
      isDownload?: string;
    } = {
      accountNumber: encodeURIComponent(accountNumber),
      bankCode: encodeURIComponent(bankCode),
    };
    if (options?.amount) {
      params.amount = encodeURIComponent(options.amount);
    }
    if (options?.description) {
      params.description = options.description;
    }
    if (options?.isDownload) {
      params.isDownload = encodeURIComponent(options.isDownload);
    }

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    return url.toString();
  }

  buildMomoQRCodeUrl(
    accountNumber: string,
    options?: {
      amount?: number;
      description?: string;
      isDownload?: boolean;
    }
  ): string {
    const base = `${environment.apiUrl}/${this.endPoint}/momo`;
    const url = new URL(base);
    const params: {
      accountNumber: string;
      amount?: string;
      description?: string;
      isDownload?: string;
    } = {
      accountNumber: encodeURIComponent(accountNumber),
    };
    if (options?.amount) {
      params.amount = encodeURIComponent(options.amount);
    }
    if (options?.description) {
      params.description = options.description;
    }
    if (options?.isDownload) {
      params.isDownload = encodeURIComponent(options.isDownload);
    }

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });

    return url.toString();
  }
}
