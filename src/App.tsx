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
import { DarkMoneyBadge } from './components/DarkMoneyBadge';
import { BG_COLOR, TEXT_COLOR, TEXT_MUTED, BORDER_COLOR, formatCurrency } from './utils/colorScales';

export default function App() {
  const tanks = useMemo(() => parseThinkTanks(), []);
  const darkMoneyCount = useMemo(() => tanks.filter(t => t.isDarkMoney).length, [tanks]);
  const totalFunding = useMemo(() => tanks.reduce((s, t) => s + t.totalFunding, 0), [tanks]);
  const fundedCount = tanks.length - darkMoneyCount;

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
              Are think tanks partisan lobbying shops in disguise? Exploring funding, ideology, and influence across 75 institutions.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center', padding: '0 12px' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#111' }}>{tanks.length}</div>
              <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 500 }}>Think Tanks</div>
            </div>
            <div style={{ width: 1, height: 32, background: BORDER_COLOR }} />
            <div style={{ textAlign: 'center', padding: '0 12px' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#4338ca' }}>{fundedCount}</div>
              <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 500 }}>Disclosed</div>
            </div>
            <div style={{ width: 1, height: 32, background: BORDER_COLOR }} />
            <div style={{ textAlign: 'center', padding: '0 12px' }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: '#111' }}>{formatCurrency(totalFunding)}</div>
              <div style={{ fontSize: 11, color: TEXT_MUTED, fontWeight: 500 }}>Total Tracked</div>
            </div>
            <DarkMoneyBadge count={darkMoneyCount} />
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
        <div style={{ minHeight: 520 }}>
          <HeatmapPanel tanks={tanks} />
        </div>
        <div style={{ minHeight: 450 }}>
          <TreemapPanel tanks={tanks} />
        </div>
        <div style={{ minHeight: 450 }}>
          <TimelinePanel tanks={tanks} />
        </div>
        <div style={{ minHeight: 550 }}>
          <SankeyPanel transactions={transactions} />
        </div>
        <div style={{ minHeight: 450 }}>
          <NetworkPanel entries={revolvingDoorData} tanks={tanks} />
        </div>
        <div style={{ minHeight: 520 }}>
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
        Data sourced from Think Tank Funding Tracker. {darkMoneyCount} of {tanks.length} think tanks ({Math.round(darkMoneyCount / tanks.length * 100)}%) disclose zero funding from foreign governments, Pentagon contractors, or U.S. government sources.
        Revolving door data compiled from public records. Funding figures represent minimum disclosed amounts.
      </footer>
    </div>
  );
}
