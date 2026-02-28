import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';  // Add for <mat-spinner> in template

import { LeaveBalanceComponent } from './leave-balance.component';

describe('LeaveBalanceComponent', () => {
  let component: LeaveBalanceComponent;
  let fixture: ComponentFixture<LeaveBalanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        LeaveBalanceComponent,  // Changed to imports (since it's standalone)
        HttpClientTestingModule,
        MatSnackBarModule,
        MatProgressSpinnerModule  // Add this to avoid any spinner-related test issues
      ]
    })
      .compileComponents();

    fixture = TestBed.createComponent(LeaveBalanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
