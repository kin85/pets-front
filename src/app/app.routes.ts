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

export const routes: Routes = [
  { path: 'login', component: Login },
  { path: 'register', component: Register },
  { path: 'home', component: Home },
  { path: 'veterinarians', component: Veterinarians },
  { path: 'profile', component: Profile },
  { path: 'dogs/new', component: AddDog },
  { path: 'dogs/:dogId/visits/new', component: VeterinaryVisitForm },
  { path: 'dogs/:dogId/visits/:visitId/edit', component: VeterinaryVisitForm },
  { path: 'dogs/:id', component: DogDetail },
  { path: 'veterinary-visits/:id', component: VeterinaryVisitDetail },
  { path: 'veterinary-visits/:visitId/treatments/new', component: VeterinaryTreatmentForm },
  { path: 'veterinary-visits/:visitId/treatments/:treatmentId/edit', component: VeterinaryTreatmentForm },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
