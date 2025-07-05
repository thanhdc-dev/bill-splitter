import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillDetails } from './bill-details';

describe('BillDetails', () => {
  let component: BillDetails;
  let fixture: ComponentFixture<BillDetails>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillDetails]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BillDetails);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
