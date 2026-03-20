import { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { sankey as d3Sankey, sankeyLinkHorizontal } from 'd3-sankey';
import type { Transaction, DonorType } from '../data/types';
import { DONOR_TYPE_COLORS, TEXT_COLOR, TEXT_MUTED, formatCurrency } from '../utils/colorScales';
import { getSankeyData } from '../utils/dataProcessing';
import { PanelWrapper } from './PanelWrapper';
import { useTooltip, TooltipBox } from './Tooltip';

const FILTER_OPTIONS: (DonorType | 'All')[] = ['All', 'Foreign Government', 'Pentagon Contractor', 'U.S. Government'];

export function SankeyPanel({ transactions }: { transactions: Transaction[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = useState<DonorType | 'All'>('All');
  const { tooltip, show, hide, ref: tooltipRef } = useTooltip();

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 400;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    try {
      const filtered = filter === 'All'
        ? transactions
        : transactions.filter(t => t.donorType === filter);

      const { nodes, links } = getSankeyData(filtered, 15);
      if (nodes.length === 0 || links.length === 0) return;

      const margin = { top: 10, right: 160, bottom: 10, left: 160 };

      // Build sankey-compatible data: nodes as array, links reference by index
      const nodeList = nodes.map(n => ({
        ...n,
        name: n.id.replace(/^(donor|tank):/, ''),
      }));
      const nodeIndexMap = new Map(nodeList.map((n, i) => [n.id, i]));

      const linkList = links
        .filter(l => nodeIndexMap.has(l.source) && nodeIndexMap.has(l.target))
        .map(l => ({
          source: nodeIndexMap.get(l.source)!,
          target: nodeIndexMap.get(l.target)!,
          value: l.value,
          donorType: l.donorType,
        }));

      if (linkList.length === 0) return;

      const sankeyLayout = d3Sankey<any, any>()
        .nodeWidth(14)
        .nodePadding(10)
        .extent([[margin.left, margin.top], [width - margin.right, height - margin.bottom]]);

      const graph = sankeyLayout({
        nodes: nodeList.map(d => ({ ...d })),
        links: linkList.map(d => ({ ...d })),
      });

      const g = svg.append('g');

      // Links
      g.selectAll('.link')
        .data(graph.links)
        .join('path')
        .attr('class', 'link')
        .attr('d', sankeyLinkHorizontal() as any)
        .attr('fill', 'none')
        .attr('stroke', (d: any) => DONOR_TYPE_COLORS[d.donorType as DonorType] || '#666')
        .attr('stroke-opacity', 0.35)
        .attr('stroke-width', (d: any) => Math.max(1, d.width))
        .style('cursor', 'pointer')
        .on('mouseover', function (event: MouseEvent, d: any) {
          d3.select(this).attr('stroke-opacity', 0.7);
          const srcName = (d.source.name || '').replace(/^(donor|tank):/, '');
          const tgtName = (d.target.name || '').replace(/^(donor|tank):/, '');
          show(event, (
            <div>
              <div style={{ fontWeight: 600 }}>{srcName}</div>
              <div>→ {tgtName}</div>
              <div style={{ marginTop: 4 }}>{formatCurrency(d.value)}</div>
              <div style={{ color: DONOR_TYPE_COLORS[d.donorType as DonorType] }}>{d.donorType}</div>
            </div>
          ));
        })
        .on('mouseout', function () {
          d3.select(this).attr('stroke-opacity', 0.35);
          hide();
        });

      // Nodes
      g.selectAll('.node')
        .data(graph.nodes)
        .join('rect')
        .attr('class', 'node')
        .attr('x', (d: any) => d.x0)
        .attr('y', (d: any) => d.y0)
        .attr('width', (d: any) => d.x1 - d.x0)
        .attr('height', (d: any) => Math.max(1, d.y1 - d.y0))
        .attr('fill', (d: any) => {
          if (d.type === 'tank') return '#475569';
          return DONOR_TYPE_COLORS[d.donorType as DonorType] || '#666';
        })
        .attr('rx', 2)
        .style('cursor', 'pointer')
        .on('mouseover', (event: MouseEvent, d: any) => {
          show(event, (
            <div>
              <div style={{ fontWeight: 600 }}>{(d.name || '').replace(/^(donor|tank):/, '')}</div>
              <div>{d.type === 'donor' ? 'Donor' : 'Think Tank'}</div>
              <div>{formatCurrency(d.value)}</div>
            </div>
          ));
        })
        .on('mouseout', () => hide());

      // Labels
      g.selectAll('.label')
        .data(graph.nodes)
        .join('text')
        .attr('class', 'label')
        .attr('x', (d: any) => d.x0 < width / 2 ? d.x0 - 4 : d.x1 + 4)
        .attr('y', (d: any) => (d.y0 + d.y1) / 2)
        .attr('dy', '0.35em')
        .attr('text-anchor', (d: any) => d.x0 < width / 2 ? 'end' : 'start')
        .attr('fill', TEXT_COLOR)
        .attr('font-size', 8)
        .text((d: any) => {
          const name = (d.name || '').replace(/^(donor|tank):/, '');
          return name.length > 25 ? name.substring(0, 24) + '…' : name;
        });

    } catch (e) {
      console.error('Sankey render error:', e);
    }

  }, [transactions, filter, show, hide]);

  const legend = (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {FILTER_OPTIONS.map(opt => (
        <button
          key={opt}
          onClick={() => setFilter(opt)}
          style={{
            background: filter === opt ? '#f3f4f6' : 'transparent',
            border: '1px solid #d1d5db',
            borderRadius: 6,
            color: opt === 'All' ? TEXT_MUTED : DONOR_TYPE_COLORS[opt as DonorType],
            fontWeight: filter === opt ? 600 : 400,
            fontSize: 9,
            padding: '2px 6px',
            cursor: 'pointer',
          }}
        >
          {opt === 'All' ? 'All' : opt.split(' ')[0]}
        </button>
      ))}
    </div>
  );

  return (
    <PanelWrapper title="Money Flows (Sankey)" subtitle="Top 15 donors → think tanks" legend={legend}>
      <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
        <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
        <TooltipBox tooltip={tooltip} tooltipRef={tooltipRef} />
      </div>
    </PanelWrapper>
  );
}
