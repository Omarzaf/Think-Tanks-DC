import { useState, useCallback, useRef } from 'react';

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: React.ReactNode;
}

export function useTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false, x: 0, y: 0, content: null,
  });
  const ref = useRef<HTMLDivElement>(null);

  const show = useCallback((e: React.MouseEvent | MouseEvent, content: React.ReactNode) => {
    const rect = ref.current?.parentElement?.getBoundingClientRect();
    const x = e.clientX - (rect?.left || 0) + 12;
    const y = e.clientY - (rect?.top || 0) - 12;
    setTooltip({ visible: true, x, y, content });
  }, []);

  const hide = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
  }, []);

  return { tooltip, show, hide, ref };
}

export function TooltipBox({ tooltip, tooltipRef }: {
  tooltip: { visible: boolean; x: number; y: number; content: React.ReactNode };
  tooltipRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (!tooltip.visible) return null;
  return (
    <div
      ref={tooltipRef}
      style={{
        position: 'absolute',
        left: tooltip.x,
        top: tooltip.y,
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 8,
        padding: '10px 14px',
        color: '#f1f5f9',
        fontSize: 12,
        pointerEvents: 'none',
        zIndex: 1000,
        maxWidth: 320,
        whiteSpace: 'pre-wrap',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        lineHeight: 1.5,
      }}
    >
      {tooltip.content}
    </div>
  );
}
