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

  // Signals para estado reactivo
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
      next: () => {
        this.isLoading.set(false);

        // 👇 LÓGICA DE REDIRECCIÓN INTELIGENTE
        // Leemos el usuario actual desde la signal del servicio
        const user = this.authService.currentUser();

        if (user?.role === 'SUPER_ADMIN') {
          // 👑 Es el Dueño del SaaS -> Panel de Plataforma
          console.log('👑 Super Admin detectado. Redirigiendo a Platform...');
          this.router.navigate(['/platform']);
        } else {
          // 🏢 Es un Cliente (Tenant) -> Panel de Administración
          console.log('🏢 Usuario de tienda detectado. Redirigiendo a Admin...');
          this.router.navigate(['/admin']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set('Credenciales incorrectas o error de conexión.');
        console.error(err);
      }
    });
  }
}