import { AgentResult, Claim, ClaimStatus, NewClaim, Organisation, Policy, User } from './models';

/*
 * Fictional data for the prototype. Nothing here is a real company or person.
 * Every demo account uses DEMO_PASSWORD. The mock backend is the only place it is checked.
 */
export const DEMO_PASSWORD = 'demo1234';

export const ORGANISATIONS: Organisation[] = [
  { id: 'alfa', name: 'Zavarovalnica Alfa' },
  { id: 'beta', name: 'Zavarovalnica Beta' },
];

export const USERS: User[] = [
  { id: 'u-a1', orgId: 'alfa', username: 'petra', name: 'Petra Kos', title: 'Claims manager', role: 'MANAGER' },
  { id: 'u-a2', orgId: 'alfa', username: 'marko', name: 'Marko Vidmar', title: 'Claims handler', role: 'EMPLOYEE' },
  { id: 'u-a3', orgId: 'alfa', username: 'nina', name: 'Nina Mlakar', title: 'Senior claims handler', role: 'EMPLOYEE' },
  { id: 'u-a4', orgId: 'alfa', username: 'tomaz', name: 'Tomaž Golob', title: 'Claims handler', role: 'EMPLOYEE' },
  { id: 'u-b1', orgId: 'beta', username: 'maja', name: 'Maja Kralj', title: 'Head of claims', role: 'MANAGER' },
  { id: 'u-b2', orgId: 'beta', username: 'rok', name: 'Rok Bizjak', title: 'Claims handler', role: 'EMPLOYEE' },
  { id: 'u-b3', orgId: 'beta', username: 'sara', name: 'Sara Turk', title: 'Claims handler', role: 'EMPLOYEE' },
];

export const POLICIES: Policy[] = [
  { orgId: 'alfa', number: 'POL-1001', holder: 'Ana Novak', type: 'CAR', coverageLimit: 15000, active: true },
  { orgId: 'alfa', number: 'POL-1002', holder: 'Luka Kovač', type: 'HOME', coverageLimit: 50000, active: true },
  { orgId: 'alfa', number: 'POL-1003', holder: 'Eva Horvat', type: 'TRAVEL', coverageLimit: 3000, active: true },
  { orgId: 'alfa', number: 'POL-1004', holder: 'Jan Zupan', type: 'HEALTH', coverageLimit: 10000, active: false },
  { orgId: 'alfa', number: 'POL-1005', holder: 'Tina Petek', type: 'HOME', coverageLimit: 30000, active: true },
  { orgId: 'beta', number: 'POL-2001', holder: 'Gregor Rozman', type: 'CAR', coverageLimit: 20000, active: true },
  { orgId: 'beta', number: 'POL-2002', holder: 'Urška Žagar', type: 'HOME', coverageLimit: 40000, active: true },
  { orgId: 'beta', number: 'POL-2003', holder: 'Matej Hribar', type: 'TRAVEL', coverageLimit: 2500, active: true },
];

/**
 * Same rules the three agents in agents-service are meant to apply.
 * Risky or incomplete claims always end in NEEDS_REVIEW.
 */
