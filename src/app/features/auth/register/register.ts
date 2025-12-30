import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { RegisterDto } from '../../../core/models/auth.model'; //

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal('');

  // 👇 NUEVO: Control de visibilidad de contraseñas
  showPassword = signal(false);
  showConfirmPassword = signal(false);

  // 👇 FORMULARIO ACTUALIZADO
  registerForm = this.fb.group({
    fullname: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['', [Validators.required]] // Campo nuevo
  }, { validators: this.passwordMatchValidator }); // 👈 Validador de grupo

  // 👇 VALIDACIÓN PERSONALIZADA
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    // Si no coinciden y ambos tienen valor, devolvemos error
    if (password && confirmPassword && password !== confirmPassword) {
      return { mismatch: true };
    }
    return null;
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    // 👇 IMPORTANTE: Extraemos solo lo que el Backend necesita
    // (Ignoramos confirmPassword)
    const { confirmPassword, ...registerData } = this.registerForm.value;

    // Casteamos a RegisterDto
    const formData = registerData as RegisterDto;

    this.authService.register(formData).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/auth/verify'], { 
          queryParams: { email: formData.email } 
        });
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.error?.message) {
          this.errorMessage.set(err.error.message);
        } else {
          this.errorMessage.set('Error al crear la cuenta. Intenta nuevamente.');
        }
      }
    });
  }
}