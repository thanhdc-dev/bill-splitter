import { shouldUseCards } from './member-table';

describe('shouldUseCards', () => {
  it('viewport hẹp (mobile) luôn dùng card, kể cả khi panel rộng', () => {
    expect(shouldUseCards(2000, 1, true)).toBeTrue();
  });

  it('chưa đo được chiều rộng (0) thì dùng card để không vẽ bảng bị cắt', () => {
    expect(shouldUseCards(0, 3, false)).toBeTrue();
  });

  it('panel hẹp hơn bảng cần (layout 2 cột ở 1280px: ~512px) dùng card', () => {
    expect(shouldUseCards(512, 3, false)).toBeTrue();
    expect(shouldUseCards(543, 1, false)).toBeTrue();
  });

  it('panel đủ rộng cho bảng thì dùng bảng', () => {
    // 3 khoản mục: bảng cần 398 + 3 × 150 = 848, cộng 46 padding/viền của panel.
    expect(shouldUseCards(894, 3, false)).toBeFalse();
    expect(shouldUseCards(893, 3, false)).toBeTrue();
  });

  it('không có khoản mục nào: bảng vẫn cần tối thiểu 600px', () => {
    expect(shouldUseCards(645, 0, false)).toBeTrue();
    expect(shouldUseCards(646, 0, false)).toBeFalse();
  });
});
