import { Injectable, computed, effect, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'theme';
const DARK_CLASS = 'dark';

/**
 * Quản lý giao diện Sáng / Tối.
 *
 * Người dùng mới: chốt theo `prefers-color-scheme` của hệ thống ngay lần đầu
 * và lưu vào localStorage — từ đó về sau không còn theo dõi thay đổi của hệ
 * thống nữa, chỉ đổi khi người dùng tự bấm nút.
 *
 * Chỉ bật/tắt class `.dark` trên <html>; toàn bộ màu do `color-scheme` trong
 * styles.scss quyết định (Material 3 emit token dưới dạng `light-dark()`).
 *
 * Lần render đầu tiên do đoạn script nhỏ trong index.html lo, để tránh nháy
 * trắng trước khi Angular bootstrap xong.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly modeSignal = signal<ThemeMode>(readStoredMode());

  readonly mode = this.modeSignal.asReadonly();
  readonly isDark = computed(() => this.modeSignal() === 'dark');

  constructor() {
    effect(() => {
      document.documentElement.classList.toggle(DARK_CLASS, this.isDark());
    });
  }

  setMode(mode: ThemeMode): void {
    this.modeSignal.set(mode);
    persistMode(mode);
  }

  toggle(): void {
    this.setMode(this.modeSignal() === 'dark' ? 'light' : 'dark');
  }
}

function readStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') {
      return stored;
    }
  } catch {
    // bỏ qua, dùng mặc định
  }

  const mode: ThemeMode = window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
  persistMode(mode);
  return mode;
}

function persistMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    // Chế độ riêng tư có thể chặn localStorage — vẫn đổi được trong phiên hiện tại.
  }
}
