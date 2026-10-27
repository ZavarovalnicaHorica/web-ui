import type { Policy, User } from '../models';

/*
 * Fictional data for the prototype. Nobody here is a real person.
 * Every demo account uses DEMO_PASSWORD. Only the mock backend checks it;
 * the real system signs in through Keycloak.
 */
export const DEMO_PASSWORD = 'demo1234';

export const USERS: User[] = [
  // Customers
  { id: 'c-ana', username: 'ana', name: 'Ana Novak', role: 'CUSTOMER' },
  { id: 'c-luka', username: 'luka', name: 'Luka Kovač', role: 'CUSTOMER' },
  { id: 'c-eva', username: 'eva', name: 'Eva Horvat', role: 'CUSTOMER' },
  { id: 'c-jan', username: 'jan', name: 'Jan Zupan', role: 'CUSTOMER' },
  // Staff
  { id: 's-petra', username: 'petra', name: 'Petra Kos', role: 'MANAGER', title: 'Head of claims' },
  { id: 's-marko', username: 'marko', name: 'Marko Vidmar', role: 'EMPLOYEE', title: 'Claims handler' },
  { id: 's-nina', username: 'nina', name: 'Nina Mlakar', role: 'EMPLOYEE', title: 'Senior claims handler' },
  { id: 's-tomaz', username: 'tomaz', name: 'Tomaž Golob', role: 'EMPLOYEE', title: 'Claims handler' },
];

const DAY = 86_400_000;
const dateFromToday = (days: number) => new Date(Date.now() + days * DAY).toISOString().slice(0, 10);

export const POLICIES: Policy[] = [
  {
    number: 'POL-1001', holderId: 'c-ana', holderName: 'Ana Novak', type: 'CAR',
    product: 'Car comprehensive (kasko)',
    coverage: ['Collision and parking damage', 'Glass breakage', 'Collision with animals', 'Theft', 'Storm and hail'],
    limit: 15000, deductible: 150, validFrom: dateFromToday(-200), validTo: dateFromToday(165),
  },
  {
    number: 'POL-1006', holderId: 'c-ana', holderName: 'Ana Novak', type: 'TRAVEL',
    product: 'Travel insurance',
    coverage: ['Medical costs abroad', 'Lost or delayed luggage', 'Trip cancellation'],
    limit: 3000, deductible: 0, validFrom: dateFromToday(-60), validTo: dateFromToday(305),
  },
  {
    number: 'POL-1002', holderId: 'c-luka', holderName: 'Luka Kovač', type: 'HOME',
    product: 'Home insurance',
    coverage: ['Fire', 'Water leaks', 'Storm and hail', 'Burglary'],
    limit: 50000, deductible: 200, validFrom: dateFromToday(-300), validTo: dateFromToday(65),
  },
  {
    number: 'POL-1003', holderId: 'c-eva', holderName: 'Eva Horvat', type: 'TRAVEL',
    product: 'Travel insurance',
    coverage: ['Medical costs abroad', 'Lost or delayed luggage', 'Trip cancellation'],
    limit: 3000, deductible: 0, validFrom: dateFromToday(-30), validTo: dateFromToday(335),
  },
  {
    number: 'POL-1007', holderId: 'c-eva', holderName: 'Eva Horvat', type: 'HOME',
    product: 'Home insurance',
    coverage: ['Fire', 'Water leaks', 'Storm and hail', 'Glass breakage'],
    limit: 30000, deductible: 100, validFrom: dateFromToday(-120), validTo: dateFromToday(245),
  },
  {
    number: 'POL-1004', holderId: 'c-jan', holderName: 'Jan Zupan', type: 'HEALTH',
    product: 'Supplementary health insurance',
    coverage: ['Physiotherapy', 'Specialist visits'],
    limit: 10000, deductible: 0, validFrom: dateFromToday(-385), validTo: dateFromToday(-20),
  },
];
