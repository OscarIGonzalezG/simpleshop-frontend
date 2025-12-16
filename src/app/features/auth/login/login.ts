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

        const user = this.authService.currentUser();

        if (user?.role === 'SUPER_ADMIN') {
          console.log('👑 Super Admin detectado. Redirigiendo a Platform...');
          this.router.navigate(['/platform']);
        } else {
          console.log('🏢 Usuario de tienda detectado. Redirigiendo a Admin...');
          this.router.navigate(['/admin']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        
        console.log('🚨 Error recibido:', err.error); // Para depurar en consola

        // 👇👇 LÓGICA BLINDADA 👇👇
        // 1. Revisamos si viene el código 'ACCOUNT_NOT_VERIFIED'
        // 2. O SI el mensaje contiene la palabra "verificar" (por si el GlobalFilter borró el código)
        const errorCode = err.error?.code;
        const errorMessage = err.error?.message || '';

        if (errorCode === 'ACCOUNT_NOT_VERIFIED' || errorMessage.toLowerCase().includes('verificar')) {
             console.log('⚠️ Cuenta no verificada. Redirigiendo a validación...');
             
             // Redirigimos pasando el email
             this.router.navigate(['/auth/verify'], { 
                 queryParams: { email: email } 
             });
             return; 
        }

        // Si es otro error, mostramos mensaje
        this.errorMessage.set(errorMessage || 'Credenciales incorrectas o error de conexión.');
      }
    });
  }
}