export function runAgents(orgId: string, claim: NewClaim): Pick<Claim, 'status' | 'riskScore' | 'agents'> {
  const number = claim.policyNumber.trim().toUpperCase();
  const policy = POLICIES.find((p) => p.orgId === orgId && p.number === number);
  const agents: AgentResult[] = [];

  // Coverage agent
  let coverage: AgentResult;
  if (!policy) {
    coverage = { agent: 'Coverage', outcome: 'FAIL', note: 'Policy not found.' };
  } else if (!policy.active) {
    coverage = { agent: 'Coverage', outcome: 'FAIL', note: 'Policy is not active.' };
  } else if (policy.type !== claim.type) {
    coverage = { agent: 'Coverage', outcome: 'FAIL', note: `Policy does not cover ${claim.type} claims.` };
  } else if (claim.amount > policy.coverageLimit) {
    coverage = { agent: 'Coverage', outcome: 'FLAG', note: `Amount exceeds the coverage limit (${policy.coverageLimit} €).` };
  } else {
    coverage = { agent: 'Coverage', outcome: 'PASS', note: 'Claim is covered by the policy.' };
  }
  agents.push(coverage);

  // Evidence agent
  agents.push(
    claim.documents.length === 0
      ? { agent: 'Evidence', outcome: 'FLAG', note: 'No documents attached.' }
      : { agent: 'Evidence', outcome: 'PASS', note: `${claim.documents.length} document(s) received.` },
  );

  // Risk score (risk-service)
  const limit = policy?.coverageLimit ?? 10000;
  const daysSinceIncident = (Date.now() - new Date(claim.incidentDate).getTime()) / 86_400_000;
  let risk = 10;
  risk += Math.min(40, Math.round((claim.amount / limit) * 40));
  if (claim.documents.length === 0) risk += 25;
  if (daysSinceIncident > 30) risk += 15;
  if (claim.description.trim().length < 30) risk += 10;
  const riskScore = Math.max(0, Math.min(100, risk));

  // Decision agent
  let status: ClaimStatus;
  if (coverage.outcome === 'FAIL') {
    status = 'REJECTED';
    agents.push({ agent: 'Decision', outcome: 'FAIL', note: 'Rejected: not covered.' });
  } else if (agents.some((a) => a.outcome === 'FLAG') || riskScore >= 60) {
    status = 'NEEDS_REVIEW';
    agents.push({ agent: 'Decision', outcome: 'FLAG', note: `Sent to a human reviewer (risk ${riskScore}).` });
  } else {
    status = 'APPROVED';
    agents.push({ agent: 'Decision', outcome: 'PASS', note: 'Approved automatically.' });
  }

  return { status, riskScore, agents };
}

const DAY = 86_400_000;
const daysAgo = (d: number) => new Date(Date.now() - d * DAY).toISOString();
const dateOnly = (d: number) => daysAgo(d).slice(0, 10);

interface SeedExtras {
  createdById: string;
  createdDaysAgo: number;
  /** [assigneeId, managerId, daysAgo, note] */
  assigned?: [string, string, number, string];
  /** [reviewerId, decision, daysAgo, comment] */
  reviewed?: [string, 'APPROVED' | 'REJECTED', number, string];
}

function seed(id: string, orgId: string, input: NewClaim, x: SeedExtras): Claim {
  const claim: Claim = {
    id,
    orgId,
    ...input,
    ...runAgents(orgId, input),
    createdAt: daysAgo(x.createdDaysAgo),
    createdById: x.createdById,
  };
  if (x.assigned) {
    const [assigneeId, assignedById, d, note] = x.assigned;
    claim.assignment = { assigneeId, assignedById, assignedAt: daysAgo(d), note };
  }
  if (x.reviewed) {
    const [reviewerId, decision, d, comment] = x.reviewed;
    const reviewer = USERS.find((u) => u.id === reviewerId)!;
    claim.status = decision;
    claim.review = { decision, reviewerId, reviewerName: reviewer.name, comment, decidedAt: daysAgo(d) };
  }
  return claim;
}

