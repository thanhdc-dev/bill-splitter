import { ComponentFixture, TestBed } from '@angular/core/testing';
import { QrImageComponent } from './qr-image';

describe('QrImageComponent', () => {
  let fixture: ComponentFixture<QrImageComponent>;
  const el = (): HTMLElement => fixture.nativeElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(QrImageComponent);
    fixture.componentRef.setInput('src', 'http://api.test/qr/bank?amount=1000');
    fixture.detectChanges();
  });

  it('hiện ảnh QR với đúng nguồn khi chưa lỗi', () => {
    const img = el().querySelector('img')!;

    expect(img.getAttribute('src')).toBe('http://api.test/qr/bank?amount=1000');
    expect(el().querySelector('.qr-error')).toBeNull();
  });

  it('khi ảnh lỗi: báo lỗi rõ ràng kèm nút thử lại, không còn thẻ img', () => {
    el().querySelector('img')!.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(el().querySelector('img')).toBeNull();
    expect(el().querySelector('[role="alert"]')!.textContent).toContain('Không tạo được mã QR');
    expect(el().querySelector('button')!.textContent).toContain('Thử lại');
  });

  it('bấm thử lại tải lại ảnh với tham số retry để không dùng bản lỗi trong cache', () => {
    el().querySelector('img')!.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    el().querySelector('button')!.click();
    fixture.detectChanges();

    const img = el().querySelector('img')!;
    expect(img.getAttribute('src')).toBe('http://api.test/qr/bank?amount=1000&retry=1');
    // Trong lúc thử lại: ảnh tải ngầm (ẩn), khối lỗi và nút vẫn còn (giữ focus), nút aria-disabled.
    expect(img.hidden).toBeTrue();
    expect(el().querySelector('.qr-error')).not.toBeNull();
    expect(el().querySelector('button')!.getAttribute('aria-disabled')).toBe('true');
    expect(el().querySelector('button')!.textContent).toContain('Đang thử lại');
  });

  it('thử lại mà ảnh tải được thì hiện ảnh và bỏ khối lỗi', () => {
    el().querySelector('img')!.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    el().querySelector('button')!.click();
    fixture.detectChanges();

    el().querySelector('img')!.dispatchEvent(new Event('load'));
    fixture.detectChanges();

    expect(el().querySelector('.qr-error')).toBeNull();
    expect(el().querySelector('img')!.hidden).toBeFalse();
  });

  it('thử lại mà vẫn lỗi thì khối lỗi giữ nguyên và nút bật lại', () => {
    el().querySelector('img')!.dispatchEvent(new Event('error'));
    fixture.detectChanges();
    const button = el().querySelector('button')!;
    button.click();
    fixture.detectChanges();

    el().querySelector('img')!.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    expect(el().querySelector('button')).toBe(button);
    expect(button.getAttribute('aria-disabled')).toBe('false');
    expect(el().querySelector('img')).toBeNull();
  });

  it('đổi nguồn QR thì reset trạng thái lỗi và bỏ tham số retry', () => {
    el().querySelector('img')!.dispatchEvent(new Event('error'));
    fixture.detectChanges();

    fixture.componentRef.setInput('src', 'http://api.test/qr/bank?amount=2000');
    fixture.detectChanges();

    expect(el().querySelector('.qr-error')).toBeNull();
    expect(el().querySelector('img')!.getAttribute('src')).toBe('http://api.test/qr/bank?amount=2000');
  });
});
