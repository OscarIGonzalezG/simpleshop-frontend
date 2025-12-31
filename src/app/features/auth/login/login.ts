import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'      
})
export class Login {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal('');

  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  onSubmit() {
    if (this.loginForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.loginForm.value;

    this.authService.login({ email: email!, password: password! }).subscribe({
      next: (response) => { // 👈 Recibimos la respuesta completa (user + tenant)
        this.isLoading.set(false);

        const user = response.user;
        const tenant = response.tenant;

        console.log('✅ Login exitoso. Analizando redirección...');

        // 1. SUPER ADMIN -> Panel de Plataforma
        if (user.role === 'SUPER_ADMIN') {
          console.log('👑 Super Admin. Go -> /platform');
          this.router.navigate(['/platform']);
          return;
        }

        // 2. USUARIO CON TIENDA -> Panel de Administración
        if (tenant) {
          console.log('🏢 Tiene Tienda. Go -> /admin');
          this.router.navigate(['/admin']);
          return;
        }

        // 3. USUARIO NUEVO (SIN TIENDA) -> Onboarding
        console.log('🚀 Usuario Nuevo. Go -> /setup');
        this.router.navigate(['/setup']);
      },
      error: (err) => {
        this.isLoading.set(false);
        console.log('🚨 Error recibido:', err.error);

        const errorCode = err.error?.code;
        const errorMessage = err.error?.message || '';

        if (errorCode === 'ACCOUNT_NOT_VERIFIED' || errorMessage.toLowerCase().includes('verificar')) {
             console.log('⚠️ Cuenta no verificada. Redirigiendo...');
             this.router.navigate(['/auth/verify'], { queryParams: { email: email } });
             return; 
        }

        this.errorMessage.set(errorMessage || 'Credenciales incorrectas o error de conexión.');
      }
    });
  }
}