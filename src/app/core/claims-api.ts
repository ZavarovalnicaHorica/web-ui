import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import {
  AssignInput,
  Claim,
  LoginInput,
  NewClaim,
  Organisation,
  Policy,
  ReviewInput,
  Session,
  User,
} from './models';
import { settings } from './settings';

/**
 * Everything the UI needs from the backend. Swap implementations in app.config.ts.
 * All calls except login/listOrganisations are scoped to the logged-in user's organisation.
 */
export abstract class ClaimsApi {
  abstract listOrganisations(): Observable<Organisation[]>;
  abstract login(input: LoginInput): Observable<Session>;
  abstract listUsers(): Observable<User[]>;

  abstract listClaims(): Observable<Claim[]>;
  abstract getClaim(id: string): Observable<Claim>;
  abstract submitClaim(claim: NewClaim): Observable<Claim>;
  abstract listPolicies(): Observable<Policy[]>;

  abstract assignReview(claimId: string, input: AssignInput): Observable<Claim>;
  abstract submitReview(claimId: string, input: ReviewInput): Observable<Claim>;
}

/** Talks to the real services over REST. The token is added by authInterceptor. */
@Injectable()
export class HttpClaimsApi extends ClaimsApi {
  private readonly http = inject(HttpClient);
  private readonly base = settings.apiUrl;

  listOrganisations() {
    return this.http.get<Organisation[]>(`${this.base}/organisations`);
  }

  login(input: LoginInput) {
    return this.http.post<Session>(`${this.base}/auth/login`, input);
  }

  listUsers() {
    return this.http.get<User[]>(`${this.base}/users`);
  }

  listClaims() {
    return this.http.get<Claim[]>(`${this.base}/claims`);
  }

  getClaim(id: string) {
    return this.http.get<Claim>(`${this.base}/claims/${id}`);
  }

  submitClaim(claim: NewClaim) {
    return this.http.post<Claim>(`${this.base}/claims`, claim);
  }

  listPolicies() {
    return this.http.get<Policy[]>(`${this.base}/policies`);
  }

  assignReview(claimId: string, input: AssignInput) {
    return this.http.put<Claim>(`${this.base}/reviews/${claimId}/assignment`, input);
  }

  submitReview(claimId: string, input: ReviewInput) {
    return this.http.post<Claim>(`${this.base}/reviews/${claimId}`, input);
  }
}
