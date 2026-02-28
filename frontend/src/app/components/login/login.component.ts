import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service'; // ✅ Importer AuthService

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginForm: FormGroup;
  isLoading = false;
  errorMessage: string = ''; // ✅ Ajouter cette propriété

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService // ✅ Injecter AuthService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });
  }


onSubmit() {
  if (this.loginForm.valid) {
    this.isLoading = true;
    this.errorMessage = '';

    const loginData = {
      email: this.loginForm.get('email')?.value,
      password: this.loginForm.get('password')?.value
    };

    this.authService.login(loginData).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('✅ Login successful:', response);
        
        // ✅ REDIRECTION INTELLIGENTE selon le rôle
        if (this.authService.canViewEmployeeList()) {
          // HR/Manager → liste des employés
          this.router.navigate(['/employees']);
        } else {
          // Employé → son propre profil
          const userId = this.authService.getCurrentUserId();
          if (userId) {
            this.router.navigate(['/employees', userId]);
          } else {
            this.router.navigate(['/login']);
          }
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.errorMessage = error;
        console.error('❌ Login failed:', error);
      }
    });
  } else {
    this.loginForm.markAllAsTouched();
  }
}

}