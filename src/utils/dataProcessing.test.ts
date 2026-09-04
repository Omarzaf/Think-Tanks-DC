import { describe, expect, it } from 'vitest';
import { parseThinkTanks } from '../data/thinkTanks';
import type { Transaction } from '../data/types';
import { transactions } from '../data/transactions';
import { getChordData, getSankeyData, getTimelineData } from './dataProcessing';

describe('data processing helpers', () => {
  it('builds sankey nodes and links from positive-value transactions only', () => {
    const sample: Transaction[] = [
      {
        id: 1,
        specificDonor: 'Donor A',
        parentOrg: '',
        recipientThinkTank: 'Tank One',
        year: 2024,
        donorType: 'Pentagon Contractor',
        exactAmount: 0,
        minDonation: 100,
        maxDonation: 0,
        minPlusExact: 100,
        source: 'https://example.com/a',
      },
      {
        id: 2,
        specificDonor: 'Donor A',
        parentOrg: '',
        recipientThinkTank: 'Tank One',
        year: 2024,
        donorType: 'Pentagon Contractor',
        exactAmount: 0,
        minDonation: 50,
        maxDonation: 0,
        minPlusExact: 50,
        source: 'https://example.com/b',
      },
      {
        id: 3,
        specificDonor: 'Donor B',
        parentOrg: 'Parent B',
        recipientThinkTank: 'Tank Two',
        year: 2024,
        donorType: 'Foreign Government',
        exactAmount: 0,
        minDonation: 0,
        maxDonation: 0,
        minPlusExact: 0,
        source: 'https://example.com/c',
      },
    ];

    const sankey = getSankeyData(sample, 5);

    expect(sankey.nodes).toEqual([
      { id: 'donor:Donor A', type: 'donor', donorType: 'Pentagon Contractor' },
      { id: 'tank:Tank One', type: 'tank' },
    ]);
    expect(sankey.links).toEqual([
      {
        source: 'donor:Donor A',
        target: 'tank:Tank One',
        value: 150,
        donorType: 'Pentagon Contractor',
      },
    ]);
  });

  it('keeps only countries and tanks above the chord thresholds', () => {
    const sample: Transaction[] = [
      {
        id: 1,
        specificDonor: 'Embassy A',
        parentOrg: 'Country A',
        recipientThinkTank: 'Tank One',
        year: 2024,
        donorType: 'Foreign Government',
        exactAmount: 0,
        minDonation: 150000,
        maxDonation: 0,
        minPlusExact: 150000,
        source: 'https://example.com/a',
      },
      {
        id: 2,
        specificDonor: 'Embassy A',
        parentOrg: 'Country A',
        recipientThinkTank: 'Tank One',
        year: 2024,
        donorType: 'Foreign Government',
        exactAmount: 0,
        minDonation: 60000,
        maxDonation: 0,
        minPlusExact: 60000,
        source: 'https://example.com/b',
      },
      {
        id: 3,
        specificDonor: 'Embassy B',
        parentOrg: 'Country B',
        recipientThinkTank: 'Tank Two',
        year: 2024,
        donorType: 'Foreign Government',
        exactAmount: 0,
        minDonation: 50000,
        maxDonation: 0,
        minPlusExact: 50000,
        source: 'https://example.com/c',
      },
    ];

    const chord = getChordData(sample);

    expect(chord.countries).toEqual(['Country A']);
    expect(chord.tanks).toEqual(['Tank One']);
    expect(chord.matrix).toEqual([
      [0, 210000],
      [210000, 0],
    ]);
  });

  it('groups timeline entries by decade in ascending order', () => {
    const timeline = getTimelineData(parseThinkTanks());

    expect(timeline.decades[0].decade).toBeLessThan(timeline.decades.at(-1)!.decade);
    expect(timeline.decades.every((entry, index, arr) => index === 0 || entry.decade >= arr[index - 1].decade)).toBe(true);
    expect(timeline.decades.some((entry) => entry.tanks.length > 0)).toBe(true);
  });

  it('keeps repository transactions within documented source and year bounds', () => {
    const knownTanks = new Set(parseThinkTanks().map((tank) => tank.name));
    const missingSourceIds: number[] = [];

    for (const transaction of transactions) {
      expect(transaction.year).toBeGreaterThanOrEqual(2019);
      expect(transaction.year).toBeLessThanOrEqual(2024);
      expect(knownTanks.has(transaction.recipientThinkTank)).toBe(true);
      expect(transaction.minPlusExact).toBeGreaterThanOrEqual(0);

      if (transaction.source === '') {
        missingSourceIds.push(transaction.id);
        continue;
      }

      expect(transaction.source).toMatch(/^https?:\/\//);
      expect(transaction.source).not.toContain('chrome-extension://');
    }

    expect(missingSourceIds.sort((a, b) => a - b)).toEqual([
      37971,
      37973,
      37975,
      37977,
      38390,
      38593,
    ]);
  });
});
