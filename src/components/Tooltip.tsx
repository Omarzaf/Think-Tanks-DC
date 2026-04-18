import { useState, useCallback, useRef, useLayoutEffect, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: React.ReactNode;
  // false while we're measuring the tooltip size; the div is rendered opacity:0
  positioned: boolean;
}

const CURSOR_OFFSET = 14;
const GAP = 8;

export function useTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: null,
    positioned: false,
  });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const show = useCallback((e: React.MouseEvent | MouseEvent, content: React.ReactNode) => {
    // Position near cursor right away — no (0,0) flash
    setTooltip({
      visible: true,
      x: e.clientX + CURSOR_OFFSET,
      y: e.clientY + CURSOR_OFFSET,
      content,
      positioned: false,
    });
  }, []);

  const hide = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false, positioned: false }));
  }, []);

  // After the tooltip renders (opacity:0), measure it and clamp to viewport.
  // useLayoutEffect runs synchronously after DOM mutation, before the browser
  // paints — so the user never sees the unclamped position.
  useLayoutEffect(() => {
    if (!tooltip.visible || tooltip.positioned || !tooltipRef.current) return;

    const el = tooltipRef.current;
    const w = el.offsetWidth;
    const h = el.offsetHeight;
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    let x = tooltip.x;
    let y = tooltip.y;

    // Flip left if it would overflow the right edge
    if (x + w > vw - GAP) x = tooltip.x - CURSOR_OFFSET * 2 - w;
    // Flip up if it would overflow the bottom edge
    if (y + h > vh - GAP) y = tooltip.y - CURSOR_OFFSET * 2 - h;

    // Hard clamp so it never goes off-screen
    x = Math.max(GAP, Math.min(x, vw - w - GAP));
    y = Math.max(GAP, Math.min(y, vh - h - GAP));

    setTooltip(prev => ({ ...prev, x, y, positioned: true }));
  }, [tooltip.visible, tooltip.content, tooltip.positioned, tooltip.x, tooltip.y]);

  // Reposition on resize (re-trigger measurement by clearing positioned)
  useEffect(() => {
    if (!tooltip.visible) return;
    const onResize = () => setTooltip(prev => ({ ...prev, positioned: false }));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [tooltip.visible]);

  return { tooltip, show, hide, ref: tooltipRef };
}

export function TooltipBox({ tooltip, tooltipRef }: {
  tooltip: TooltipState;
  tooltipRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (!tooltip.visible) return null;

  return createPortal(
    <div
      ref={tooltipRef}
      style={{
        position: 'fixed',
        left: tooltip.x,
        top: tooltip.y,
        // Invisible while measuring so we never flash at the wrong position
        opacity: tooltip.positioned ? 1 : 0,
        background: '#1e293b',
        border: '1px solid #334155',
        borderRadius: 8,
        padding: '10px 14px',
        color: '#f1f5f9',
        fontSize: 12,
        pointerEvents: 'none',
        zIndex: 9999,
        maxWidth: 320,
        whiteSpace: 'pre-wrap',
        boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
        lineHeight: 1.5,
      }}
    >
      {tooltip.content}
    </div>,
    document.body
  );
}
