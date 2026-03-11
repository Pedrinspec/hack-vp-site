import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { UploadService } from '../../services/upload.service';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.css'
})
export class UploadComponent {
  videoSelecionado: File | null = null;
  mensagem = '';
  carregando = false;

  constructor(private readonly uploadService: UploadService) {}

  selecionarVideo(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.videoSelecionado = input.files?.[0] ?? null;
    this.mensagem = this.videoSelecionado ? `Vídeo selecionado: ${this.videoSelecionado.name}` : '';
  }

  enviarVideo(): void {
    if (!this.videoSelecionado) {
      this.mensagem = 'Selecione um vídeo antes de enviar.';
      return;
    }

    this.carregando = true;
    this.mensagem = 'Enviando vídeo para processamento...';

    this.uploadService.uploadVideo(this.videoSelecionado).subscribe({
      next: () => {
        this.mensagem = 'Upload enviado com sucesso!';
      },
      error: () => {
        this.mensagem = 'Falha no upload. Verifique a API de processamento.';
      },
      complete: () => {
        this.carregando = false;
      }
    });
  }
}
