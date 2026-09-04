import { describe, expect, it } from 'vitest';
import { parseThinkTanks } from './thinkTanks';
import { transactions } from './transactions';

describe('think tank dataset', () => {
  it('parses the expected number of think tanks with unique names', () => {
    const tanks = parseThinkTanks();
    const names = tanks.map((tank) => tank.name);

    expect(tanks).toHaveLength(75);
    expect(new Set(names).size).toBe(75);
  });

  it('marks no-tracked-funding tanks only when all sampled categories are zero', () => {
    const tanks = parseThinkTanks();

    for (const tank of tanks) {
      expect(tank.hasNoTrackedFunding).toBe(
        tank.foreignGov === 0 &&
        tank.pentagonContractor === 0 &&
        tank.usGov === 0
      );
      expect(tank.totalFunding).toBe(
        tank.foreignGov + tank.pentagonContractor + tank.usGov
      );
    }
  });

  it('matches the current repository totals used by the dashboard', () => {
    const tanks = parseThinkTanks();
    const noTrackedFundingCount = tanks.filter((tank) => tank.hasNoTrackedFunding).length;

    expect(noTrackedFundingCount).toBe(48);
    expect(transactions).toHaveLength(2682);
  });
});
