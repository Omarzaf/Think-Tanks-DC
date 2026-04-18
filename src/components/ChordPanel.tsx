import { useRef, useCallback } from 'react';
import * as d3 from 'd3';
import type { Transaction } from '../data/types';
import { TEXT_MUTED, formatCurrency } from '../utils/colorScales';
import { getChordData } from '../utils/dataProcessing';
import { PanelWrapper } from './PanelWrapper';
import { useTooltip, TooltipBox } from './Tooltip';
import { useResizeAwareDraw } from '../utils/useResizeAwareDraw';

const WARM_PALETTE = ['#f59e0b', '#ef4444', '#f97316', '#eab308', '#d946ef', '#ec4899', '#f43f5e', '#fb923c', '#fbbf24', '#a855f7'];
const COOL_PALETTE = ['#06b6d4', '#3b82f6', '#8b5cf6', '#22d3ee', '#6366f1', '#0ea5e9', '#14b8a6', '#67e8f9', '#818cf8', '#a78bfa'];
const COUNTRY_COLORS = d3.scaleOrdinal<string>(WARM_PALETTE);
const TANK_COLORS = d3.scaleOrdinal<string>(COOL_PALETTE);

export function ChordPanel({ transactions }: { transactions: Transaction[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { tooltip, show, hide, ref: tooltipRef } = useTooltip();

  const draw = useCallback(() => {
    if (!svgRef.current || !containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 400;
    if (width === 0) return;

    const radius = Math.min(width, height) / 2 - 80;
    const { countries, tanks, matrix } = getChordData(transactions);
    const names = [...countries, ...tanks];
    if (names.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    const g = svg.append('g').attr('transform', `translate(${width / 2},${height / 2})`);

    const chord = d3.chord().padAngle(0.04).sortSubgroups(d3.descending);
    const chords = chord(matrix);
    const arc = d3.arc<d3.ChordGroup>().innerRadius(radius).outerRadius(radius + 12);
    const ribbon = d3.ribbon<any, any>().radius(radius - 1);

    g.selectAll('.arc')
      .data(chords.groups)
      .join('path')
      .attr('class', 'arc')
      .attr('d', arc as any)
      .attr('fill', ((d: any) => {
        const i = d.index;
        return i < countries.length ? COUNTRY_COLORS(i.toString()) : TANK_COLORS((i - countries.length).toString());
      }) as any)
      .attr('stroke', '#d6d3cd')
      .attr('stroke-width', 0.5)
      .style('cursor', 'pointer')
      .on('mouseover', (event: MouseEvent, d: any) => {
        ribbonElems.attr('opacity', (r: any) =>
          r.source.index === d.index || r.target.index === d.index ? 0.7 : 0.05
        );
        show(event, (
          <div>
            <div style={{ fontWeight: 600 }}>{names[d.index]}</div>
            <div>{d.index < countries.length ? 'Country/Org' : 'Think Tank'}</div>
            <div>Total: {formatCurrency(d.value)}</div>
          </div>
        ));
      })
      .on('mouseout', () => { ribbonElems.attr('opacity', 0.45); hide(); });

    g.selectAll('.label')
      .data(chords.groups)
      .join('text')
      .attr('class', 'label')
      .each(function (d: any) {
        const angle = (d.startAngle + d.endAngle) / 2;
        const r = radius + 22;
        d3.select(this)
          .attr('x', r * Math.sin(angle))
          .attr('y', -r * Math.cos(angle))
          .attr('text-anchor', angle > Math.PI ? 'end' : 'start')
          .attr('transform', `rotate(${(angle * 180 / Math.PI - 90)}, ${r * Math.sin(angle)}, ${-r * Math.cos(angle)})`);
      })
      .attr('fill', (d: any) => d.index < countries.length ? '#b45309' : '#0369a1')
      .attr('font-size', 8)
      .text((d: any) => {
        const name = names[d.index];
        return name.length > 18 ? name.substring(0, 17) + '…' : name;
      });

    const ribbonElems = g.selectAll('.ribbon')
      .data(chords)
      .join('path')
      .attr('class', 'ribbon')
      .attr('d', ribbon)
      .attr('fill', ((d: any) => COUNTRY_COLORS(d.source.index.toString())) as any)
      .attr('opacity', 0.45)
      .attr('stroke', 'none')
      .style('cursor', 'pointer')
      .on('mouseover', function (event: MouseEvent, d: any) {
        d3.select(this).attr('opacity', 0.8);
        show(event, (
          <div>
            <div style={{ fontWeight: 600 }}>{names[d.source.index]} → {names[d.target.index]}</div>
            <div>{formatCurrency(d.source.value)}</div>
          </div>
        ));
      })
      .on('mouseout', function () { d3.select(this).attr('opacity', 0.45); hide(); });
  }, [transactions, show, hide]);

  useResizeAwareDraw(containerRef, draw);

  return (
    <PanelWrapper
      title="Foreign Government Flows (Chord)"
      subtitle="Country → think tank funding connections"
      legend={
        <div style={{ display: 'flex', gap: 8, fontSize: 9, color: TEXT_MUTED }}>
          <span style={{ color: '#b45309' }}>● Countries</span>
          <span style={{ color: '#0369a1' }}>● Think Tanks</span>
        </div>
      }
    >
      <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
        <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
        <TooltipBox tooltip={tooltip} tooltipRef={tooltipRef} />
      </div>
    </PanelWrapper>
  );
}
