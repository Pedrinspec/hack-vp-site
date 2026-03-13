import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription, interval } from 'rxjs';
import { UploadService, VideoProcessingItem, VideoView } from '../../services/upload.service';

interface LocalVideo {
  file: File;
  status: string;
  downloadUrl?: string;
}

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './upload.component.html',
  styleUrl: './upload.component.css'
})
export class UploadComponent implements OnInit, OnDestroy {
  videos: LocalVideo[] = [];
  processamentos: VideoView[] = [];
  mensagem = '';
  carregando = false;
  progresso = 0;
  

  private pollingSub?: Subscription;

  constructor(private readonly uploadService: UploadService) {}

  ngOnInit(): void {
    this.carregarProcessamentos();
    this.pollingSub = interval(5000).subscribe(() => this.carregarProcessamentos());
  }

  ngOnDestroy(): void {
    this.pollingSub?.unsubscribe();
  }

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
          video.status = 'Processando';
          if (!this.pollingSub || this.pollingSub.closed) {
            this.pollingSub = interval(5000).subscribe(() => this.carregarProcessamentos());
          }
          this.carregarProcessamentos();
        },
        error: () => {
          video.status = 'Erro';
          this.mensagem = 'Falha ao enviar um ou mais vídeos.';
        },
        complete: () => {
          this.carregando = this.videos.some(v => v.status === 'Enviando');
          if (!this.carregando) {
            this.progresso = 100;
            this.mensagem = 'Upload concluído. Aguardando processamento dos vídeos.';
          }
        }
      });
    });
  }

  private static readonly STATUS_FINAIS = ['processado', 'erro no processamento', 'erro no carregamento'];

  carregarProcessamentos(): void {
    this.uploadService.listarProcessamentos().subscribe({
      next: videos => {
        this.processamentos = videos;
        const todosFinalizados = videos.length > 0 && videos.every(v =>
          UploadComponent.STATUS_FINAIS.includes(v.videoStatus?.toLowerCase() ?? '')
        );
        if (todosFinalizados) {
          this.pollingSub?.unsubscribe();
        }
      },
      error: () => {
        this.mensagem = 'Não foi possível atualizar a lista de processamentos.';
      }
    });
  }

  baixarImagens(uploadId: string): void {
    const url = this.uploadService.getDownloadUrl(uploadId);
    window.open(url, '_blank');
  }

  podeDownload(status?: string): boolean {
    return (status?.toLowerCase() ?? '') === 'processado';
  }

  podeReprocessar(status?: string): boolean {
    const s = status?.toLowerCase() ?? '';
    return s === 'carregado' || s === 'erro no processamento' || s === 'erro no carregamento';
  }

  reprocessarVideo(uploadId: string): void {
    this.uploadService.reprocess(uploadId).subscribe({
      next: () => {
        this.mensagem = 'Reprocessamento solicitado.';
        if (!this.pollingSub || this.pollingSub.closed) {
          this.pollingSub = interval(5000).subscribe(() => this.carregarProcessamentos());
        }
      },
      error: () => {
        this.mensagem = 'Falha ao solicitar reprocessamento.';
      }
    });
  }

  statusClasse(status?: string): string {
    const normalizado = status?.toLowerCase() ?? '';

    if (normalizado.includes('conclu')) {
      return 'status-concluido';
    }

    if (normalizado.includes('erro') || normalizado.includes('falha')) {
      return 'status-erro';
    }

    return 'status-processando';
  }
}
