import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    senha: ['', [Validators.required, Validators.minLength(6)]]
  });

  mensagem = '';
  carregando = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  entrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.carregando = true;
    this.mensagem = '';

    this.authService.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.mensagem = 'Login realizado com sucesso!';
        this.router.navigate(['/upload']);
      },
      error: () => {
        this.mensagem = 'Não foi possível realizar login. Verifique a API e os dados.';
        this.carregando = false;
      },
      complete: () => {
        this.carregando = false;
      }
    });
  }
}
