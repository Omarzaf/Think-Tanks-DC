import { useState, type ReactNode } from 'react';
import { PANEL_BG, TEXT_COLOR, TEXT_MUTED, BORDER_COLOR } from '../utils/colorScales';

interface PanelWrapperProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  legend?: ReactNode;
}

export function PanelWrapper({ title, subtitle, children, legend }: PanelWrapperProps) {
  const [expanded, setExpanded] = useState(false);

  const content = (
    <div style={{
      background: PANEL_BG,
      borderRadius: 12,
      border: `1px solid ${BORDER_COLOR}`,
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      overflow: 'hidden',
      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '14px 18px 10px',
        borderBottom: `1px solid ${BORDER_COLOR}`,
        flexShrink: 0,
        background: '#fdfcfa',
      }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 600, color: TEXT_COLOR, letterSpacing: '-0.3px' }}>{title}</h3>
          {subtitle && <p style={{ margin: '2px 0 0', fontSize: 11, color: TEXT_MUTED }}>{subtitle}</p>}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {legend}
          <button
            onClick={() => setExpanded(!expanded)}
            style={{
              background: 'none',
              border: `1px solid ${BORDER_COLOR}`,
              borderRadius: 6,
              color: TEXT_MUTED,
              cursor: 'pointer',
              fontSize: 12,
              padding: '3px 8px',
              transition: 'background 0.15s',
            }}
            onMouseOver={e => (e.currentTarget.style.background = '#f5f5f0')}
            onMouseOut={e => (e.currentTarget.style.background = 'transparent')}
          >
            {expanded ? '⊟' : '⊞'}
          </button>
        </div>
      </div>
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', minHeight: 0 }}>
        {children}
      </div>
    </div>
  );

  if (expanded) {
    return (
      <div style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(4px)',
        zIndex: 999,
        padding: 32,
        display: 'flex',
      }}>
        <div style={{ flex: 1 }}>{content}</div>
      </div>
    );
  }

  return content;
}
