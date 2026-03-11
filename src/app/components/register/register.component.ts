import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {
  private readonly fb = inject(FormBuilder);

  readonly form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]]
  });

  mensagem = '';
  carregando = false;

  constructor(private readonly authService: AuthService) {}

  cadastrar(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.carregando = true;
    this.mensagem = '';

    this.authService.cadastrar(this.form.getRawValue()).subscribe({
      next: () => {
        this.mensagem = 'Usuário cadastrado com sucesso!';
      },
      error: () => {
        this.mensagem = 'Não foi possível cadastrar. Verifique a API.';
      },
      complete: () => {
        this.carregando = false;
      }
    });
  }
}
