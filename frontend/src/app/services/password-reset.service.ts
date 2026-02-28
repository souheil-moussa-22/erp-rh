// password-reset.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ForgotPasswordRequest {
  email: string;
  applicationUrl: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

@Injectable({
  providedIn: 'root'
})
export class PasswordResetService {
private apiUrl = `${environment.apiUrl}/api`;

  constructor(private http: HttpClient) { }

  /**
   * Send forgot password email
   */
  forgotPassword(email: string): Observable<any> {
    const request: ForgotPasswordRequest = {
      email: email,
      applicationUrl: window.location.origin // Gets the frontend URL automatically
    };

    return this.http.post(`${this.apiUrl}/password/forgot`, request, {
      responseType: 'text'
    });
  }

  /**
   * Validate password reset token
   */
  validateToken(token: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/password/validate-token`, {
      params: { token },
      responseType: 'text'
    });
  }

  /**
   * Reset password with token
   */
  resetPassword(token: string, newPassword: string): Observable<any> {
    const request: ResetPasswordRequest = {
      token: token,
      newPassword: newPassword
    };

    return this.http.post(`${this.apiUrl}/password/reset`, request, {
      responseType: 'text'
    });
  }
}
