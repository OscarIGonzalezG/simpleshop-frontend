import { HttpClient } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

// 👇 IMPORTAMOS LAS NUEVAS INTERFACES MODULARES
import { AuthResponse, LoginDto, RegisterDto } from '../models/auth.model';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/auth`;

  currentUser = signal<User | null>(this.getUserFromStorage());

  constructor() {}

  login(credentials: LoginDto) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => this.saveSession(response))
    );
  }

  register(data: RegisterDto) {
    return this.http.post<any>(`${this.apiUrl}/register`, data);
  }

  verifyAccount(email: string, code: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/verify`, { email, code }).pipe(
      tap((response) => {
        if (response.access_token) {
          this.saveSession(response);
        }
      })
    );
  }

  resendCode(email: string) {
    return this.http.post<any>(`${this.apiUrl}/resend`, { email });
  }

  // 👇 NUEVO MÉTODO: Permite actualizar el usuario sin reloguear
  // (Lo usaremos al finalizar el Onboarding)
  updateCurrentUser(user: User) {
    localStorage.setItem('user', JSON.stringify(user));
    this.currentUser.set(user);
  }

  private saveSession(response: AuthResponse) {
    localStorage.setItem('token', response.access_token);
    // Guardamos el tenantId dentro del objeto usuario para fácil acceso
    const userWithTenant = { 
        ...response.user, 
        tenantId: response.tenant?.id,
        tenant: response.tenant || undefined
    };
    localStorage.setItem('user', JSON.stringify(userWithTenant));
    this.currentUser.set(userWithTenant);
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
  }

  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  get isLoggedIn() {
    return !!this.currentUser();
  }
}