import { useRef, useCallback } from 'react';
import * as d3 from 'd3';
import type { ThinkTank } from '../data/types';
import { IDEOLOGY_COLORS, TEXT_COLOR, TEXT_MUTED, DARK_MONEY_COLOR, GRID_COLOR } from '../utils/colorScales';
import type { Ideology } from '../data/types';
import { PanelWrapper } from './PanelWrapper';
import { useTooltip, TooltipBox } from './Tooltip';
import { useResizeAwareDraw } from '../utils/useResizeAwareDraw';

export function TimelinePanel({ tanks }: { tanks: ThinkTank[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { tooltip, show, hide, ref: tooltipRef } = useTooltip();

  const draw = useCallback(() => {
    if (!svgRef.current || !containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 400;
    if (width === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const margin = { top: 30, right: 24, bottom: 30, left: 44 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;
    const timelineH = plotH * 0.50;
    const barH = plotH * 0.38;
    const gap = plotH * 0.12;

    const g = svg.append('g').attr('transform', `translate(${margin.left},${margin.top})`);
    const years = tanks.map(t => t.foundingYear);
    const minYear = Math.min(...years) - 5;
    const maxYear = 2026;
    const xScale = d3.scaleLinear().domain([minYear, maxYear]).range([0, plotW]);

    g.append('text').attr('x', 0).attr('y', -12).attr('fill', TEXT_COLOR).attr('font-size', 11).attr('font-weight', 600).text('Founding Years of 75 Think Tanks');

    for (let decade = Math.ceil(minYear / 10) * 10; decade <= maxYear; decade += 10) {
      g.append('line').attr('x1', xScale(decade)).attr('x2', xScale(decade)).attr('y1', 0).attr('y2', timelineH).attr('stroke', GRID_COLOR).attr('stroke-width', 0.5);
      g.append('text').attr('x', xScale(decade)).attr('y', timelineH + 14).attr('text-anchor', 'middle').attr('fill', TEXT_MUTED).attr('font-size', 9).text(decade.toString());
    }

    const sorted = [...tanks].sort((a, b) => a.foundingYear - b.foundingYear);
    const yPositions: number[] = [];
    const usedSlots = new Map<number, number[]>();
    sorted.forEach(tank => {
      const x = Math.round(xScale(tank.foundingYear));
      const slots = usedSlots.get(x) || [];
      const baseY = timelineH / 2;
      let y = slots.length === 0 ? baseY : baseY + (Math.ceil(slots.length / 2)) * 14 * (slots.length % 2 === 0 ? 1 : -1);
      y = Math.max(8, Math.min(timelineH - 8, y));
      slots.push(y); usedSlots.set(x, slots); yPositions.push(y);
    });

    sorted.forEach((tank, i) => {
      const cx = xScale(tank.foundingYear);
      const cy = yPositions[i];
      const color = tank.isDarkMoney ? '#9ca3af' : IDEOLOGY_COLORS[tank.ideology as Ideology] || '#666';
      const r = tank.isDarkMoney ? 3.5 : Math.max(3.5, Math.min(7, Math.log10(tank.totalFunding + 1) * 0.8));
      g.append('circle').attr('cx', cx).attr('cy', cy).attr('r', r)
        .attr('fill', color).attr('opacity', tank.isDarkMoney ? 0.4 : 0.75)
        .attr('stroke', tank.isDarkMoney ? '#d1d5db' : '#ffffff').attr('stroke-width', 1).style('cursor', 'pointer')
        .on('mouseover', function (event: MouseEvent) {
          d3.select(this).attr('r', 8).attr('opacity', 1).attr('stroke-width', 2);
          show(event, (
            <div>
              <div style={{ fontWeight: 600 }}>{tank.name}</div>
              <div>Founded: {tank.foundingYear}</div>
              <div>Ideology: {tank.ideology}</div>
              <div>Total Funding: ${tank.totalFunding.toLocaleString()}</div>
              {tank.isDarkMoney && <div style={{ color: '#fca5a5' }}>Dark Money</div>}
            </div>
          ));
        })
        .on('mouseout', function () { d3.select(this).attr('r', r).attr('opacity', tank.isDarkMoney ? 0.4 : 0.75).attr('stroke-width', 1); hide(); });
    });

    const barG = g.append('g').attr('transform', `translate(0,${timelineH + gap})`);
    barG.append('text').attr('x', 0).attr('y', -6).attr('fill', TEXT_COLOR).attr('font-size', 11).attr('font-weight', 600).text('Founded Per Decade');

    const decadeCounts = new Map<number, { funded: number; dark: number }>();
    for (const t of tanks) {
      const decade = Math.floor(t.foundingYear / 10) * 10;
      const entry = decadeCounts.get(decade) || { funded: 0, dark: 0 };
      if (t.isDarkMoney) entry.dark++; else entry.funded++;
      decadeCounts.set(decade, entry);
    }

    const decades = [...decadeCounts.entries()].sort((a, b) => a[0] - b[0]);
    const maxCount = d3.max(decades, d => d[1].funded + d[1].dark) || 1;
    const barYScale = d3.scaleLinear().domain([0, maxCount]).range([barH, 0]);
    const barWidth = Math.min(28, plotW / decades.length * 0.65);

    decades.forEach(([decade, counts]) => {
      const x = xScale(decade + 5) - barWidth / 2;
      const totalH = barH - barYScale(counts.funded + counts.dark);
      const darkH = barH - barYScale(counts.dark);
      barG.append('rect').attr('x', x).attr('y', barYScale(counts.funded + counts.dark)).attr('width', barWidth).attr('height', Math.max(0, totalH - darkH)).attr('fill', '#4338ca').attr('rx', 3).attr('opacity', 0.8);
      barG.append('rect').attr('x', x).attr('y', barYScale(counts.dark)).attr('width', barWidth).attr('height', Math.max(0, darkH)).attr('fill', DARK_MONEY_COLOR).attr('rx', 3).attr('opacity', 0.9).attr('stroke', '#d1d5db').attr('stroke-width', 0.5);
      const total = counts.funded + counts.dark;
      if (total > 0) barG.append('text').attr('x', x + barWidth / 2).attr('y', barYScale(total) - 4).attr('text-anchor', 'middle').attr('fill', TEXT_COLOR).attr('font-size', 9).attr('font-weight', 600).text(total.toString());
    });
  }, [tanks, show, hide]);

  useResizeAwareDraw(containerRef, draw);

  return (
    <PanelWrapper title="Timeline" subtitle="Founding years + establishment trends by decade"
      legend={<div style={{ display: 'flex', gap: 10, fontSize: 9, color: TEXT_MUTED }}><span><span style={{ color: '#4338ca' }}>●</span> Disclosed</span><span><span style={{ color: '#9ca3af' }}>●</span> Dark Money</span></div>}>
      <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
        <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
        <TooltipBox tooltip={tooltip} tooltipRef={tooltipRef} />
      </div>
    </PanelWrapper>
  );
}
