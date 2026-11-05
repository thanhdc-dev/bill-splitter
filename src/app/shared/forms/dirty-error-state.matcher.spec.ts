import { FormControl, FormGroupDirective, Validators } from '@angular/forms';
import { DirtyErrorStateMatcher } from './dirty-error-state.matcher';

describe('DirtyErrorStateMatcher', () => {
  const matcher = new DirtyErrorStateMatcher();
  const required = () => new FormControl('', Validators.required);
  const form = (submitted: boolean) => ({ submitted }) as FormGroupDirective;

  it('không báo lỗi ô trống chỉ vì đã touched (vd. ô vừa được dọn sau khi thêm thành công)', () => {
    const control = required();
    control.markAsTouched();

    expect(matcher.isErrorState(control, form(false))).toBeFalse();
  });

  it('báo lỗi khi người dùng đã gõ rồi để ô không hợp lệ', () => {
    const control = required();
    control.setValue('x');
    control.markAsDirty();
    control.setValue('');

    expect(matcher.isErrorState(control, form(false))).toBeTrue();
  });

  it('báo lỗi khi form đã được gửi mà ô vẫn không hợp lệ', () => {
    expect(matcher.isErrorState(required(), form(true))).toBeTrue();
  });

  it('không báo lỗi khi ô hợp lệ hoặc không có control', () => {
    const control = new FormControl('ok', Validators.required);
    control.markAsDirty();

    expect(matcher.isErrorState(control, form(true))).toBeFalse();
    expect(matcher.isErrorState(null, form(true))).toBeFalse();
  });
});
