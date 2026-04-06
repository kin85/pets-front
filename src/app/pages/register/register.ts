import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, RegisterRequest } from '../../services/auth';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss',
})
export class Register {
  username = '';
  email = '';
  password = '';
  name = '';
  address = '';
  phone = '';

  loading = false;
  error = '';
  year = new Date().getFullYear();

  constructor(private auth: AuthService, private router: Router) {}

  submit(): void {
    this.error = '';
    this.loading = true;

    const body: RegisterRequest = {
      username: this.username,
      email: this.email,
      password: this.password,
      name: this.name,
      address: this.address,
      phone: this.phone,
    };

    this.auth.register(body).subscribe({
      next: () => {
        this.loading = false;
        // registro OK -> volver a login
        this.router.navigate(['/login']);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message ?? 'No se pudo crear la cuenta';
      },
    });
  }
}