export interface ThinkTank {
  name: string;
  foreignGov: number;
  pentagonContractor: number;
  usGov: number;
  transparencyScore: number;
  totalFunding: number;
  isDarkMoney: boolean;
  ideology: Ideology;
  foundingYear: number;
}

export type Ideology = 'Left' | 'Center-Left' | 'Center' | 'Center-Right' | 'Right';

export interface Donor {
  name: string;
  minAmount: number;
  type: DonorType;
}

export type DonorType = 'Foreign Government' | 'Pentagon Contractor' | 'U.S. Government';

export interface Transaction {
  id: number;
  specificDonor: string;
  parentOrg: string;
  recipientThinkTank: string;
  year: number;
  donorType: DonorType;
  exactAmount: number;
  minDonation: number;
  maxDonation: number;
  minPlusExact: number;
  source: string;
}

export interface RevolvingDoorEntry {
  person: string;
  thinkTank: string;
  govPosition: string;
  govAgency: string;
  direction: 'gov-to-tank' | 'tank-to-gov' | 'both';
}

export interface SankeyNode {
  id: string;
  type: 'donor' | 'tank';
  donorType?: DonorType;
}

export interface SankeyLink {
  source: string;
  target: string;
  value: number;
  donorType: DonorType;
}
