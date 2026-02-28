import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

export const authInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {

  console.log(' ===== AUTH INTERCEPTOR START =====');
  console.log(' URL:', req.url);
  console.log(' Method:', req.method);
  console.log(' Original headers:', req.headers.keys());

  // Skip auth for authentication URLs
  if (req.url.includes('/api/auth/')) {
    console.log(' Skipping auth for authentication URL');
    return next(req);
  }
  if (req.url.includes('/api/password/')) {
    console.log(' Skipping auth for password management URL');
    return next(req);
  }

  const token = localStorage.getItem('authToken');
  console.log(' Token from localStorage:', token ? `PRESENT (${token.substring(0, 20)}...)` : 'NULL');

  if (token) {
    console.log(' Adding Authorization header to:', req.url);

    const authReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log(' Headers after:', authReq.headers.keys());
    console.log(' Authorization header value:', authReq.headers.get('Authorization'));
    console.log(' ===== AUTH INTERCEPTOR END =====');

    return next(authReq).pipe(
      tap({
        next: (event) => {
          console.log(' Request successful');
        },
        error: (error) => {
          console.error(' Request failed:', error);
          console.error(' Status:', error.status);
          console.error(' Message:', error.message);
        }
      })
    );
  }

  console.warn('No token found for request to:', req.url);
  console.log(' ===== AUTH INTERCEPTOR END =====');
  return next(req);
};
