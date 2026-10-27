import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { APP_NAME } from './core/models';
import { SessionStore } from './core/session';
import { settings } from './core/settings';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
})
export class App {
  private readonly router = inject(Router);
  protected readonly session = inject(SessionStore);
  protected readonly appName = APP_NAME;
  protected readonly mock = settings.useMockApi;

  protected logout() {
    this.session.end();
    this.router.navigateByUrl('/login');
  }
}
