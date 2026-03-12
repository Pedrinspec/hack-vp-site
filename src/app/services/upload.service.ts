import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, concatMap, from, map, toArray } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

interface StartUploadRequest {
  userId: string;
  originalFileName: string;
  fileSize: number;
  chunkSize: number;
}

export interface StartUploadResponse {
  uploadId: string;
  presignedUrls: string[];
}

interface PartConfirmRequest {
  partNumber: number;
  eTag: string;
}

@Injectable({ providedIn: 'root' })
export class UploadService {
  readonly CHUNK_SIZE = 5 * 1024 * 1024; // 5 MB (mínimo exigido pelo S3 multipart)

  private readonly base = `${environment.apiBaseUrl}/api/upload`;

  constructor(
    private readonly http: HttpClient,
    private readonly authService: AuthService
  ) {}

  private authHeaders(): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${this.authService.getToken()}` });
  }

  startUpload(file: File): Observable<StartUploadResponse> {
    const body: StartUploadRequest = {
      userId: this.authService.getUserId(),
      originalFileName: file.name,
      fileSize: file.size,
      chunkSize: this.CHUNK_SIZE,
    };
    return this.http.post<StartUploadResponse>(`${this.base}/start`, body, {
      headers: this.authHeaders(),
    });
  }

  uploadPart(presignedUrl: string, chunk: Blob): Observable<string> {
    return this.http.put(presignedUrl, chunk, { observe: 'response', responseType: 'text' }).pipe(
      map(res => res.headers.get('ETag') ?? '')
    );
  }

  confirmPart(uploadId: string, partNumber: number, eTag: string): Observable<unknown> {
    const body: PartConfirmRequest = { partNumber, eTag };
    return this.http.post(`${this.base}/${uploadId}/part/confirm`, body, {
      headers: this.authHeaders(),
    });
  }

  completeUpload(uploadId: string): Observable<unknown> {
    return this.http.post(`${this.base}/${uploadId}/complete`, {}, {
      headers: this.authHeaders(),
    });
  }

  uploadVideo(file: File, onProgress: (part: number, total: number) => void): Observable<unknown> {
    return this.startUpload(file).pipe(
      concatMap(({ uploadId, presignedUrls }) => {
        const total = presignedUrls.length;
        return from(presignedUrls).pipe(
          concatMap((url, index) => {
            const start = index * this.CHUNK_SIZE;
            const chunk = file.slice(start, start + this.CHUNK_SIZE);
            const partNumber = index + 1;
            return this.uploadPart(url, chunk).pipe(
              concatMap(eTag => {
                onProgress(partNumber, total);
                return this.confirmPart(uploadId, partNumber, eTag);
              })
            );
          }),
          toArray(),
          concatMap(() => this.completeUpload(uploadId))
        );
      })
    );
  }

  getDownloadUrl(fileName: string): string {
    return `${this.base}/download/${fileName}`;
  }
}
