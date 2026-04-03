import { useState, useCallback, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  content: React.ReactNode;
  targetRect?: DOMRect; // store the element's rect for repositioning after measure
}

export function useTooltip() {
  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    content: null,
  });
  const tooltipRef = useRef<HTMLDivElement>(null);
  const pendingContent = useRef<React.ReactNode>(null);
  const pendingTargetRect = useRef<DOMRect | null>(null);

  const updatePosition = useCallback(() => {
    if (!tooltipRef.current || !pendingTargetRect.current) return;
    const tooltipEl = tooltipRef.current;
    const rect = pendingTargetRect.current;
    const tooltipWidth = tooltipEl.offsetWidth;
    const tooltipHeight = tooltipEl.offsetHeight;
    const gap = 8;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Default: right side, vertically centered
    let left = rect.right + gap;
    let top = rect.top + rect.height / 2 - tooltipHeight / 2;

    // Flip to left if off right edge
    if (left + tooltipWidth > viewportWidth - gap) {
      left = rect.left - tooltipWidth - gap;
    }
    // Flip to above/below if off top/bottom
    if (top < gap) {
      top = rect.bottom + gap;
    }
    if (top + tooltipHeight > viewportHeight - gap) {
      top = rect.top - tooltipHeight - gap;
    }
    // Final clamping
    left = Math.max(gap, Math.min(left, viewportWidth - tooltipWidth - gap));
    top = Math.max(gap, Math.min(top, viewportHeight - tooltipHeight - gap));

    setTooltip(prev => ({ ...prev, x: left, y: top }));
  }, []);

  const show = useCallback((e: React.MouseEvent | MouseEvent, content: React.ReactNode) => {
    const target = e.currentTarget as HTMLElement;
    const targetRect = target.getBoundingClientRect();
    pendingTargetRect.current = targetRect;
    pendingContent.current = content;

    // Show tooltip at a temporary position (will reposition after measuring)
    setTooltip({
      visible: true,
      x: 0,
      y: 0,
      content,
      targetRect,
    });
  }, []);

  // After tooltip becomes visible and DOM is updated, measure and reposition
  useEffect(() => {
    if (tooltip.visible && tooltipRef.current && pendingTargetRect.current) {
      updatePosition();
    }
  }, [tooltip.visible, tooltip.content, updatePosition]);

  const hide = useCallback(() => {
    setTooltip(prev => ({ ...prev, visible: false }));
    pendingTargetRect.current = null;
    pendingContent.current = null;
  }, []);

  // Reposition on window resize or scroll
  useEffect(() => {
    if (!tooltip.visible) return;
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [tooltip.visible, updatePosition]);

  return { tooltip, show, hide, ref: tooltipRef };
}

export function TooltipBox({ tooltip, tooltipRef }: {
  tooltip: { visible: boolean; x: number; y: number; content: React.ReactNode };
  tooltipRef: React.RefObject<HTMLDivElement | null>;
}) {
  if (!tooltip.visible) return null;

  // Portal to body to avoid any parent clipping
  return createPortal(
    <div
      ref={tooltipRef}
      style={{
        position: 'fixed',
        left: tooltip.x,
        top: tooltip.y,
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
        transition: 'left 0.05s ease, top 0.05s ease',
      }}
    >
      {tooltip.content}
    </div>,
    document.body
  );
}