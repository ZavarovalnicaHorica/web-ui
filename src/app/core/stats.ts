import { Claim, User } from './models';

export const needsReview = (c: Claim) => c.status === 'NEEDS_REVIEW';

/** Open reviews assigned to this user. */
export const openReviewsOf = (claims: Claim[], userId: string) =>
  claims.filter((c) => needsReview(c) && c.assignment?.assigneeId === userId);

/** Reviews this user has finished. */
export const completedReviewsOf = (claims: Claim[], userId: string) =>
  claims.filter((c) => c.review?.reviewerId === userId);

export interface Workload {
  user: User;
  open: number;
  completed: number;
  approved: number;
  rejected: number;
}

export function workload(claims: Claim[], users: User[]): Workload[] {
  return users.map((user) => {
    const done = completedReviewsOf(claims, user.id);
    return {
      user,
      open: openReviewsOf(claims, user.id).length,
      completed: done.length,
      approved: done.filter((c) => c.review?.decision === 'APPROVED').length,
      rejected: done.filter((c) => c.review?.decision === 'REJECTED').length,
    };
  });
}

export function claimTotals(claims: Claim[]) {
  const review = claims.filter(needsReview);
  return {
    total: claims.length,
    needsReview: review.length,
    unassigned: review.filter((c) => !c.assignment).length,
    approved: claims.filter((c) => c.status === 'APPROVED').length,
    rejected: claims.filter((c) => c.status === 'REJECTED').length,
    autoDecided: claims.filter((c) => c.status !== 'NEEDS_REVIEW' && !c.review).length,
  };
}

/** "Marko Vidmar" for an id, or a fallback. */
export function nameOf(users: User[] | undefined, id: string | undefined, fallback = '–') {
  return users?.find((u) => u.id === id)?.name ?? fallback;
}
