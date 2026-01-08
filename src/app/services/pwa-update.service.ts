import { Injectable, inject } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class PwaUpdateService {
  private readonly swUpdate = inject(SwUpdate);
  private readonly snackBar = inject(MatSnackBar);

  init() {
    if (!this.swUpdate.isEnabled) {
      return;
    }

    this.swUpdate.versionUpdates.subscribe(event => {
      if (event.type === 'VERSION_READY') {
        const snackBarRef = this.snackBar.open(
          'Có phiên bản mới! Tải lại để cập nhật.',
          'Tải lại',
          { duration: 0 }
        );

        snackBarRef.onAction().subscribe(() => {
          window.location.reload();
        });
      }
    });
  }
}
