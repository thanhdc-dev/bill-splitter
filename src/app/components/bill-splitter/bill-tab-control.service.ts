import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class BillTabControlService {
  private tabChangeSubject = new Subject<number>();
  tabChange$ = this.tabChangeSubject.asObservable();

  changeTab(index: number) {
    this.tabChangeSubject.next(index);
  }
}
