import { useRef, useEffect, useMemo } from 'react';
import * as d3 from 'd3';
import type { ThinkTank, Ideology } from '../data/types';
import { IDEOLOGY_COLORS, formatCurrency } from '../utils/colorScales';
import { PanelWrapper } from './PanelWrapper';
import { useTooltip, TooltipBox } from './Tooltip';

export function TreemapPanel({ tanks }: { tanks: ThinkTank[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { tooltip, show, hide, ref: tooltipRef } = useTooltip();

  const hierarchy = useMemo(() => {
    const groups: Record<string, { name: string; ideology: Ideology; tanks: ThinkTank[] }> = {};
    for (const t of tanks) {
      if (!groups[t.ideology]) groups[t.ideology] = { name: t.ideology, ideology: t.ideology, tanks: [] };
      groups[t.ideology].tanks.push(t);
    }
    return {
      name: 'root',
      children: Object.values(groups).map(g => ({
        name: g.name,
        ideology: g.ideology,
        children: g.tanks.map(t => ({
          name: t.name,
          // Use sqrt to compress RAND's dominance, with a floor for visibility
          value: Math.max(Math.sqrt(t.totalFunding + 1) * 100, 5000),
          actualFunding: t.totalFunding,
          isDarkMoney: t.isDarkMoney,
          ideology: t.ideology,
          transparency: t.transparencyScore,
        })),
      })),
    };
  }, [tanks]);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 400;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    // Hatching pattern for dark money
    const defs = svg.append('defs');
    const pattern = defs.append('pattern')
      .attr('id', 'darkMoneyPattern')
      .attr('width', 5).attr('height', 5)
      .attr('patternUnits', 'userSpaceOnUse')
      .attr('patternTransform', 'rotate(45)');
    pattern.append('rect').attr('width', 5).attr('height', 5).attr('fill', '#f3f4f6');
    pattern.append('line')
      .attr('x1', 0).attr('y1', 0).attr('x2', 0).attr('y2', 5)
      .attr('stroke', '#d1d5db').attr('stroke-width', 1.5);

    const root = d3.hierarchy(hierarchy)
      .sum((d: any) => d.value || 0)
      .sort((a, b) => (b.value || 0) - (a.value || 0));

    d3.treemap<any>()
      .size([width, height])
      .padding(3)
      .paddingTop(20)
      .round(true)(root);

    // Group labels
    const groups = svg.selectAll('.group')
      .data(root.children || [])
      .join('g')
      .attr('class', 'group');

    groups.append('rect')
      .attr('x', (d: any) => d.x0)
      .attr('y', (d: any) => d.y0)
      .attr('width', (d: any) => d.x1 - d.x0)
      .attr('height', (d: any) => d.y1 - d.y0)
      .attr('fill', 'none')
      .attr('stroke', (d: any) => IDEOLOGY_COLORS[d.data.ideology as Ideology] || '#666')
      .attr('stroke-width', 1.5)
      .attr('rx', 6);

    groups.append('text')
      .attr('x', (d: any) => d.x0 + 5)
      .attr('y', (d: any) => d.y0 + 14)
      .attr('fill', (d: any) => IDEOLOGY_COLORS[d.data.ideology as Ideology] || '#666')
      .attr('font-size', 10)
      .attr('font-weight', 700)
      .text((d: any) => {
        const w = d.x1 - d.x0;
        const label = `${d.data.name} (${d.children?.length || 0})`;
        return w > 80 ? label : (w > 40 ? d.data.name : '');
      });

    // Individual tank cells
    const leaves = svg.selectAll('.leaf')
      .data(root.leaves())
      .join('g')
      .attr('class', 'leaf');

    leaves.append('rect')
      .attr('x', (d: any) => d.x0 + 0.5)
      .attr('y', (d: any) => d.y0 + 0.5)
      .attr('width', (d: any) => Math.max(0, d.x1 - d.x0 - 1))
      .attr('height', (d: any) => Math.max(0, d.y1 - d.y0 - 1))
      .attr('rx', 3)
      .attr('fill', (d: any) => {
        if (d.data.isDarkMoney) return 'url(#darkMoneyPattern)';
        const ideology = d.data.ideology as Ideology;
        const color = d3.color(IDEOLOGY_COLORS[ideology])!;
        return color.brighter(0.8).toString();
      })
      .attr('stroke', (d: any) => {
        const ideology = d.data.ideology as Ideology;
        return d.data.isDarkMoney ? '#d1d5db' : d3.color(IDEOLOGY_COLORS[ideology])!.darker(0.2).toString();
      })
      .attr('stroke-width', 0.5)
      .style('cursor', 'pointer')
      .on('mouseover', function (event: MouseEvent, d: any) {
        d3.select(this).attr('stroke-width', 2).attr('stroke', '#111');
        show(event, (
          <div>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.data.name}</div>
            <div>Ideology: {d.data.ideology}</div>
            <div>Total Funding: {formatCurrency(d.data.actualFunding)}</div>
            <div>Transparency: {'★'.repeat(d.data.transparency)}{'☆'.repeat(5 - d.data.transparency)}</div>
            {d.data.isDarkMoney && <div style={{ color: '#fca5a5', marginTop: 4 }}>Dark Money — No disclosed funding</div>}
          </div>
        ));
      })
      .on('mouseout', function (_: MouseEvent, d: any) {
        const ideology = d.data.ideology as Ideology;
        d3.select(this)
          .attr('stroke-width', 0.5)
          .attr('stroke', d.data.isDarkMoney ? '#d1d5db' : d3.color(IDEOLOGY_COLORS[ideology])!.darker(0.2).toString());
        hide();
      });

    // Labels for cells big enough
    leaves.append('text')
      .attr('x', (d: any) => d.x0 + 4)
      .attr('y', (d: any) => d.y0 + 13)
      .attr('fill', '#1a1a1a')
      .attr('font-size', (d: any) => {
        const w = d.x1 - d.x0;
        const h = d.y1 - d.y0;
        if (w < 45 || h < 18) return 0;
        return w > 100 ? 9 : 7;
      })
      .attr('font-weight', 500)
      .text((d: any) => {
        const w = d.x1 - d.x0;
        if (w < 45) return '';
        const name = d.data.name;
        const maxChars = Math.floor(w / 6);
        return name.length > maxChars ? name.substring(0, maxChars - 1) + '…' : name;
      });

    leaves.append('text')
      .attr('x', (d: any) => d.x0 + 4)
      .attr('y', (d: any) => d.y0 + 24)
      .attr('fill', '#6b7280')
      .attr('font-size', 7)
      .text((d: any) => {
        const w = d.x1 - d.x0;
        const h = d.y1 - d.y0;
        if (w < 55 || h < 30) return '';
        return d.data.isDarkMoney ? 'undisclosed' : formatCurrency(d.data.actualFunding);
      });
  }, [hierarchy, show, hide]);

  const legend = (
    <div style={{ display: 'flex', gap: 8, fontSize: 9, alignItems: 'center' }}>
      {(Object.entries(IDEOLOGY_COLORS) as [Ideology, string][]).map(([label, color]) => (
        <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 2, color }}>
          <span style={{ width: 8, height: 8, background: color, borderRadius: 2, display: 'inline-block', opacity: 0.7 }} />
          {label}
        </span>
      ))}
    </div>
  );

  return (
    <PanelWrapper title="Ideology & Funding" subtitle="Size = total funding (sqrt scale), color = ideology" legend={legend}>
      <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
        <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
        <TooltipBox tooltip={tooltip} tooltipRef={tooltipRef} />
      </div>
    </PanelWrapper>
  );
}
