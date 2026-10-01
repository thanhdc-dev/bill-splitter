import { inject, Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Chia sẻ link bill: ưu tiên Web Share API (mở thẳng share sheet để chọn Zalo/Messenger),
 * fallback sang copy link khi trình duyệt không hỗ trợ hoặc share bị từ chối.
 */
@Injectable({ providedIn: 'root' })
export class BillShareService {
  private readonly snackBar = inject(MatSnackBar);

  async share(code: string, name?: string): Promise<void> {
    const data = this.buildShareData(code, name);
    if (await this.tryNativeShare(data)) return;
    await this.copyWithShareAction(data);
  }

  private buildShareData(code: string, name?: string): ShareData {
    const url = `${window.location.origin}/${code}`;
    const title = name?.trim();
    return title ? { title, text: `Chia tiền: ${title}`, url } : { url };
  }

  private canShare(data: ShareData): boolean {
    return typeof navigator.share === 'function' && (!navigator.canShare || navigator.canShare(data));
  }

  /**
   * @returns true nếu đã xử lý xong (share thành công hoặc user chủ động đóng share sheet).
   * false khi cần fallback: không hỗ trợ, hoặc bị từ chối (vd. hết user activation sau khi await lưu bill).
   */
  private async tryNativeShare(data: ShareData): Promise<boolean> {
    if (!this.canShare(data)) return false;
    try {
      await navigator.share(data);
      return true;
    } catch (err) {
      // AbortError = user đóng share sheet, không phải lỗi.
      return err instanceof DOMException && err.name === 'AbortError';
    }
  }

  private async copyWithShareAction(data: ShareData): Promise<void> {
    const url = data.url ?? '';
    try {
      await navigator.clipboard.writeText(url);
    } catch (err) {
      console.error('Lỗi khi copy URL:', err);
      this.snackBar.open('Không thể sao chép link', 'Đóng', { duration: 3000 });
      return;
    }
    if (!this.canShare(data)) {
      this.snackBar.open('Đã sao chép URL vào khay nhớ tạm!', 'Đóng', { duration: 3000 });
      return;
    }
    // Click vào nút action là user activation mới nên share sheet mở được.
    this.snackBar
      .open('Đã sao chép URL vào khay nhớ tạm!', 'Chia sẻ', { duration: 6000 })
      .onAction()
      .subscribe(() => {
        void this.tryNativeShare(data);
      });
  }
}
