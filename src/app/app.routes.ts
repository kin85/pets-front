import { Routes } from '@angular/router';
import { Login } from './pages/login/login';
import { Home } from './pages/home/home';
import { Register } from './pages/register/register';
import { AddDog } from './pages/add-dog/add-dog';
import { DogDetail } from './pages/dog-detail/dog-detail';
import { Veterinarians } from './pages/veterinarians/veterinarians';
import { Profile } from './pages/profile/profile';
import { VeterinaryVisitDetail } from './pages/veterinary-visit-detail/veterinary-visit-detail';
import { VeterinaryVisitForm } from './pages/veterinary-visit-form/veterinary-visit-form';
import { VeterinaryTreatmentForm } from './pages/veterinary-treatment-form/veterinary-treatment-form';
import { Admin } from './pages/admin/admin';
import { ConfirmEmail } from './pages/confirm-email/confirm-email';
import { ResetPassword } from './pages/reset-password/reset-password';
import { adminGuard, guestGuard, ownerGuard } from './guards/auth.guards';

export const routes: Routes = [
  { path: 'login', component: Login, canActivate: [guestGuard] },
  { path: 'register', component: Register, canActivate: [guestGuard] },
  { path: 'confirm-email', component: ConfirmEmail },
  { path: 'reset-password', component: ResetPassword },
  { path: 'admin', component: Admin, canActivate: [adminGuard] },
  { path: 'home', component: Home, canActivate: [ownerGuard] },
  { path: 'veterinarians', component: Veterinarians, canActivate: [ownerGuard] },
  { path: 'profile', component: Profile, canActivate: [ownerGuard] },
  { path: 'dogs/new', component: AddDog, canActivate: [ownerGuard] },
  { path: 'dogs/:dogId/visits/new', component: VeterinaryVisitForm, canActivate: [ownerGuard] },
  { path: 'dogs/:dogId/visits/:visitId/edit', component: VeterinaryVisitForm, canActivate: [ownerGuard] },
  { path: 'dogs/:id', component: DogDetail, canActivate: [ownerGuard] },
  { path: 'veterinary-visits/:id', component: VeterinaryVisitDetail, canActivate: [ownerGuard] },
  {
    path: 'veterinary-visits/:visitId/treatments/new',
    component: VeterinaryTreatmentForm,
    canActivate: [ownerGuard],
  },
  {
    path: 'veterinary-visits/:visitId/treatments/:treatmentId/edit',
    component: VeterinaryTreatmentForm,
    canActivate: [ownerGuard],
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
