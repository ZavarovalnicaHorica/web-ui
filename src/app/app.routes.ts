import { Routes } from '@angular/router';
import { authGuard, guestGuard, homeRedirect, managerGuard } from './core/guards';
import { ClaimDetail } from './pages/claim-detail';
import { ClaimNew } from './pages/claim-new';
import { ClaimsList } from './pages/claims-list';
import { Dashboard } from './pages/dashboard';
import { EmployeeDetail } from './pages/employee-detail';
import { Login } from './pages/login';
import { MyReviews } from './pages/my-reviews';
import { Team } from './pages/team';

export const routes: Routes = [
  { path: 'login', component: Login, canActivate: [guestGuard], title: 'Sign in · ClaimDesk' },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: homeRedirect },
      { path: 'reviews', component: MyReviews, title: 'My reviews · ClaimDesk' },
      { path: 'claims', component: ClaimsList, title: 'Claims · ClaimDesk' },
      { path: 'claims/new', component: ClaimNew, title: 'New claim · ClaimDesk' },
      { path: 'claims/:id', component: ClaimDetail, title: 'Claim · ClaimDesk' },
      {
        path: '',
        canActivate: [managerGuard],
        children: [
          { path: 'dashboard', component: Dashboard, title: 'Dashboard · ClaimDesk' },
          { path: 'team', component: Team, title: 'Team · ClaimDesk' },
          { path: 'team/:id', component: EmployeeDetail, title: 'Employee · ClaimDesk' },
        ],
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
