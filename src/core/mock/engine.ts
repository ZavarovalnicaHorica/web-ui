import {
  AUTO_APPROVE,
  type AgentStep,
  type Claim,
  type HistoryEvent,
  type Policy,
  type Recommendation,
  type ReviewInput,
  type RiskAssessment,
  type User,
} from '../models';

/*
 * What the backend services do with a claim, simulated in the browser.
 * The comments name the service that would do each step in the real system.
 */

const DAY = 86_400_000;
const eur = (n: number) => `${n.toLocaleString('sl-SI')} €`;

function log(claim: Claim, at: string, event: string, actor: string, text: string) {
  const entry: HistoryEvent = { at, event, actor, text };
  claim.history.push(entry);
}

interface Evaluation {
  agents: AgentStep[];
  risk: RiskAssessment;
  recommendation: Recommendation;
}

/** AgentService (two agents) + RiskService. */
export function evaluate(claim: Claim, policies: Policy[], allClaims: Claim[]): Evaluation {
  const policy = policies.find((p) => p.number === claim.policyNumber);
  const docs = claim.documents.length;

  // Agent 1: collects the claim, policy and documents through the services' APIs.
  let data: AgentStep;
  if (!policy) {
    data = { agent: 'Data agent', outcome: 'FAIL', note: `Policy ${claim.policyNumber} not found.` };
  } else if (policy.holderId !== claim.customerId) {
    data = { agent: 'Data agent', outcome: 'FAIL', note: 'Policy belongs to another customer.' };
  } else if (claim.incidentDate < policy.validFrom || claim.incidentDate > policy.validTo) {
    data = { agent: 'Data agent', outcome: 'FAIL', note: 'Policy was not valid on the incident date.' };
  } else if (policy.type !== claim.type) {
    data = { agent: 'Data agent', outcome: 'FAIL', note: 'Policy does not cover this type of claim.' };
  } else if (docs === 0) {
    data = { agent: 'Data agent', outcome: 'FLAG', note: `Policy ${policy.number} is valid. No documents yet.` };
  } else {
    data = {
      agent: 'Data agent',
      outcome: 'PASS',
      note: `Policy ${policy.number} (${policy.product}) is valid. ${docs} document(s) collected.`,
    };
  }

  // RiskService: fixed business rules, separate from the language model so results can be checked.
  const reasons: string[] = [];
  let score = 0.05;
  if (data.outcome === 'FAIL') {
    score += 0.4;
    reasons.push('Policy does not cover the claim');
  }
  if (policy && claim.amount > policy.limit) {
    score += 0.3;
    reasons.push(`Amount is above the policy limit (${eur(policy.limit)})`);
  } else if (policy) {
    const ratio = claim.amount / policy.limit;
    score += Math.min(0.25, ratio * 0.5);
    if (ratio >= 0.2) reasons.push(`Amount is ${Math.round(ratio * 100)} % of the policy limit`);
  }
  if (docs === 0) {
    score += 0.25;
    reasons.push('No supporting documents');
  }
  const daysLate = Math.floor((Date.parse(claim.createdAt) - Date.parse(claim.incidentDate)) / DAY);
  if (daysLate > 30) {
    score += 0.15;
    reasons.push(`Reported ${daysLate} days after the incident`);
  }
  if (claim.description.trim().length < 30) {
    score += 0.05;
    reasons.push('Very short description');
  }
  const recent = allClaims.some(
    (c) =>
      c.id !== claim.id &&
      c.policyNumber === claim.policyNumber &&
      c.createdAt < claim.createdAt &&
      Date.parse(claim.createdAt) - Date.parse(c.createdAt) < 90 * DAY,
  );
  if (recent) {
    score += 0.1;
    reasons.push('Another claim on this policy in the last 90 days');
  }
  const risk = { score: Math.round(Math.min(1, score) * 100) / 100, reasons };

  // Agent 2: summary and proposal. It never approves a risky claim and never rejects on its own.
  let recommendation: Recommendation;
  if (data.outcome === 'FAIL') {
    recommendation = {
      action: 'REJECT',
      automatic: false,
      summary: `Proposes rejection: ${data.note} An employee must confirm.`,
    };
  } else if (docs > 0 && claim.amount <= AUTO_APPROVE.maxAmount && risk.score <= AUTO_APPROVE.maxRisk) {
    recommendation = { action: 'APPROVE', automatic: true, summary: 'All conditions met. Approved automatically.' };
  } else {
    const why: string[] = [];
    if (claim.amount > AUTO_APPROVE.maxAmount) why.push(`amount is above ${eur(AUTO_APPROVE.maxAmount)}`);
    if (risk.score > AUTO_APPROVE.maxRisk) why.push(`risk ${risk.score.toFixed(2)} is above ${AUTO_APPROVE.maxRisk.toFixed(2)}`);
    if (docs === 0) why.push('documents are missing');
    recommendation = {
      action: 'REVIEW',
      automatic: false,
      summary: `Needs an employee: ${why.join(', ')}.`,
    };
  }

  const recStep: AgentStep = {
    agent: 'Recommendation agent',
    outcome: recommendation.action === 'APPROVE' ? 'PASS' : recommendation.action === 'REJECT' ? 'FAIL' : 'FLAG',
    note: recommendation.summary,
  };

  return { agents: [data, recStep], risk, recommendation };
}

