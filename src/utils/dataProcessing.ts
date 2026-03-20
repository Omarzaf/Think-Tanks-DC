import type { ThinkTank, Transaction, SankeyNode, SankeyLink, DonorType } from '../data/types';

export function getSankeyData(
  transactions: Transaction[],
  topN = 25
): { nodes: SankeyNode[]; links: SankeyLink[] } {
  // Aggregate by parent org (or specific donor) → think tank
  const linkMap = new Map<string, { value: number; donorType: DonorType }>();

  for (const t of transactions) {
    if (t.minPlusExact <= 0) continue;
    const donor = t.parentOrg || t.specificDonor;
    const key = `${donor}|||${t.recipientThinkTank}`;
    const existing = linkMap.get(key);
    if (existing) {
      existing.value += t.minPlusExact;
    } else {
      linkMap.set(key, { value: t.minPlusExact, donorType: t.donorType });
    }
  }

  // Aggregate donor totals for top-N filtering
  const donorTotals = new Map<string, number>();
  for (const [key, { value }] of linkMap) {
    const donor = key.split('|||')[0];
    donorTotals.set(donor, (donorTotals.get(donor) || 0) + value);
  }

  const topDonors = new Set(
    [...donorTotals.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topN)
      .map(([name]) => name)
  );

  const nodes: SankeyNode[] = [];
  const nodeSet = new Set<string>();
  const links: SankeyLink[] = [];

  for (const [key, { value, donorType }] of linkMap) {
    const [donor, tank] = key.split('|||');
    if (!topDonors.has(donor)) continue;

    const donorId = `donor:${donor}`;
    const tankId = `tank:${tank}`;

    if (!nodeSet.has(donorId)) {
      nodeSet.add(donorId);
      nodes.push({ id: donorId, type: 'donor', donorType });
    }
    if (!nodeSet.has(tankId)) {
      nodeSet.add(tankId);
      nodes.push({ id: tankId, type: 'tank' });
    }

    links.push({ source: donorId, target: tankId, value, donorType });
  }

  return { nodes, links };
}

export function getChordData(transactions: Transaction[]): {
  countries: string[];
  tanks: string[];
  matrix: number[][];
} {
  const foreignOnly = transactions.filter(
    t => t.donorType === 'Foreign Government' && t.minPlusExact > 0
  );

  // Aggregate country → tank
  const flowMap = new Map<string, Map<string, number>>();
  for (const t of foreignOnly) {
    const country = t.parentOrg || t.specificDonor;
    if (!flowMap.has(country)) flowMap.set(country, new Map());
    const tankMap = flowMap.get(country)!;
    tankMap.set(t.recipientThinkTank, (tankMap.get(t.recipientThinkTank) || 0) + t.minPlusExact);
  }

  // Filter to significant countries and tanks
  const countryTotals = new Map<string, number>();
  const tankTotals = new Map<string, number>();
  for (const [country, tankMap] of flowMap) {
    for (const [tank, val] of tankMap) {
      countryTotals.set(country, (countryTotals.get(country) || 0) + val);
      tankTotals.set(tank, (tankTotals.get(tank) || 0) + val);
    }
  }

  const countries = [...countryTotals.entries()]
    .filter(([, v]) => v >= 100000)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  const tanks = [...tankTotals.entries()]
    .filter(([, v]) => v >= 200000)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name);

  const n = countries.length + tanks.length;
  const matrix: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (let ci = 0; ci < countries.length; ci++) {
    const tankMap = flowMap.get(countries[ci]);
    if (!tankMap) continue;
    for (let ti = 0; ti < tanks.length; ti++) {
      const val = tankMap.get(tanks[ti]) || 0;
      matrix[ci][countries.length + ti] = val;
      matrix[countries.length + ti][ci] = val;
    }
  }

  return { countries, tanks, matrix };
}

export function getTimelineData(tanks: ThinkTank[]): {
  decades: { decade: number; tanks: { name: string; year: number; ideology: string }[] }[];
} {
  const byDecade = new Map<number, { name: string; year: number; ideology: string }[]>();
  for (const t of tanks) {
    const decade = Math.floor(t.foundingYear / 10) * 10;
    if (!byDecade.has(decade)) byDecade.set(decade, []);
    byDecade.get(decade)!.push({ name: t.name, year: t.foundingYear, ideology: t.ideology });
  }
  return {
    decades: [...byDecade.entries()]
      .sort((a, b) => a[0] - b[0])
      .map(([decade, tanks]) => ({ decade, tanks })),
  };
}
