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
  progresso = 0;

  constructor(private readonly uploadService: UploadService) {}

  selecionarVideo(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.videoSelecionado = input.files?.[0] ?? null;
    this.mensagem = this.videoSelecionado ? `Vídeo selecionado: ${this.videoSelecionado.name}` : '';
    this.progresso = 0;
  }

  enviarVideo(): void {
    if (!this.videoSelecionado) {
      this.mensagem = 'Selecione um vídeo antes de enviar.';
      return;
    }

    const file = this.videoSelecionado;
    const totalPartes = Math.ceil(file.size / this.uploadService.CHUNK_SIZE);

    this.carregando = true;
    this.progresso = 0;
    this.mensagem = `Iniciando upload de ${totalPartes} parte(s)...`;

    this.uploadService.uploadVideo(file, (parte, total) => {
      this.progresso = Math.round((parte / total) * 95);
      this.mensagem = `Enviando parte ${parte} de ${total}...`;
    }).subscribe({
      next: () => {
        this.progresso = 100;
        this.mensagem = 'Upload realizado com sucesso!';
      },
      error: () => {
        this.mensagem = 'Falha no upload. Verifique sua conexão e tente novamente.';
        this.carregando = false;
      },
      complete: () => {
        this.carregando = false;
      }
    });
  }
}
