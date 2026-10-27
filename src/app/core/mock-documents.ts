import { Claim } from './models';

/*
 * Fictional sample documents for the seeded claims, shown by the document viewer in mock mode.
 * Every company, person, plate and reference number here is made up.
 * In the real system these would be PDFs and photos stored by documents-service.
 */

export type PhotoScene = 'rear-bumper' | 'front' | 'windscreen';

export interface DocLine {
  item: string;
  qty: number;
  unit: string;
  unitPrice: number;
}

export interface DocSection {
  heading: string;
  rows?: [string, string][];
  text?: string;
}

export interface MockDocument {
  kind: 'PHOTO' | 'FORM' | 'INVOICE';
  title: string;
  /** Who issued it, one line each. */
  issuer: string[];
  fields: [string, string][];
  sections?: DocSection[];
  lines?: DocLine[];
  linesHeading?: string;
  /** VAT as a fraction, e.g. 0.22. Leave out when the lines already include tax or are exempt. */
  vatRate?: number;
  note?: string;
  photo?: { scene: PhotoScene; caption: string };
  signatures?: string[];
}

/** "2026-10-13" + 2 days → "15. 10. 2026" (Slovenian date style). */
function day(isoDate: string, plusDays = 0): string {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + plusDays);
  return `${d.getDate()}. ${d.getMonth() + 1}. ${d.getFullYear()}`;
}

type Builder = (claim: Claim) => MockDocument;

