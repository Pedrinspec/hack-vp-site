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
  videos: { file: File; status: string; downloadUrl?: string }[] = [];
  mensagem = '';
  carregando = false;
  progresso = 0;

  constructor(private readonly uploadService: UploadService) {}

  selecionarVideos(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = Array.from(input.files ?? []);
    this.videos = files.map(file => ({ file, status: 'Pendente' }));
    this.mensagem = files.length > 0 ? `${files.length} vídeo(s) selecionado(s)` : '';
    this.progresso = 0;
  }

  enviarVideos(): void {
    if (this.videos.length === 0) {
      this.mensagem = 'Selecione vídeos antes de enviar.';
      return;
    }

    this.carregando = true;
    this.progresso = 0;
    this.mensagem = 'Iniciando upload de vídeos...';

    this.videos.forEach(video => {
      video.status = 'Enviando';
      this.uploadService.uploadVideo(video.file, (parte, total) => {
        this.progresso = Math.round((parte / total) * 95);
      }).subscribe({
        next: () => {
          video.status = 'Concluído';
          video.downloadUrl = `${this.uploadService.getDownloadUrl(video.file.name)}`;
        },
        error: () => {
          video.status = 'Erro';
        },
        complete: () => {
          this.carregando = this.videos.some(v => v.status === 'Enviando');
        }
      });
    });
  }

  baixarVideo(url: string): void {
    window.open(url, '_blank');
  }
}
