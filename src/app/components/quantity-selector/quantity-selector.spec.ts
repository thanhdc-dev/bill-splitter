import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuantitySelectorDialog } from './quantity-selector-dialog';

describe('QuantitySelectorDialog', () => {
  let component: QuantitySelectorDialog;
  let fixture: ComponentFixture<QuantitySelectorDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuantitySelectorDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QuantitySelectorDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
