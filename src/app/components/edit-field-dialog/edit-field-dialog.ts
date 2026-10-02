
import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ErrorStateMatcher } from '@angular/material/core';
import { ThousandSeparatorDirective } from '../../directives/thousand-separator';

interface EditFieldDialogData {
  label: string;
  value: string;
  type: 'text' | 'number' | 'amount';
}

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-edit-field-dialog',
  imports: [
    MatDialogModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ThousandSeparatorDirective
],
  templateUrl: './edit-field-dialog.html',
  styleUrl: './edit-field-dialog.scss',
})
export class EditFieldDialogComponent {
  dialogRef = inject<MatDialogRef<EditFieldDialogComponent>>(MatDialogRef);
  data = inject<EditFieldDialogData>(MAT_DIALOG_DATA);

  @Input() label = 'Edit Field';
  @Output() handleChange = new EventEmitter<string>();

  value = '';
  type = 'text';

  constructor() {
    if (this.data) {
      if (this.data.label) {
        this.label = this.data.label;
      }
      if (this.data.value) {
        this.value = this.data.value;
      }
      if (this.data.type) {
        this.type = this.data.type;
      }
    }
  }

  /**
   * Thông báo lỗi của giá trị đang nhập (null = hợp lệ). Cùng quy tắc với form thêm khoản mục:
   * tên không rỗng, số tiền là số >= 0 (0 được phép).
   */
  get error(): string | null {
    const raw = String(this.value ?? '').trim();
    if (this.type === 'text') {
      return raw ? null : 'Không được để trống';
    }
    if (!raw) return 'Vui lòng nhập số tiền';
    const amount = Number(raw);
    if (Number.isNaN(amount)) return 'Số tiền không hợp lệ';
    if (amount < 0) return 'Số tiền không được âm';
    return null;
  }

  /** Cho mat-error hiện ngay khi giá trị sai (template-driven ngModel không có touched/submitted). */
  readonly errorMatcher: ErrorStateMatcher = { isErrorState: () => !!this.error };

  save(): void {
    if (this.error) return;
    this.handleChange.emit(this.value);
    this.dialogRef.close(this.value);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
