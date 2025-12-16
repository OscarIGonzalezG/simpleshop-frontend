import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { interval, Subscription } from 'rxjs';

@Component({
  selector: 'app-verify-email',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css',
})
export class VerifyEmail implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private authService = inject(AuthService);

  email = signal('');
  code = signal('');
  isLoading = signal(false);
  
  // 👇 NUEVO: Estados para Notificaciones (Toast)
  errorMessage = signal('');
  successMessage = signal('');
  showToast = signal(false);

  // Timer Principal
  timeLeft = signal(300); 
  displayTime = signal('05:00');
  private timerSub?: Subscription;

  // 👇 NUEVO: Timer para Cooldown de Reenvío
  isResending = signal(false);
  resendCooldown = signal(0);
  private resendTimerSub?: Subscription;

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.email.set(params['email'] || '');
      
      if (!this.email()) {
        this.router.navigate(['/auth/login']);
      } else {
        this.startTimer();
      }
    });
  }

  // 👇 Lógica del Reloj Principal
  startTimer() {
    if (this.timerSub) this.timerSub.unsubscribe();

    this.timerSub = interval(1000).subscribe(() => {
      const current = this.timeLeft();
      
      if (current > 0) {
        this.timeLeft.set(current - 1);
        this.updateDisplayTime();
      } else {
        this.timerSub?.unsubscribe();
        this.showNotification('El tiempo expiró. Registro eliminado.', 'error');
        
        setTimeout(() => {
          this.router.navigate(['/auth/register']);
        }, 3000);
      }
    });
  }

  updateDisplayTime() {
    const m = Math.floor(this.timeLeft() / 60);
    const s = this.timeLeft() % 60;
    this.displayTime.set(`${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`);
  }

  onVerify() {
    if (this.code().length < 6) return;

    this.isLoading.set(true);
    this.errorMessage.set('');

    this.authService.verifyAccount(this.email(), this.code()).subscribe({
      next: () => {
        this.router.navigate(['/admin/dashboard']);
      },
      error: (err: any) => {
        this.isLoading.set(false);
        this.showNotification(err.error?.message || 'Código incorrecto', 'error');
      }
    });
  }

  // 👇 Lógica de Reenviar Código (Mejorada)
  onResend() {
    if (this.isResending() || this.resendCooldown() > 0) return;
    
    this.isResending.set(true);

    this.authService.resendCode(this.email()).subscribe({
      next: () => {
        this.isResending.set(false);
        
        // 1. Reiniciamos el reloj principal (Visualmente)
        this.timeLeft.set(300);
        this.updateDisplayTime();
        this.startTimer(); 

        // 2. Iniciamos el Cooldown del botón (60s)
        this.startResendTimer();
        
        // 3. Notificación bonita
        this.showNotification('¡Código reenviado! Revisa tu email.', 'success');
      },
      error: (err: any) => {
        this.isResending.set(false);
        this.showNotification(err.error?.message || 'No se pudo reenviar.', 'error');
      }
    });
  }

  startResendTimer() {
    this.resendCooldown.set(60); // 60 segundos de espera
    if (this.resendTimerSub) this.resendTimerSub.unsubscribe();

    this.resendTimerSub = interval(1000).subscribe(() => {
        const current = this.resendCooldown();
        if (current > 0) {
            this.resendCooldown.set(current - 1);
        } else {
            this.resendTimerSub?.unsubscribe();
        }
    });
  }

  // 👇 Función auxiliar para mostrar Toasts
  showNotification(msg: string, type: 'success' | 'error') {
    if (type === 'error') {
        this.errorMessage.set(msg);
        this.successMessage.set('');
    } else {
        this.successMessage.set(msg);
        this.errorMessage.set('');
    }
    this.showToast.set(true);

    // Ocultar a los 4 segundos
    setTimeout(() => {
        this.showToast.set(false);
        // Limpiar textos post-animación
        setTimeout(() => {
            if(!this.showToast()) { // Doble check
                this.errorMessage.set('');
                this.successMessage.set('');
            }
        }, 300);
    }, 4000);
  }

  ngOnDestroy() {
    this.timerSub?.unsubscribe();
    this.resendTimerSub?.unsubscribe();
  }
}