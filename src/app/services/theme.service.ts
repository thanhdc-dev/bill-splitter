import { Injectable, computed, effect, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'theme';
const DARK_CLASS = 'dark';

/**
 * Quản lý giao diện Sáng / Tối / Theo hệ thống.
 *
 * Chỉ bật/tắt class `.dark` trên <html>; toàn bộ màu do `color-scheme` trong
 * styles.scss quyết định (Material 3 emit token dưới dạng `light-dark()`).
 *
 * Lần render đầu tiên do đoạn script nhỏ trong index.html lo, để tránh nháy
 * trắng trước khi Angular bootstrap xong.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly darkMedia = window.matchMedia('(prefers-color-scheme: dark)');

  private readonly modeSignal = signal<ThemeMode>(readStoredMode());
  private readonly systemPrefersDark = signal(this.darkMedia.matches);

  readonly mode = this.modeSignal.asReadonly();
  readonly isDark = computed(() =>
    this.modeSignal() === 'system'
      ? this.systemPrefersDark()
      : this.modeSignal() === 'dark'
  );

  constructor() {
    this.darkMedia.addEventListener('change', (event) => {
      this.systemPrefersDark.set(event.matches);
    });

    effect(() => {
      document.documentElement.classList.toggle(DARK_CLASS, this.isDark());
    });
  }

  setMode(mode: ThemeMode): void {
    this.modeSignal.set(mode);
    try {
      localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // Chế độ riêng tư có thể chặn localStorage — vẫn đổi được trong phiên hiện tại.
    }
  }
}

function readStoredMode(): ThemeMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'light' || stored === 'dark' || stored === 'system') {
      return stored;
    }
  } catch {
    // bỏ qua, dùng mặc định
  }
  return 'system';
}
