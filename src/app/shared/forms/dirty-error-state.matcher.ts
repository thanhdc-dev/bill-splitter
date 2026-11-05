import { FormControl, FormGroupDirective, NgForm } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';

/**
 * Chỉ báo lỗi khi người dùng đã gõ vào ô (rồi xoá/để sai) hoặc đã bấm gửi form. Matcher mặc định
 * của Material báo lỗi cả khi chỉ `touched`: sau khi thêm thành công, ô nhập giữ focus; bấm sang
 * chỗ khác làm nó `touched` và hiện "Vui lòng nhập…" dưới một ô vừa được dọn sạch.
 */
export class DirtyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    return !!(control && control.invalid && (control.dirty || form?.submitted));
  }
}
