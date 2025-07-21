import { CommonModule } from '@angular/common';
import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
} from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MAT_DIALOG_DATA,
  MatDialogModule,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ThousandSeparatorDirective } from '../../directives/thousand-separator';

interface EditFieldDialogData {
  label: string;
  value: string;
  type: 'text' | 'number' | 'amount';
}

@Component({
  selector: 'app-edit-field-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    FormsModule,
    ThousandSeparatorDirective,
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

  save(): void {
    this.handleChange.emit(this.value);
    this.dialogRef.close(this.value);
  }

  cancel(): void {
    this.dialogRef.close();
  }
}
