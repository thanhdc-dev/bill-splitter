import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

/**
 * Trạng thái rỗng dùng chung: icon + tiêu đề + mô tả + slot cho nút hành động.
 *
 * <app-empty-state icon="groups" title="Chưa có thành viên nào" description="...">
 *   <button mat-stroked-button>Thêm thành viên</button>
 * </app-empty-state>
 */
@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './empty-state.html',
  styleUrls: ['./empty-state.scss'],
})
export class EmptyStateComponent {
  /** Tên Material icon hiển thị ở giữa vòng tròn. */
  @Input({ required: true }) icon!: string;
  @Input({ required: true }) title!: string;
  @Input() description = '';
  /** `compact` dùng khi đặt bên trong tab/card đã có padding riêng. */
  @Input() compact = false;
}
