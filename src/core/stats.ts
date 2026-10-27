import type { Claim, User } from './models';

export const needsReview = (c: Claim) => c.status === 'NEEDS_REVIEW';
const isOpen = (c: Claim) => c.status === 'NEEDS_REVIEW' || c.status === 'NEEDS_INFO';

/** Open reviews assigned to this employee (waiting on them or on the customer). */
export const openReviewsOf = (claims: Claim[], userId: string) =>
  claims.filter((c) => isOpen(c) && c.assignment?.assigneeId === userId);

/** Claims this employee made the final decision on. */
export const decidedBy = (claims: Claim[], userId: string) =>
  claims.filter(
    (c) => (c.status === 'APPROVED' || c.status === 'REJECTED') && c.review?.reviewerId === userId,
  );

export interface Workload {
  user: User;
  open: number;
  approved: number;
  rejected: number;
}

export function workload(claims: Claim[], users: User[]): Workload[] {
  return users.map((user) => {
    const done = decidedBy(claims, user.id);
    return {
      user,
      open: openReviewsOf(claims, user.id).length,
      approved: done.filter((c) => c.status === 'APPROVED').length,
      rejected: done.filter((c) => c.status === 'REJECTED').length,
    };
  });
}

export function claimTotals(claims: Claim[]) {
  const review = claims.filter(needsReview);
  return {
    total: claims.length,
    inReview: review.length,
    unassigned: review.filter((c) => !c.assignment).length,
    waitingForCustomer: claims.filter((c) => c.status === 'NEEDS_INFO').length,
    approved: claims.filter((c) => c.status === 'APPROVED').length,
    rejected: claims.filter((c) => c.status === 'REJECTED').length,
    autoApproved: claims.filter((c) => c.status === 'APPROVED' && c.recommendation.automatic && !c.review).length,
  };
}

export function nameOf(users: User[] | undefined, id: string | undefined, fallback = '–') {
  return users?.find((u) => u.id === id)?.name ?? fallback;
}