export function seedClaims(): Claim[] {
  return [
    // Zavarovalnica Alfa
    seed('CLM-2001', 'alfa', {
      policyNumber: 'POL-1001', claimant: 'Ana Novak', type: 'CAR', incidentDate: dateOnly(14), amount: 1200,
      description: 'Rear bumper damaged in a parking lot, other driver identified.',
      documents: ['photo-bumper.jpg', 'police-report.pdf'],
    }, { createdById: 'u-a2', createdDaysAgo: 13 }),
    seed('CLM-2002', 'alfa', {
      policyNumber: 'POL-1002', claimant: 'Luka Kovač', type: 'HOME', incidentDate: dateOnly(4), amount: 42000,
      description: 'Water leak', documents: [],
    }, { createdById: 'u-a3', createdDaysAgo: 3, assigned: ['u-a2', 'u-a1', 2, 'Large amount, call the client first.'] }),
    seed('CLM-2003', 'alfa', {
      policyNumber: 'POL-1004', claimant: 'Jan Zupan', type: 'HEALTH', incidentDate: dateOnly(12), amount: 800,
      description: 'Physiotherapy sessions after a knee injury.', documents: ['invoice.pdf'],
    }, { createdById: 'u-a4', createdDaysAgo: 11 }),
    seed('CLM-2004', 'alfa', {
      policyNumber: 'POL-1003', claimant: 'Eva Horvat', type: 'TRAVEL', incidentDate: dateOnly(2), amount: 2900,
      description: 'Lost luggage on a return flight, airline confirmed the loss.', documents: ['airline-confirmation.pdf'],
    }, { createdById: 'u-a2', createdDaysAgo: 1 }),
    seed('CLM-2005', 'alfa', {
      policyNumber: 'POL-1001', claimant: 'Ana Novak', type: 'CAR', incidentDate: dateOnly(3), amount: 18000,
      description: 'Car written off after hitting a deer on a regional road.', documents: ['photos.zip', 'tow-receipt.pdf'],
    }, { createdById: 'u-a3', createdDaysAgo: 2 }),
    seed('CLM-2006', 'alfa', {
      policyNumber: 'POL-1005', claimant: 'Tina Petek', type: 'HOME', incidentDate: dateOnly(6), amount: 3000,
      description: 'Storm damaged part of the roof and a skylight.', documents: [],
    }, { createdById: 'u-a2', createdDaysAgo: 5, assigned: ['u-a3', 'u-a1', 4, ''] }),
    seed('CLM-2007', 'alfa', {
      policyNumber: 'POL-1001', claimant: 'Ana Novak', type: 'CAR', incidentDate: dateOnly(20), amount: 4000,
      description: 'Scratched door', documents: [],
    }, {
      createdById: 'u-a4', createdDaysAgo: 19,
      assigned: ['u-a3', 'u-a1', 18, 'Check against CLM-2001.'],
      reviewed: ['u-a3', 'APPROVED', 16, 'Photos received by email, damage confirmed.'],
    }),
    seed('CLM-2008', 'alfa', {
      policyNumber: 'POL-1003', claimant: 'Eva Horvat', type: 'TRAVEL', incidentDate: dateOnly(1), amount: 2500,
      description: 'Missed connection, hotel and new ticket.', documents: [],
    }, { createdById: 'u-a2', createdDaysAgo: 0.5 }),
    seed('CLM-2009', 'alfa', {
      policyNumber: 'POL-1002', claimant: 'Luka Kovač', type: 'HOME', incidentDate: dateOnly(50), amount: 9000,
      description: 'Basement flooding reported late.', documents: [],
    }, {
      createdById: 'u-a3', createdDaysAgo: 30,
      assigned: ['u-a4', 'u-a1', 29, ''],
      reviewed: ['u-a4', 'REJECTED', 25, 'Damage existed before the policy start date.'],
    }),

    // Zavarovalnica Beta
    seed('CLM-3001', 'beta', {
      policyNumber: 'POL-2001', claimant: 'Gregor Rozman', type: 'CAR', incidentDate: dateOnly(5), amount: 900,
      description: 'Windscreen cracked by a stone on the motorway.', documents: ['photo.jpg'],
    }, { createdById: 'u-b2', createdDaysAgo: 4 }),
    seed('CLM-3002', 'beta', {
      policyNumber: 'POL-2002', claimant: 'Urška Žagar', type: 'HOME', incidentDate: dateOnly(3), amount: 6000,
      description: 'Burst pipe in the kitchen.', documents: [],
    }, { createdById: 'u-b3', createdDaysAgo: 2, assigned: ['u-b2', 'u-b1', 1, ''] }),
    seed('CLM-3003', 'beta', {
      policyNumber: 'POL-2003', claimant: 'Matej Hribar', type: 'TRAVEL', incidentDate: dateOnly(2), amount: 2400,
      description: 'Medical costs abroad.', documents: [],
    }, { createdById: 'u-b2', createdDaysAgo: 1 }),
    seed('CLM-3004', 'beta', {
      policyNumber: 'POL-2002', claimant: 'Urška Žagar', type: 'HOME', incidentDate: dateOnly(15), amount: 1500,
      description: 'Broken window', documents: [],
    }, {
      createdById: 'u-b3', createdDaysAgo: 14,
      assigned: ['u-b3', 'u-b1', 13, ''],
      reviewed: ['u-b3', 'APPROVED', 12, 'Invoice from glazier checked.'],
    }),
  ];
}
