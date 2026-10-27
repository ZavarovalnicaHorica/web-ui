import type { Claim, ReviewDecision } from '../models';
import { addDocuments, assignReview, createClaim, decideReview } from './engine';
import { POLICIES, USERS } from './mock-data';

const DAY = 86_400_000;
/**
 * ISO time n days ago. Whole days get a fixed time of day so the order inside one day is stable;
 * fractions (0.5 = 12 hours ago) are used as they are, so they never land in the future.
 */
const daysAgo = (n: number, hour = 10) => {
  const d = new Date(Date.now() - n * DAY);
  if (Number.isInteger(n)) d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};
const dateAgo = (n: number) => daysAgo(n).slice(0, 10);

type Step =
  | { do: 'assign'; day: number; manager: string; to: string; note?: string }
  | { do: 'decide'; day: number; by: string; decision: ReviewDecision; comment?: string }
  | { do: 'docs'; day: number; by: string; names: string[] };

interface SeedClaim {
  id: string;
  customer: string;
  policy: string;
  incident: number;
  submitted: number;
  amount: number;
  description: string;
  documents: string[];
  steps?: Step[];
}

/** Ordered by submission date, oldest first. */
const SEEDS: SeedClaim[] = [
  {
    id: 'CLM-2008', customer: 'c-luka', policy: 'POL-1002', incident: 70, submitted: 30, amount: 9000,
    description: 'Water in the basement after heavy rain. Floor and stored furniture damaged.',
    documents: [],
    steps: [
      { do: 'assign', day: 29, manager: 's-petra', to: 's-tomaz' },
      { do: 'decide', day: 25, by: 's-tomaz', decision: 'REJECTED', comment: 'Reported 40 days late and the damage could not be confirmed.' },
    ],
  },
  {
    id: 'CLM-2010', customer: 'c-ana', policy: 'POL-1001', incident: 31, submitted: 30, amount: 180,
    description: 'Small stone chip in the windscreen, repaired at a glass service the next day.',
    documents: ['windscreen-photo.jpg', 'glass-repair-invoice.pdf'],
  },
  {
    id: 'CLM-2007', customer: 'c-eva', policy: 'POL-1007', incident: 25, submitted: 24, amount: 650,
    description: 'Storm wind broke the living room window.',
    documents: [],
    steps: [
      { do: 'assign', day: 23, manager: 's-petra', to: 's-nina' },
      { do: 'decide', day: 22, by: 's-nina', decision: 'NEEDS_INFO', comment: 'Please add a photo of the window and the glazier’s invoice.' },
      { do: 'docs', day: 20, by: 'c-eva', names: ['window-photo.jpg', 'glazier-invoice.pdf'] },
      { do: 'decide', day: 19, by: 's-nina', decision: 'APPROVED', comment: 'Invoice matches the damage in the photo.' },
    ],
  },
  {
    id: 'CLM-2003', customer: 'c-jan', policy: 'POL-1004', incident: 12, submitted: 11, amount: 800,
    description: 'Physiotherapy sessions after a knee injury, prescribed by my doctor.',
    documents: ['physiotherapy-invoice.pdf'],
    steps: [
      { do: 'assign', day: 10, manager: 's-petra', to: 's-tomaz' },
      { do: 'decide', day: 9, by: 's-tomaz', decision: 'REJECTED', comment: 'The policy expired before the treatment started.' },
    ],
  },
  {
    // The example from the project plan (UC-6): 1.200 € with a photo and a document, above the auto-approval limit.
    id: 'CLM-2001', customer: 'c-ana', policy: 'POL-1001', incident: 6, submitted: 5, amount: 1200,
    description: 'Another driver reversed into my parked car. Rear bumper dented, we filled in the European accident statement.',
    documents: ['damage-photo-rear.jpg', 'european-accident-report.pdf'],
    steps: [{ do: 'assign', day: 4, manager: 's-petra', to: 's-marko', note: 'Check the other driver’s insurer, we may recover the cost.' }],
  },
  {
    id: 'CLM-2002', customer: 'c-luka', policy: 'POL-1002', incident: 4, submitted: 3, amount: 4200,
    description: 'Water leak in the bathroom.',
    documents: [],
    steps: [
      { do: 'assign', day: 3, manager: 's-petra', to: 's-nina' },
      { do: 'decide', day: 2, by: 's-nina', decision: 'NEEDS_INFO', comment: 'Please upload photos of the damage and the plumber’s report.' },
    ],
  },
  {
    id: 'CLM-2005', customer: 'c-ana', policy: 'POL-1001', incident: 3, submitted: 2, amount: 18000,
    description: 'Hit a deer on a regional road at night. The car is badly damaged and was towed away.',
    documents: ['damage-photo-front.jpg', 'towing-invoice.pdf'],
  },
  {
    id: 'CLM-2004', customer: 'c-eva', policy: 'POL-1003', incident: 2, submitted: 1, amount: 2900,
    description: 'Suitcase lost on the return flight. The airline confirmed it and opened a trace.',
    documents: ['property-irregularity-report.pdf'],
  },
  {
    id: 'CLM-2009', customer: 'c-ana', policy: 'POL-1006', incident: 1, submitted: 0.5, amount: 120,
    description: 'Taxi to the airport after my train was cancelled.',
    documents: [],
    steps: [{ do: 'assign', day: 0.2, manager: 's-petra', to: 's-marko' }],
  },
];

const user = (id: string) => USERS.find((u) => u.id === id)!;

export function seedClaims(): Claim[] {
  const claims: Claim[] = [];
  for (const s of SEEDS) {
    const policy = POLICIES.find((p) => p.number === s.policy)!;
    const claim = createClaim(
      s.id,
      user(s.customer),
      policy,
      { incidentDate: dateAgo(s.incident), amount: s.amount, description: s.description, documents: s.documents },
      POLICIES,
      claims,
      daysAgo(s.submitted),
    );
    claims.push(claim);
    for (const step of s.steps ?? []) {
      const at = daysAgo(step.day, 14);
      if (step.do === 'assign') assignReview(claim, user(step.manager), user(step.to), step.note ?? '', at);
      if (step.do === 'decide') decideReview(claim, user(step.by), { decision: step.decision, comment: step.comment ?? '' }, at);
      if (step.do === 'docs') addDocuments(claim, user(step.by), step.names, POLICIES, claims, at);
    }
  }
  return claims;
}
