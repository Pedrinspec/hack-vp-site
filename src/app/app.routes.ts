import { Routes } from '@angular/router';
import { LoginComponent } from './components/login/login.component';
import { RegisterComponent } from './components/register/register.component';
import { UploadComponent } from './components/upload/upload.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  { path: 'cadastro', component: RegisterComponent },
  { path: 'upload', component: UploadComponent },
  { path: '**', redirectTo: '' }
];
