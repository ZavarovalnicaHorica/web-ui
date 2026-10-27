import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { routes } from './app.routes';
import { ClaimsApi, HttpClaimsApi } from './core/claims-api';
import { authInterceptor } from './core/guards';
import { MockClaimsApi } from './core/mock-claims-api';
import { settings } from './core/settings';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: ClaimsApi, useClass: settings.useMockApi ? MockClaimsApi : HttpClaimsApi },
  ],
};
