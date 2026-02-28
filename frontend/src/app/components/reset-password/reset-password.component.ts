import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PasswordResetService } from '../../services/password-reset.service';

@Component({
  selector: 'app-reset-password',
  standalone : true,
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
  imports : [ReactiveFormsModule]
})
export class ResetPasswordComponent implements OnInit {
  resetForm!: FormGroup;
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  token = '';
  tokenValid = false;

  constructor(
    private fb: FormBuilder,
    private passwordResetService: PasswordResetService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Get token from URL query parameters
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
      if (this.token) {
        this.validateToken();
      } else {
        this.errorMessage = 'Invalid reset link. Please request a new password reset.';
      }
    });

    this.initForm();
  }

  private initForm(): void {
    this.resetForm = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  /**
   * Custom validator to check if passwords match
   */
  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  get email() {
    return this.resetForm.get('email');
  }

  get password() {
    return this.resetForm.get('password');
  }

  get confirmPassword() {
    return this.resetForm.get('confirmPassword');
  }

  /**
   * Validate the token from URL
   */
  private validateToken(): void {
    this.passwordResetService.validateToken(this.token).subscribe({
      next: (response) => {
        this.tokenValid = true;
        console.log('Token is valid');
      },
      error: (error) => {
        this.tokenValid = false;
        this.errorMessage = 'This password reset link is invalid or has expired. Please request a new one.';
        console.error('Token validation error:', error);
      }
    });
  }

  onSubmit(): void {
    if (this.resetForm.valid && this.tokenValid) {
      this.isLoading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const newPassword = this.resetForm.value.password;

      this.passwordResetService.resetPassword(this.token, newPassword).subscribe({
        next: (response) => {
          this.isLoading = false;
          this.successMessage = 'Your password has been reset successfully! Redirecting to login...';
          this.resetForm.reset();

          // Redirect to login after 2 seconds
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 2000);
        },
        error: (error) => {
          this.isLoading = false;
          if (error.status === 400) {
            this.errorMessage = error.error || 'Invalid or expired token. Please request a new password reset.';
          } else {
            this.errorMessage = 'An error occurred while resetting your password. Please try again.';
          }
          console.error('Reset password error:', error);
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.keys(this.resetForm.controls).forEach(key => {
        this.resetForm.get(key)?.markAsTouched();
      });

      if (!this.tokenValid) {
        this.errorMessage = 'Invalid or expired reset link.';
      }
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }
}
