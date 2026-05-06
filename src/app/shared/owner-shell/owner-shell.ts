import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SessionService } from '../../services/session';

@Component({
  selector: 'app-owner-shell',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './owner-shell.html',
  styleUrl: './owner-shell.scss',
})
export class OwnerShell {
  @Input() section: 'dogs' | 'vets' | 'profile' = 'dogs';

  constructor(
    private router: Router,
    private session: SessionService
  ) {}

  logout(): void {
    this.session.clear();
    this.router.navigate(['/login']);
  }
}
