import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmitConge } from './submit-conge';

describe('SubmitConge', () => {
  let component: SubmitConge;
  let fixture: ComponentFixture<SubmitConge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmitConge]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubmitConge);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
