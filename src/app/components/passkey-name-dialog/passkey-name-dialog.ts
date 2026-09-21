import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { PASSKEY_DEVICE_NAME_MAX_LENGTH } from '../../services';
import { getDeviceNameFromUserAgent } from '../../shared/helpers';

@Component({
  selector: 'app-passkey-name-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './passkey-name-dialog.html',
  styleUrl: './passkey-name-dialog.scss',
})
export class PasskeyNameDialogComponent {
  private readonly dialogRef =
    inject<MatDialogRef<PasskeyNameDialogComponent>>(MatDialogRef);

  readonly maxLength = PASSKEY_DEVICE_NAME_MAX_LENGTH;

  nameCtrl = new FormControl(getDeviceNameFromUserAgent(), {
    nonNullable: true,
    validators: [Validators.maxLength(PASSKEY_DEVICE_NAME_MAX_LENGTH)],
  });

  onConfirm(): void {
    if (this.nameCtrl.invalid) {
      this.nameCtrl.markAsTouched();
      return;
    }
    // Trả chuỗi rỗng -> service bỏ qua deviceName, backend lưu null
    this.dialogRef.close(this.nameCtrl.value.trim());
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
