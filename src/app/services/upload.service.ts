import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class UploadService {
  constructor(private readonly http: HttpClient) {}

  uploadVideo(video: File): Observable<unknown> {
    const formData = new FormData();
    formData.append('video', video);

    return this.http.post(`${environment.apiBaseUrl}/videos/upload`, formData);
  }
}
