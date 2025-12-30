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

  // 🧠 Signal tipada con 'User'
  currentUser = signal<User | null>(this.getUserFromStorage());

  constructor() {}

  // 🔐 LOGIN
  login(credentials: LoginDto) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => this.saveSession(response))
    );
  }

  // 📝 REGISTER
  register(data: RegisterDto) {
    // 👇 CAMBIO: Ya no inyectamos 'plan' ni tenant data. Solo enviamos lo que viene del form.
    return this.http.post<any>(`${this.apiUrl}/register`, data);
  }

  // ✅ VERIFICAR CUENTA
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

  // 💾 Guardar sesión
  private saveSession(response: AuthResponse) {
    localStorage.setItem('token', response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    this.currentUser.set(response.user);
  }

  // 🚪 Logout
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
  }

  // 🔄 Recuperar usuario
  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // ❓ ¿Está logueado?
  get isLoggedIn() {
    return !!this.currentUser();
  }
}