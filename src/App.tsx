import { useMemo } from 'react';
import { parseThinkTanks } from './data/thinkTanks';
import { transactions } from './data/transactions';
import { revolvingDoorData } from './data/supplemental';
import { HeatmapPanel } from './components/HeatmapPanel';
import { TreemapPanel } from './components/TreemapPanel';
import { TimelinePanel } from './components/TimelinePanel';
import { SankeyPanel } from './components/SankeyPanel';
import { NetworkPanel } from './components/NetworkPanel';
import { ChordPanel } from './components/ChordPanel';
import { NoTrackedFundingBadge } from './components/NoTrackedFundingBadge';
import { BG_COLOR, TEXT_COLOR, TEXT_MUTED, BORDER_COLOR, formatCurrency } from './utils/colorScales';

export default function App() {
  const tanks = useMemo(() => parseThinkTanks(), []);
  const noTrackedFundingCount = useMemo(() => tanks.filter(t => t.hasNoTrackedFunding).length, [tanks]);
  const totalFunding = useMemo(() => tanks.reduce((s, t) => s + t.totalFunding, 0), [tanks]);
  const trackedFundingCount = tanks.length - noTrackedFundingCount;

  return (
    <div style={{
      background: BG_COLOR,
      minHeight: '100vh',
      color: TEXT_COLOR,
      fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    }}>
      {/* Header */}
      <header style={{
        padding: '24px 32px 20px',
        borderBottom: `1px solid ${BORDER_COLOR}`,
        background: '#ffffff',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: '-0.5px', color: '#111' }}>
              DC Think Tank Funding Dashboard
            </h1>
            <p style={{ margin: '6px 0 0', fontSize: 14, color: TEXT_MUTED, maxWidth: 600 }}>
              Exploring disclosed funding, transparency, and institutional influence across 75 Washington-area think tanks.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', padding: '0 12px' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#111' }}>{tanks.length}</div>
              <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 500 }}>Think Tanks</div>
            </div>
            <div style={{ width: 1, height: 32, background: BORDER_COLOR }} />
            <div style={{ textAlign: 'center', padding: '0 12px' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#4338ca' }}>{trackedFundingCount}</div>
              <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 500 }}>Disclosed</div>
            </div>
            <div style={{ width: 1, height: 32, background: BORDER_COLOR }} />
            <div style={{ textAlign: 'center', padding: '0 12px' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#111' }}>{formatCurrency(totalFunding)}</div>
              <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 500 }}>Total Tracked</div>
            </div>
            <NoTrackedFundingBadge count={noTrackedFundingCount} />
          </div>
        </div>
      </header>

      {/* Dashboard Grid */}
      <main style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(560px, 1fr))',
        gap: 20,
        padding: 20,
        maxWidth: 1600,
        margin: '0 auto',
      }}>
        <div style={{ height: 520 }}>
          <HeatmapPanel tanks={tanks} />
        </div>
        <div style={{ height: 450 }}>
          <TreemapPanel tanks={tanks} />
        </div>
        <div style={{ height: 450 }}>
          <TimelinePanel tanks={tanks} />
        </div>
        <div style={{ height: 550 }}>
          <SankeyPanel transactions={transactions} />
        </div>
        <div style={{ height: 450 }}>
          <NetworkPanel entries={revolvingDoorData} tanks={tanks} />
        </div>
        <div style={{ height: 520 }}>
          <ChordPanel transactions={transactions} />
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: '20px 32px',
        borderTop: `1px solid ${BORDER_COLOR}`,
        color: TEXT_MUTED,
        fontSize: 12,
        textAlign: 'center',
        background: '#ffffff',
        lineHeight: 1.6,
      }}>
        Funding rows come from think tank disclosures, IRS 990 references, USASpending.gov, and OpenSecrets cross-checks. {noTrackedFundingCount} of {tanks.length} think tanks ({Math.round(noTrackedFundingCount / tanks.length * 100)}%) have no tracked funding in the three sampled donor categories, which is not proof of no funding or undisclosed funding overall. Funding figures represent minimum disclosed amounts, and revolving-door data is compiled from public records.
      </footer>
    </div>
  );
}
