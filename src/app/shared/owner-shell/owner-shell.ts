import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-owner-shell',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './owner-shell.html',
  styleUrl: './owner-shell.scss',
})
export class OwnerShell {
  @Input() section: 'dogs' | 'vets' | 'profile' = 'dogs';

  constructor(private router: Router) {}

  logout(): void {
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}
