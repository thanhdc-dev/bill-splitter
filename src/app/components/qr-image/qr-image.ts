import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  computed,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

/**
 * Ảnh mã QR có trạng thái lỗi. QR do server dựng (`QRService.buildQRCodeUrl`): khi server lỗi hoặc
 * mạng đứt, thẻ `<img>` thường chỉ hiện biểu tượng ảnh hỏng kèm chữ alt — người nhận tiền không biết
 * chuyện gì và không có cách thử lại. Component báo rõ và cho thử lại ngay tại chỗ.
 */
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-qr-image',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './qr-image.html',
  styleUrl: './qr-image.scss',
})
export class QrImageComponent implements OnChanges {
  @Input({ required: true }) src!: string;
  @Input() alt = 'Mã QR';
  /** Kích thước (px) của ảnh; khung lỗi giữ cùng chiều cao để bố cục không nhảy. */
  @Input() size = 250;
  /** Viền mảnh và bo góc quanh ảnh (dùng khi ảnh không nằm trong khung riêng). */
  @Input() framed = false;

  readonly state = signal<'loading' | 'loaded' | 'error'>('loading');
  private readonly attempt = signal(0);
  private readonly source = signal('');

  /** URL thực dùng cho <img>: thêm tham số `retry` khi thử lại để trình duyệt không dùng bản lỗi. */
  readonly url = computed(() => {
    const attempt = this.attempt();
    const base = this.source();
    if (!attempt) return base;
    return `${base}${base.includes('?') ? '&' : '?'}retry=${attempt}`;
  });

  /** Đang tải lại sau khi bấm "Thử lại": ảnh tải ngầm (ẩn), khối lỗi vẫn hiện. */
  readonly isRetrying = computed(() => this.attempt() > 0 && this.state() === 'loading');
  readonly showError = computed(() => this.state() === 'error' || this.isRetrying());

  ngOnChanges(changes: SimpleChanges): void {
    // Chỉ reset khi nguồn QR đổi (alt/size/framed đổi không được xoá trạng thái lỗi).
    if (!changes['src']) return;
    this.source.set(this.src);
    this.attempt.set(0);
    this.state.set('loading');
  }

  onLoad(): void {
    this.state.set('loaded');
  }

  onError(): void {
    this.state.set('error');
  }

  retry(): void {
    if (this.isRetrying()) return;
    this.attempt.update((count) => count + 1);
    this.state.set('loading');
  }
}
