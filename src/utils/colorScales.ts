import * as d3 from 'd3';
import type { DonorType, Ideology } from '../data/types';

// Anthropic-inspired warm off-white theme
export const DONOR_TYPE_COLORS: Record<DonorType, string> = {
  'Foreign Government': '#0e7490',
  'Pentagon Contractor': '#c2410c',
  'U.S. Government': '#4338ca',
};

export const IDEOLOGY_COLORS: Record<Ideology, string> = {
  'Left': '#1d4ed8',
  'Center-Left': '#2563eb',
  'Center': '#7c3aed',
  'Center-Right': '#dc2626',
  'Right': '#991b1b',
};

export const DARK_MONEY_COLOR = '#e5e7eb';
export const BG_COLOR = '#faf9f6';
export const PANEL_BG = '#ffffff';
export const TEXT_COLOR = '#1a1a1a';
export const TEXT_MUTED = '#6b7280';
export const GRID_COLOR = '#e5e7eb';
export const BORDER_COLOR = '#d6d3cd';

export const fundingLogScale = (maxVal: number) =>
  d3.scaleLog()
    .domain([1, maxVal])
    .range([0, 1])
    .clamp(true);

export const fundingColorScale = d3.scaleSequential(d3.interpolateBlues);

export const transparencyColorScale = d3.scaleSequential(d3.interpolateYlOrBr)
  .domain([0, 5]);

export function formatCurrency(value: number): string {
  if (value === 0) return '$0';
  if (value >= 1e9) return `$${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `$${(value / 1e3).toFixed(0)}K`;
  return `$${value.toLocaleString()}`;
}

export function abbreviateName(name: string, maxLen = 30): string {
  if (name.length <= maxLen) return name;
  return name.substring(0, maxLen - 1) + '…';
}
