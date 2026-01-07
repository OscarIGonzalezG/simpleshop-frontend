import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PlatformService } from '../../../core/services/platform';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-setup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './setup.html',
  styleUrl: './setup.css',
})
export class Setup {
  private fb = inject(FormBuilder);
  private platformService = inject(PlatformService);
  private authService = inject(AuthService);
  private router = inject(Router);

  isLoading = signal(false);
  errorMessage = signal('');

  setupForm = this.fb.group({
    businessName: ['', [Validators.required, Validators.minLength(3)]],
    slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]]
  });

  onNameChange() {
    const name = this.setupForm.get('businessName')?.value || '';
    const slug = name.toLowerCase().trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    
    this.setupForm.patchValue({ slug });
  }

  onSubmit() {
    if (this.setupForm.invalid) return;

    this.isLoading.set(true);
    this.errorMessage.set('');
    
    const formValue = this.setupForm.value;
    const currentUser = this.authService.currentUser();

    // 👇 PAYLOAD CORREGIDO 👇
    const payload = {
      // ⚠️ CORRECCIÓN: El backend pide 'businessName', no 'name'
      businessName: formValue.businessName, 
      
      // Enviamos también 'name' por si acaso tu DTO usa ambos (algunos backends usan name como duplicado)
      name: formValue.businessName, 

      slug: formValue.slug,
      email: currentUser?.email,     
      plan: 'free',                  
      maxUsers: 1,                   
      maxStorageMB: 500              
    };

    this.platformService.createTenant(payload as any).subscribe({
      next: (tenant: any) => {
        
        if (currentUser) {
            const updatedUser = { 
                ...currentUser, 
                role: 'OWNER', 
                tenantId: tenant.id,
                tenant: tenant 
            };
            this.authService.updateCurrentUser(updatedUser); 
        }

        this.isLoading.set(false);
        console.log('✅ Setup completado. Redirigiendo al Dashboard...');
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        console.error('Error Backend:', err); 
        
        const msg = Array.isArray(err.error?.message) 
          ? err.error.message[0] 
          : (err.error?.message || 'Error al configurar el espacio de trabajo.');
          
        this.errorMessage.set(msg);
      }
    });
  }
}