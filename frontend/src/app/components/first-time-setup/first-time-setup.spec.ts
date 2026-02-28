import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FirstTimeSetup } from './first-time-setup';

describe('FirstTimeSetup', () => {
  let component: FirstTimeSetup;
  let fixture: ComponentFixture<FirstTimeSetup>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FirstTimeSetup]
    })
      .compileComponents();

    fixture = TestBed.createComponent(FirstTimeSetup);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
