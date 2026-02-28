import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SubmitCongeComponent } from './submit-conge';

describe('SubmitCongeComponent', () => {
  let component: SubmitCongeComponent;
  let fixture: ComponentFixture<SubmitCongeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubmitCongeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SubmitCongeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
