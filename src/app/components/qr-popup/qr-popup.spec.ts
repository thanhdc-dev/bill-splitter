import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QrPopup } from './qr-popup';

describe('QrPopup', () => {
  let component: QrPopup;
  let fixture: ComponentFixture<QrPopup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QrPopup]
    })
    .compileComponents();

    fixture = TestBed.createComponent(QrPopup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
