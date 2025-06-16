import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillSplitter } from './bill-splitter';

describe('BillSplitter', () => {
  let component: BillSplitter;
  let fixture: ComponentFixture<BillSplitter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillSplitter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillSplitter);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
