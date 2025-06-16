import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemberTable } from './member-table';

describe('MemberTable', () => {
  let component: MemberTable;
  let fixture: ComponentFixture<MemberTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemberTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemberTable);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