const DOCUMENTS: Record<string, Builder> = {
  // CLM-2001: car hit while parked. Both drivers fill in a European accident report on the spot.
  'CLM-2001/european-accident-report.pdf': (c) => ({
    kind: 'FORM',
    title: 'European Accident Statement',
    issuer: ['Standard form used across Europe', 'Filled in and signed by both drivers at the scene'],
    fields: [
      ['Date of accident', day(c.incidentDate)],
      ['Time', '17:40'],
      ['Location', 'Car park of a shopping centre, Ljubljana'],
      ['Injuries', 'No'],
      ['Damage to other property', 'No'],
      ['Witnesses', 'None'],
    ],
    sections: [
      {
        heading: 'Vehicle A (our policyholder)',
        rows: [
          ['Driver', c.claimant],
          ['Vehicle', 'Passenger car, grey hatchback'],
          ['Registration', 'LJ 41-KTX'],
          ['Insurer', 'Zavarovalnica Alfa'],
          ['Policy number', c.policyNumber],
          ['Circumstance', 'Box 1: parked / stationary'],
          ['Visible damage', 'Rear bumper dented and scratched, left rear light cracked'],
        ],
      },
      {
        heading: 'Vehicle B (other driver)',
        rows: [
          ['Driver', 'Boris Kranjc'],
          ['Vehicle', 'Passenger car, white estate'],
          ['Registration', 'KR 77-PLD'],
          ['Insurer', 'Zavarovalnica Gama'],
          ['Policy number', 'GAM-558214'],
          ['Circumstance', 'Box 15: reversing'],
          ['Visible damage', 'Rear right corner scratched'],
        ],
      },
      {
        heading: 'Sketch description',
        text: 'Vehicle A parked in a marked bay. Vehicle B reversed out of the bay opposite and hit the rear of vehicle A at low speed.',
      },
    ],
    signatures: [`Driver A: ${c.claimant}`, 'Driver B: Boris Kranjc'],
  }),

  'CLM-2001/damage-photo-rear.jpg': (c) => ({
    kind: 'PHOTO',
    title: 'Damage photo',
    issuer: ['Uploaded by the policyholder'],
    fields: [
      ['Taken', `${day(c.incidentDate)}, 17:52`],
      ['Device', 'Phone camera'],
      ['Location', '46.05° N, 14.51° E (approx.)'],
      ['Size', '4032 × 3024'],
    ],
    photo: { scene: 'rear-bumper', caption: 'Rear bumper, dent and scratches on the left side' },
  }),

  // CLM-2003: health claim with a physiotherapy invoice (policy is inactive, so the agents reject it).
  'CLM-2003/physiotherapy-invoice.pdf': (c) => ({
    kind: 'INVOICE',
    title: 'Invoice 2026-0418',
    issuer: ['Fizioterapija Gibko d.o.o.', 'Trubarjeva cesta 10, 1000 Ljubljana', 'VAT ID: SI00000000 (fictional)'],
    fields: [
      ['Invoice date', day(c.incidentDate, 9)],
      ['Patient', c.claimant],
      ['Referral', 'Knee injury, 8 sessions prescribed'],
      ['Treatment period', `${day(c.incidentDate, 1)} – ${day(c.incidentDate, 8)}`],
      ['Payment', 'Paid by card'],
    ],
    linesHeading: 'Services',
    lines: [
      { item: 'Initial physiotherapy assessment', qty: 1, unit: 'visit', unitPrice: 60 },
      { item: 'Physiotherapy session, 45 min', qty: 8, unit: 'session', unitPrice: 80 },
      { item: 'Kinesio taping', qty: 2, unit: 'application', unitPrice: 50 },
    ],
    note: 'Health service, no VAT charged.',
  }),

  // CLM-2004: lost luggage. Airlines issue a Property Irregularity Report (PIR) at the airport.
  'CLM-2004/property-irregularity-report.pdf': (c) => ({
    kind: 'FORM',
    title: 'Property Irregularity Report (PIR)',
    issuer: ['Adria Sky Airlines (fictional)', 'Baggage services, Ljubljana Airport'],
    fields: [
      ['File reference', 'LJUAS48217'],
      ['Date reported', day(c.incidentDate)],
      ['Passenger', c.claimant],
      ['Flight', 'AS 482, Barcelona (BCN) → Ljubljana (LJU)'],
      ['Bag tag', 'AS 512 345'],
      ['Status', 'Not found, trace in progress'],
    ],
    sections: [
      {
        heading: 'Bag description',
        rows: [
          ['Type', 'Hard-shell suitcase, 70 cm'],
          ['Colour', 'Black'],
          ['Brand', 'Unknown'],
          ['Marks', 'Red ribbon on handle'],
        ],
      },
    ],
    linesHeading: 'Contents declared by the passenger',
    lines: [
      { item: 'Suitcase', qty: 1, unit: 'pc', unitPrice: 180 },
      { item: 'Clothing', qty: 1, unit: 'lot', unitPrice: 1450 },
      { item: 'Shoes', qty: 2, unit: 'pair', unitPrice: 160 },
      { item: 'Toiletries', qty: 1, unit: 'lot', unitPrice: 150 },
      { item: 'Laptop charger and headphones', qty: 1, unit: 'lot', unitPrice: 600 },
      { item: 'Gifts', qty: 1, unit: 'lot', unitPrice: 200 },
    ],
    note: 'Values are the passenger’s own estimate. Receipts may be requested.',
    signatures: [`Passenger: ${c.claimant}`, 'Agent: M. Lenarčič'],
  }),

  // CLM-2005: car written off after hitting a deer. Amount is above the policy limit, so it needs review.
  'CLM-2005/damage-photo-front.jpg': (c) => ({
    kind: 'PHOTO',
    title: 'Damage photo',
    issuer: ['Uploaded by the policyholder'],
    fields: [
      ['Taken', `${day(c.incidentDate)}, 21:15`],
      ['Device', 'Phone camera'],
      ['Location', '46.24° N, 14.36° E (approx.)'],
      ['Size', '4032 × 3024'],
    ],
    photo: { scene: 'front', caption: 'Front of the car after hitting a deer, bonnet and grille crushed' },
  }),

  'CLM-2005/towing-invoice.pdf': (c) => ({
    kind: 'INVOICE',
    title: 'Invoice 112/2026',
    issuer: ['Vlečna služba Hitri Kavelj s.p.', 'Kranjska cesta 5, 4000 Kranj', 'VAT ID: SI11111111 (fictional)'],
    fields: [
      ['Invoice date', day(c.incidentDate, 1)],
      ['Customer', c.claimant],
      ['Vehicle', 'LJ 41-KTX'],
      ['Service', 'Towing from the accident site to a repair shop'],
    ],
    linesHeading: 'Services',
    lines: [
      { item: 'Call-out, night rate', qty: 1, unit: 'call', unitPrice: 60 },
      { item: 'Towing', qty: 42, unit: 'km', unitPrice: 1.8 },
      { item: 'Storage', qty: 3, unit: 'day', unitPrice: 15 },
    ],
    vatRate: 0.22,
  }),

  // CLM-3001 (Zavarovalnica Beta): windscreen hit by a stone.
  'CLM-3001/windscreen-photo.jpg': (c) => ({
    kind: 'PHOTO',
    title: 'Damage photo',
    issuer: ['Uploaded by the policyholder'],
    fields: [
      ['Taken', `${day(c.incidentDate)}, 08:05`],
      ['Device', 'Phone camera'],
      ['Size', '3024 × 4032'],
    ],
    photo: { scene: 'windscreen', caption: 'Crack across the windscreen, starting at the stone chip' },
  }),
};

/** The fictional content of a claim's document, or null if there is none (e.g. names from the new-claim form). */
export function mockDocument(claim: Claim, name: string): MockDocument | null {
  return DOCUMENTS[`${claim.id}/${name}`]?.(claim) ?? null;
}
