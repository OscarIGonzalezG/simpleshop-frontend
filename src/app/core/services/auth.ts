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

  // 🧠 Signal tipada con 'User' (importado del modelo)
  currentUser = signal<User | null>(this.getUserFromStorage());

  constructor() {}

  // 🔐 LOGIN
  login(credentials: LoginDto) {
    // Usamos AuthResponse en lugar de LoginResponse
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => this.saveSession(response))
    );
  }

  // 📝 REGISTER (NUEVO)
  register(data: RegisterDto) {
    // Si no viene plan, asignamos 'free' por defecto
    const payload = { ...data, plan: data.plan || 'free' };
    
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, payload).pipe(
      tap((response) => this.saveSession(response))
    );
  }

  // 💾 Método privado para no repetir código (DRY)
  private saveSession(response: AuthResponse) {
    localStorage.setItem('token', response.access_token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    // Actualizamos la signal
    this.currentUser.set(response.user);
  }

  // 🚪 LOGOUT
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
  }

  // 🔄 RECUPERAR USUARIO AL RECARGAR PÁGINA
  private getUserFromStorage(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }

  // ❓ ¿ESTÁ LOGUEADO?
  get isLoggedIn() {
    return !!this.currentUser();
  }
}