import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import type { RevolvingDoorEntry, ThinkTank } from '../data/types';
import { TEXT_MUTED } from '../utils/colorScales';
import { PanelWrapper } from './PanelWrapper';
import { useTooltip, TooltipBox } from './Tooltip';

interface NetworkNode extends d3.SimulationNodeDatum {
  id: string;
  type: 'person' | 'thinkTank' | 'agency';
  label: string;
  size: number;
}

interface NetworkLink extends d3.SimulationLinkDatum<NetworkNode> {
  direction: string;
}

export function NetworkPanel({ entries, tanks }: { entries: RevolvingDoorEntry[]; tanks: ThinkTank[] }) {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { tooltip, show, hide, ref: tooltipRef } = useTooltip();

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight || 400;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.attr('width', width).attr('height', height);

    // Build graph from revolving door data
    const nodeMap = new Map<string, NetworkNode>();
    const links: NetworkLink[] = [];

    const tankFunding = new Map(tanks.map(t => [t.name, t.totalFunding]));

    for (const entry of entries) {
      const personId = `person:${entry.person}`;
      const tankId = `tank:${entry.thinkTank}`;
      const agencyId = `agency:${entry.govAgency}`;

      if (!nodeMap.has(personId)) {
        nodeMap.set(personId, { id: personId, type: 'person', label: entry.person, size: 4 });
      }
      if (!nodeMap.has(tankId)) {
        const funding = tankFunding.get(entry.thinkTank) || 0;
        nodeMap.set(tankId, {
          id: tankId, type: 'thinkTank', label: entry.thinkTank,
          size: Math.max(6, Math.min(18, Math.log10(funding + 1) * 2)),
        });
      }
      if (!nodeMap.has(agencyId)) {
        nodeMap.set(agencyId, { id: agencyId, type: 'agency', label: entry.govAgency, size: 8 });
      }

      links.push({ source: personId, target: tankId, direction: entry.direction });
      links.push({ source: personId, target: agencyId, direction: entry.direction });
    }

    const nodes = [...nodeMap.values()];

    const simulation = d3.forceSimulation<NetworkNode>(nodes)
      .force('link', d3.forceLink<NetworkNode, NetworkLink>(links).id(d => d.id).distance(60))
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide<NetworkNode>().radius(d => d.size + 2));

    const g = svg.append('g');

    // Zoom
    svg.call(
      d3.zoom<SVGSVGElement, unknown>()
        .scaleExtent([0.3, 4])
        .on('zoom', (event) => g.attr('transform', event.transform))
    );

    // Links
    const linkElems = g.selectAll('.link')
      .data(links)
      .join('line')
      .attr('class', 'link')
      .attr('stroke', (d: any) => {
        if (d.direction === 'gov-to-tank') return '#0e7490';
        if (d.direction === 'tank-to-gov') return '#c2410c';
        return '#7c3aed';
      })
      .attr('stroke-opacity', 0.25)
      .attr('stroke-width', 1);

    // Nodes
    const nodeElems = g.selectAll('.node')
      .data(nodes)
      .join('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .call(d3.drag<any, NetworkNode>()
        .on('start', (event, d) => {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          d.fx = d.x; d.fy = d.y;
        })
        .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on('end', (event, d) => {
          if (!event.active) simulation.alphaTarget(0);
          d.fx = null; d.fy = null;
        })
      );

    nodeElems.each(function (d) {
      const el = d3.select(this);
      if (d.type === 'person') {
        el.append('circle')
          .attr('r', d.size)
          .attr('fill', '#6b7280')
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 1);
      } else if (d.type === 'thinkTank') {
        el.append('rect')
          .attr('x', -d.size).attr('y', -d.size * 0.6)
          .attr('width', d.size * 2).attr('height', d.size * 1.2)
          .attr('rx', 3)
          .attr('fill', '#4338ca')
          .attr('opacity', 0.85);
      } else {
        // Pentagon shape for agencies
        const r = d.size;
        const pts = d3.range(5).map(i => {
          const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
          return `${r * Math.cos(angle)},${r * Math.sin(angle)}`;
        }).join(' ');
        el.append('polygon')
          .attr('points', pts)
          .attr('fill', '#c2410c')
          .attr('opacity', 0.85);
      }
    });

    nodeElems.on('mouseover', (event: MouseEvent, d: NetworkNode) => {
      // Highlight connected links
      linkElems.attr('stroke-opacity', (l: any) =>
        (l.source === d || l.target === d || l.source.id === d.id || l.target.id === d.id) ? 0.8 : 0.1
      );
      const connections = entries.filter(e =>
        (d.type === 'person' && e.person === d.label) ||
        (d.type === 'thinkTank' && e.thinkTank === d.label) ||
        (d.type === 'agency' && e.govAgency === d.label)
      );
      show(event, (
        <div>
          <div style={{ fontWeight: 600 }}>{d.label}</div>
          <div style={{ color: TEXT_MUTED, fontSize: 10 }}>
            {d.type === 'person' ? 'Individual' : d.type === 'thinkTank' ? 'Think Tank' : 'Gov Agency'}
          </div>
          {connections.slice(0, 5).map((c, i) => (
            <div key={i} style={{ fontSize: 10, marginTop: 2 }}>
              {c.person} — {c.govPosition} ↔ {c.thinkTank}
            </div>
          ))}
          {connections.length > 5 && <div style={{ fontSize: 10, color: TEXT_MUTED }}>+{connections.length - 5} more</div>}
        </div>
      ));
    });

    nodeElems.on('mouseout', () => {
      linkElems.attr('stroke-opacity', 0.25);
      hide();
    });

    // Labels for think tanks and agencies only
    nodeElems.filter(d => d.type !== 'person')
      .append('text')
      .attr('dy', (d) => d.type === 'thinkTank' ? d.size * 0.6 + 14 : d.size + 14)
      .attr('text-anchor', 'middle')
      .attr('fill', TEXT_MUTED)
      .attr('font-size', 7)
      .text(d => d.label.length > 20 ? d.label.substring(0, 19) + '…' : d.label);

    simulation.on('tick', () => {
      linkElems
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);
      nodeElems.attr('transform', (d: any) => `translate(${d.x},${d.y})`);
    });

    return () => { simulation.stop(); };
  }, [entries, tanks, show, hide]);

  const legend = (
    <div style={{ display: 'flex', gap: 8, fontSize: 9, color: TEXT_MUTED }}>
      <span>○ Person</span>
      <span style={{ color: '#3b82f6' }}>▬ Tank</span>
      <span style={{ color: '#f97316' }}>⬠ Agency</span>
    </div>
  );

  return (
    <PanelWrapper
      title="Revolving Door Network"
      subtitle={`${entries.length} personnel moves — drag to explore, scroll to zoom`}
      legend={legend}
    >
      <div ref={containerRef} style={{ position: 'relative', width: '100%', height: '100%' }}>
        <svg ref={svgRef} style={{ width: '100%', height: '100%' }} />
        <TooltipBox tooltip={tooltip} tooltipRef={tooltipRef} />
      </div>
    </PanelWrapper>
  );
}