/** Runs the agents and moves the claim on (ClaimsService decides the final state). */
export function processClaim(claim: Claim, policies: Policy[], allClaims: Claim[], at: string) {
  const result = evaluate(claim, policies, allClaims);
  claim.agents = result.agents;
  claim.risk = result.risk;
  claim.recommendation = result.recommendation;

  log(claim, at, 'agent.data-collected', 'AgentService', result.agents[0].note);
  log(claim, at, 'risk.assessed', 'RiskService', `Risk score ${result.risk.score.toFixed(2)}.`);
  log(claim, at, 'claim.recommendation.created.v1', 'AgentService', result.recommendation.summary);

  if (result.recommendation.automatic) {
    claim.status = 'APPROVED';
    log(claim, at, 'claim.status.changed', 'ClaimsService', 'Approved automatically.');
  } else {
    claim.status = 'NEEDS_REVIEW';
    log(claim, at, 'review.requested.v1', 'ClaimsService', 'Sent to an employee for review.');
  }
}

export function createClaim(
  id: string,
  customer: User,
  policy: Policy,
  input: { incidentDate: string; amount: number; description: string; documents: string[] },
  policies: Policy[],
  allClaims: Claim[],
  at: string,
): Claim {
  const claim: Claim = {
    id,
    policyNumber: policy.number,
    customerId: customer.id,
    claimant: customer.name,
    type: policy.type,
    incidentDate: input.incidentDate,
    amount: input.amount,
    description: input.description,
    documents: input.documents.map((name) => ({ name, uploadedAt: at, uploadedById: customer.id })),
    status: 'SUBMITTED',
    risk: { score: 0, reasons: [] },
    agents: [],
    recommendation: { action: 'REVIEW', automatic: false, summary: '' },
    createdAt: at,
    history: [],
  };
  log(claim, at, 'claim.submitted.v1', customer.name, `Claim submitted for ${eur(input.amount)}.`);
  if (input.documents.length) {
    log(claim, at, 'document.added.v1', customer.name, `Added: ${input.documents.join(', ')}.`);
  }
  processClaim(claim, policies, [...allClaims, claim], at);
  return claim;
}

/** DocumentService. New documents on a claim that waits for them trigger a new check (UC-7). */
export function addDocuments(
  claim: Claim,
  user: User,
  names: string[],
  policies: Policy[],
  allClaims: Claim[],
  at: string,
) {
  claim.documents.push(...names.map((name) => ({ name, uploadedAt: at, uploadedById: user.id })));
  log(claim, at, 'document.added.v1', user.name, `Added: ${names.join(', ')}.`);
  if (claim.status === 'NEEDS_INFO') {
    log(claim, at, 'claim.reanalysis.started', 'ClaimsService', 'New documents received. Checking the claim again.');
    processClaim(claim, policies, allClaims, at);
  }
}

/** ReviewService: a manager gives the review to an employee. */
export function assignReview(claim: Claim, manager: User, assignee: User, note: string, at: string) {
  claim.assignment = { assigneeId: assignee.id, assignedById: manager.id, assignedAt: at, note };
  log(claim, at, 'review.assigned', manager.name, `Assigned to ${assignee.name}.${note ? ` Note: ${note}` : ''}`);
}

/** ReviewService: the employee approves, rejects or asks the customer for more. */
export function decideReview(claim: Claim, reviewer: User, input: ReviewInput, at: string) {
  claim.review = { ...input, reviewerId: reviewer.id, reviewerName: reviewer.name, decidedAt: at };
  const comment = input.comment ? ` ${input.comment}` : '';
  if (input.decision === 'NEEDS_INFO') {
    claim.status = 'NEEDS_INFO';
    log(claim, at, 'review.completed.v1', reviewer.name, `Asked the customer for more documents.${comment}`);
  } else {
    claim.status = input.decision;
    const word = input.decision === 'APPROVED' ? 'Approved' : 'Rejected';
    log(claim, at, 'review.completed.v1', reviewer.name, `${word}.${comment}`);
    log(claim, at, 'claim.status.changed', 'ClaimsService', `Final status: ${word.toLowerCase()}.`);
  }
}
