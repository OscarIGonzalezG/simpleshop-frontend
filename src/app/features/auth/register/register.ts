import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
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

  registerForm = this.fb.group({
    fullname: ['', [Validators.required, Validators.minLength(3)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    businessName: ['', [Validators.required]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]] 
  });

  // 🪄 Magia: Generar slug automáticamente al escribir el nombre del negocio
  onBusinessNameChange() {
    const businessName = this.registerForm.get('businessName')?.value || '';
    
    // Convertir "Mi Tienda 123" -> "mi-tienda-123"
    const slug = businessName
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Quitar caracteres raros
      .replace(/\s+/g, '-');        // Espacios por guiones

    // Actualizamos el campo slug
    this.registerForm.patchValue({ slug });
  }

  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    // Casteamos el valor del form a nuestra interfaz RegisterDto
    const formData = this.registerForm.value as unknown as RegisterDto;

    this.authService.register(formData).subscribe({
      next: () => {
        this.isLoading.set(false);
        // Al registrarse exitosamente, el backend ya devuelve el token y lo guardamos.
        // Redirigimos al Dashboard (futuro)
        this.router.navigate(['/admin']); 
      },
      error: (err) => {
        this.isLoading.set(false);
        // Manejo de errores (ej: slug duplicado)
        if (err.error?.message) {
          this.errorMessage.set(err.error.message);
        } else {
          this.errorMessage.set('Error al crear la cuenta. Intenta nuevamente.');
        }
      }
    });
  }

}
