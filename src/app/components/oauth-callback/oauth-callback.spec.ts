import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OauthCallback } from './oauth-callback';

describe('OauthCallback', () => {
  let component: OauthCallback;
  let fixture: ComponentFixture<OauthCallback>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OauthCallback]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OauthCallback);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
