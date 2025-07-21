import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditFieldDialog } from './edit-field-dialog';

describe('EditFieldDialog', () => {
  let component: EditFieldDialog;
  let fixture: ComponentFixture<EditFieldDialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditFieldDialog]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditFieldDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
