import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { CongeService, CongeRequest } from '../../services/conge.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-submit-conge',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './submit-conge.html',
  styleUrls: ['./submit-conge.css']
})
export class SubmitCongeComponent implements OnInit {
  congeForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  duration = 0;
  employeeId = ''; // Get this from authentication service or session

  constructor(
    private fb: FormBuilder,
    private congeService: CongeService,
    private router: Router
  ) {}
  private authService = inject(AuthService);

  ngOnInit(): void {
    // Get employee ID from authentication service
    this.employeeId = this.authService.getCurrentUserId() || '';

    if (!this.employeeId) {
      console.error('No employee ID found. User might not be logged in.');
      this.router.navigate(['/login']);
      return;
    }

    this.initForm();
    this.setupDateWatchers();
  }

  private initForm(): void {
    this.congeForm = this.fb.group({
      type: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      reason: ['', [Validators.required, Validators.minLength(10)]]
    }, {
      validators: this.dateRangeValidator
    });
  }

  private dateRangeValidator(control: AbstractControl): ValidationErrors | null {
    const startDate = control.get('startDate')?.value;
    const endDate = control.get('endDate')?.value;

    if (!startDate || !endDate) {
      return null;
    }

    return new Date(endDate) >= new Date(startDate) ? null : { dateRangeInvalid: true };
  }

  private setupDateWatchers(): void {
    this.congeForm.get('startDate')?.valueChanges.subscribe(() => {
      this.calculateDuration();
    });

    this.congeForm.get('endDate')?.valueChanges.subscribe(() => {
      this.calculateDuration();
    });
  }

  private calculateDuration(): void {
    const startDate = this.congeForm.get('startDate')?.value;
    const endDate = this.congeForm.get('endDate')?.value;

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const timeDiff = end.getTime() - start.getTime();
      this.duration = Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1;
    } else {
      this.duration = 0;
    }
  }

  get type() {
    return this.congeForm.get('type');
  }

  get startDate() {
    return this.congeForm.get('startDate');
  }

  get endDate() {
    return this.congeForm.get('endDate');
  }

  get reason() {
    return this.congeForm.get('reason');
  }

  formatDate(value: any): string {
    if (!value) return '';
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return value;
    }
    const date = new Date(value);
    return date.toISOString().split('T')[0];
  }

  onSubmit(): void {
    if (this.congeForm.valid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const request: CongeRequest = {
        type: this.congeForm.value.type,
        startDate: this.formatDate(this.congeForm.value.startDate),
        endDate: this.formatDate(this.congeForm.value.endDate),
        reason: this.congeForm.value.reason
      };

      this.congeService.submitCongeRequest(this.employeeId, request).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = 'Leave request submitted successfully! Redirecting...';
          this.congeForm.reset();

          // Redirect to conge list after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/conges/my-requests']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          this.errorMessage = error.error || 'Failed to submit leave request. Please try again.';
          console.error('Submit conge error:', error);
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.congeForm.controls).forEach(key => {
        this.congeForm.get(key)?.markAsTouched();
      });
    }
  }

  onCancel(): void {
    this.router.navigate(['/conges/my-requests']);
  }
}
