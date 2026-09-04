import { useRef, useMemo, useCallback } from 'react';
import * as d3 from 'd3';
import type { ThinkTank } from '../data/types';
import { TEXT_COLOR, TEXT_MUTED, formatCurrency } from '../utils/colorScales';
import { PanelWrapper } from './PanelWrapper';
import { useTooltip, TooltipBox } from './Tooltip';
import { useResizeAwareDraw } from '../utils/useResizeAwareDraw';

const COLUMNS = ['Foreign Gov', 'Pentagon', 'US Gov', 'Total', 'Transparency'];
const COL_KEYS: (keyof ThinkTank)[] = ['foreignGov', 'pentagonContractor', 'usGov', 'totalFunding', 'transparencyScore'];

export function HeatmapPanel({ tanks }: { tanks: ThinkTank[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { tooltip, show, hide, ref: tooltipRef } = useTooltip();

  const sorted = useMemo(() => {
    const tracked = tanks.filter(t => !t.hasNoTrackedFunding).sort((a, b) => b.totalFunding - a.totalFunding);
    const untracked = tanks.filter(t => t.hasNoTrackedFunding).sort((a, b) => a.name.localeCompare(b.name));
    return [...tracked, ...untracked];
  }, [tanks]);

  const noTrackedFundingStart = useMemo(() => sorted.findIndex(t => t.hasNoTrackedFunding), [sorted]);

  const draw = useCallback(() => {
    if (!svgRef.current || !containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    if (width === 0) return;

    const cellH = 19;
    const leftMargin = 230;
    const topMargin = 36;
    const cellW = Math.floor((width - leftMargin - 16) / COLUMNS.length);
    const height = topMargin + sorted.length * cellH + 30;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const maxFunding = d3.max(sorted, d => d.totalFunding) || 1;
    const colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, 1]);
    const logScale = d3.scaleLog().domain([1, maxFunding]).range([0.18, 1]).clamp(true);
    const transColorScale = d3.scaleSequential(d3.interpolateYlOrBr).domain([0, 5]);

    const g = svg.append('g');

    COLUMNS.forEach((col, i) => {
      g.append('text')
        .attr('x', leftMargin + i * cellW + cellW / 2)
        .attr('y', topMargin - 10)
        .attr('text-anchor', 'middle')
        .attr('fill', TEXT_MUTED)
        .attr('font-size', 10)
        .attr('font-weight', 600)
        .text(col);
    });

    if (noTrackedFundingStart > 0) {
      const sepY = topMargin + noTrackedFundingStart * cellH;
      g.append('line')
        .attr('x1', 8).attr('x2', width - 8)
        .attr('y1', sepY - 1).attr('y2', sepY - 1)
        .attr('stroke', '#dc2626')
        .attr('stroke-width', 1.5)
        .attr('stroke-dasharray', '6,3');
      g.append('text')
        .attr('x', 10).attr('y', sepY + 12)
        .attr('fill', '#dc2626')
        .attr('font-size', 9)
        .attr('font-weight', 700)
        .text(`NO TRACKED CATEGORY FUNDING — ${sorted.length - noTrackedFundingStart} tanks with zero tracked funding in the sampled categories`);
    }

    sorted.forEach((tank, ri) => {
      const y = topMargin + ri * cellH + (ri >= noTrackedFundingStart && noTrackedFundingStart >= 0 ? 18 : 0);

      if (ri % 2 === 0) {
        g.append('rect')
          .attr('x', 0).attr('y', y - 1)
          .attr('width', width).attr('height', cellH)
          .attr('fill', tank.hasNoTrackedFunding ? '#fafafa' : '#f9fafb')
          .attr('opacity', 0.5);
      }

      g.append('text')
        .attr('x', leftMargin - 8)
        .attr('y', y + cellH / 2 + 3.5)
        .attr('text-anchor', 'end')
        .attr('fill', tank.hasNoTrackedFunding ? '#9ca3af' : TEXT_COLOR)
        .attr('font-size', 10)
        .attr('font-weight', tank.hasNoTrackedFunding ? 400 : 500)
        .text(tank.name.length > 35 ? tank.name.substring(0, 34) + '…' : tank.name);

      COL_KEYS.forEach((key, ci) => {
        const val = tank[key] as number;
        let fill: string;
        if (key === 'transparencyScore') {
          fill = val === 0 ? '#f3f4f6' : transColorScale(val);
        } else {
          fill = val === 0
            ? (tank.hasNoTrackedFunding ? '#f9fafb' : '#f3f4f6')
            : colorScale(logScale(val));
        }

        const rect = g.append('rect')
          .attr('x', leftMargin + ci * cellW + 1)
          .attr('y', y)
          .attr('width', cellW - 2)
          .attr('height', cellH - 2)
          .attr('rx', 3)
          .attr('fill', fill)
          .attr('stroke', tank.hasNoTrackedFunding ? '#e5e7eb' : 'none')
          .attr('stroke-width', 0.5)
          .attr('stroke-dasharray', tank.hasNoTrackedFunding ? '2,2' : 'none')
          .style('cursor', 'pointer');

        rect.on('mouseover', (event: MouseEvent) => {
          d3.select(event.currentTarget as Element).attr('stroke', '#6366f1').attr('stroke-width', 1.5).attr('stroke-dasharray', 'none');
          show(event, (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>{tank.name}</div>
              <div>Foreign Gov: {formatCurrency(tank.foreignGov)}</div>
              <div>Pentagon: {formatCurrency(tank.pentagonContractor)}</div>
              <div>US Gov: {formatCurrency(tank.usGov)}</div>
              <div>Total: {formatCurrency(tank.totalFunding)}</div>
              <div>Transparency: {'★'.repeat(tank.transparencyScore)}{'☆'.repeat(5 - tank.transparencyScore)} ({tank.transparencyScore}/5)</div>
              {tank.hasNoTrackedFunding && <div style={{ color: '#fca5a5', marginTop: 4 }}>No tracked funding in sampled categories</div>}
            </div>
          ));
        });
        rect.on('mouseout', (event: MouseEvent) => {
          d3.select(event.currentTarget as Element)
            .attr('stroke', tank.hasNoTrackedFunding ? '#e5e7eb' : 'none')
            .attr('stroke-width', 0.5)
            .attr('stroke-dasharray', tank.hasNoTrackedFunding ? '2,2' : 'none');
          hide();
        });
      });
    });
  }, [sorted, noTrackedFundingStart, show, hide]);

  useResizeAwareDraw(containerRef, draw);

  const legend = (
    <div style={{ display: 'flex', gap: 12, fontSize: 10, color: TEXT_MUTED, alignItems: 'center' }}>
      <span>$0</span>
      <div style={{ width: 60, height: 8, background: 'linear-gradient(to right, #f3f4f6, #93c5fd, #2563eb)', borderRadius: 2 }} />
      <span>$1B+</span>
      <span style={{ marginLeft: 8, color: '#dc2626', fontSize: 9 }}>--- No tracked category funding</span>
    </div>
  );

  return (
    <PanelWrapper title="Funding Heatmap" subtitle="All 75 think tanks x 5 factors (log scale)" legend={legend}>
      <div ref={containerRef} style={{ position: 'relative', overflow: 'auto', height: '100%', padding: '0 4px' }}>
        <svg ref={svgRef} />
        <TooltipBox tooltip={tooltip} tooltipRef={tooltipRef} />
      </div>
    </PanelWrapper>
  );
}
