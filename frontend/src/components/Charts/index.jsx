import {
  Box,
  Flex,
  HStack,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
} from '@chakra-ui/react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

// Shared chart primitives. These started in the admin dashboard; the launderer
// analytics needs the same vocabulary, and two divergent chart kits in one
// product is how dashboards start looking like different products.
//
// Rules held across every chart here:
//   - one y-axis, never two (a second scale invents a correlation)
//   - thin marks, hairline solid gridlines, no borders around fills
//   - a single series carries no legend; its title already names it
//   - values are never locked behind a tooltip — a table view twin exists
//   - text wears text colours, never the series colour

export const BRAND = '#584BAC';
export const ACCENT = '#CE1567';
const SURFACE = '#ffffff';
const GRID = '#eceaf3';

// Brand-derived categorical palette, validated for CVD separation. Identity is
// always reinforced with a direct value label, never colour alone.
export const CATEGORY_COLORS = {
  customer: '#584BAC',
  launderer: '#CE1567',
  admin: '#0E9AA7',
};

// An ordered single-hue ramp for ordered categories (the order funnel, rating
// bands). Validated light->dark: monotone lightness, visible step gaps, and a
// light end that still clears the surface.
export const ORDINAL_PURPLE = [
  '#AFA2D9',
  '#9080C8',
  '#7260B4',
  '#55429C',
  '#38296B',
];

export const formatINR = (n) =>
  `₹${Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

// Compact form for headline numbers, so a stat tile never wraps.
export const compact = (n) => {
  const v = Number(n || 0);
  if (Math.abs(v) >= 1e7) return `${(v / 1e7).toFixed(1)}Cr`;
  if (Math.abs(v) >= 1e5) return `${(v / 1e5).toFixed(1)}L`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toFixed(1)}K`;
  return `${Math.round(v)}`;
};

// Real pixel width of a container. SVG scaled with preserveAspectRatio would
// stretch strokes and markers with it; measuring instead keeps every mark at
// the spec'd thickness at any viewport.
const useMeasure = () => {
  const ref = useRef(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof ResizeObserver === 'undefined') return undefined;
    const ro = new ResizeObserver((entries) => {
      setWidth(entries[0].contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width];
};

// A section wrapper used across every analytics grid.
export function ChartCard({ title, subtitle, action, children }) {
  return (
    <Box
      border="1px solid #e2e2e2"
      borderRadius="0.75rem"
      p={{ base: '1rem', md: '1.25rem' }}
      bg={SURFACE}
      boxShadow="0px 2px 6px rgba(0,0,0,0.04)"
    >
      <Flex justify="space-between" align="flex-start" gap={3}>
        <Box>
          <Text fontWeight={700} color="gray.700">
            {title}
          </Text>
          {subtitle && (
            <Text fontSize="xs" color="gray.400">
              {subtitle}
            </Text>
          )}
        </Box>
        {action}
      </Flex>
      <Box mt="1rem">{children}</Box>
    </Box>
  );
}

ChartCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  action: PropTypes.node,
  children: PropTypes.node.isRequired,
};

ChartCard.defaultProps = { subtitle: '', action: null };

// A dependency-free horizontal bar chart. Magnitude reads along one axis; each
// bar carries a hover tooltip and a direct value label (selective, not noisy).
function HBar({ data, format, labelWidth, defaultColor }) {
  const top = Math.max(1, ...data.map((d) => d.value));
  return (
    <Box>
      {data.map((d) => {
        const pct = Math.max(0, (d.value / top) * 100);
        return (
          <Flex key={d.label} align="center" mb="0.6rem" gap="0.75rem">
            <Text
              w={labelWidth}
              flexShrink={0}
              fontSize="sm"
              color="gray.600"
              noOfLines={1}
              title={d.label}
            >
              {d.label}
            </Text>
            <Tooltip
              hasArrow
              placement="top"
              label={`${d.label}: ${format(d.value)}`}
            >
              <Box
                flex="1"
                bg="gray.100"
                borderRadius="full"
                h="1.15rem"
                overflow="hidden"
                role="img"
                aria-label={`${d.label}: ${format(d.value)}`}
              >
                <Box
                  h="100%"
                  w={`${pct}%`}
                  minW={d.value > 0 ? '6px' : '0'}
                  bg={d.color || defaultColor}
                  borderRadius="full"
                  transition="width .45s ease"
                />
              </Box>
            </Tooltip>
            <Text
              w="4.5rem"
              flexShrink={0}
              textAlign="right"
              fontSize="sm"
              fontWeight={600}
              color="gray.700"
              sx={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {format(d.value)}
            </Text>
          </Flex>
        );
      })}
      {data.length === 0 && (
        <Text color="gray.400" fontSize="sm">
          No data yet.
        </Text>
      )}
    </Box>
  );
}

HBar.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
      color: PropTypes.string,
    })
  ).isRequired,
  format: PropTypes.func,
  labelWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  defaultColor: PropTypes.string,
};

HBar.defaultProps = {
  format: (v) => v,
  labelWidth: '9rem',
  defaultColor: BRAND,
};

// A small legend so categorical identity is never carried by colour alone.
export function Legend({ items }) {
  return (
    <HStack spacing={4} wrap="wrap" mt="0.75rem">
      {items.map((it) => (
        <HStack key={it.label} spacing={2}>
          <Box w="0.75rem" h="0.75rem" borderRadius="sm" bg={it.color} />
          <Text fontSize="xs" color="gray.600">
            {it.label}
          </Text>
        </HStack>
      ))}
    </HStack>
  );
}

Legend.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      color: PropTypes.string.isRequired,
    })
  ).isRequired,
};

// The table twin every chart carries, so no value is reachable only by hover.
export function TableView({ columns, rows, isOpen }) {
  if (!isOpen) return null;
  return (
    <Box mt="1rem" maxH="14rem" overflowY="auto">
      <Table size="sm" variant="simple">
        <Thead>
          <Tr>
            {columns.map((c) => (
              <Th key={c} fontSize="0.65rem">
                {c}
              </Th>
            ))}
          </Tr>
        </Thead>
        <Tbody>
          {rows.map((r) => (
            <Tr key={r.join('|')}>
              {r.map((cell, i) => (
                <Td
                  key={i}
                  fontSize="xs"
                  sx={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {cell}
                </Td>
              ))}
            </Tr>
          ))}
        </Tbody>
      </Table>
    </Box>
  );
}

TableView.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.string).isRequired,
  rows: PropTypes.arrayOf(
    PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.number]))
  ).isRequired,
  isOpen: PropTypes.bool,
};

TableView.defaultProps = { isOpen: false };

// Single-series trend over time: a 2px line over a 10% wash, an end marker
// ringed in the surface colour, and one direct label at the endpoint. No
// legend — there is one series and the card title names it.
export function TrendArea({ data, color, format, height }) {
  const [ref, width] = useMeasure();
  const [hover, setHover] = useState(null);
  const padL = 44;
  const padR = 14;
  const padT = 12;
  const padB = 22;
  const plotW = Math.max(0, width - padL - padR);
  const plotH = height - padT - padB;
  const top = Math.max(1, ...data.map((d) => d.value));

  const x = useCallback(
    (i) => (data.length <= 1 ? 0 : (i / (data.length - 1)) * plotW),
    [data.length, plotW]
  );
  const y = useCallback((v) => plotH - (v / top) * plotH, [plotH, top]);

  const onMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const px = e.clientX - rect.left - padL;
    if (data.length <= 1 || plotW <= 0) return;
    const i = Math.round((px / plotW) * (data.length - 1));
    setHover(Math.min(data.length - 1, Math.max(0, i)));
  };

  const line = data
    .map((d, i) => `${i ? 'L' : 'M'}${x(i)},${y(d.value)}`)
    .join(' ');
  const area = `${line} L${x(data.length - 1)},${plotH} L${x(0)},${plotH} Z`;
  const last = data[data.length - 1];
  const active = hover === null ? null : data[hover];

  return (
    <Box ref={ref} position="relative">
      {width > 0 && (
        <svg
          width={width}
          height={height}
          role="img"
          aria-label={`Trend: ${data.length} points, latest ${format(last?.value ?? 0)}`}
          onMouseMove={onMove}
          onMouseLeave={() => setHover(null)}
        >
          <g transform={`translate(${padL},${padT})`}>
            {/* Hairline solid gridlines, one step off the surface. */}
            {[0, 0.5, 1].map((f) => (
              <line
                key={f}
                x1={0}
                x2={plotW}
                y1={plotH * f}
                y2={plotH * f}
                stroke={GRID}
                strokeWidth={1}
              />
            ))}
            {[1, 0.5, 0].map((f) => (
              <text
                key={f}
                x={-8}
                y={plotH * (1 - f) + 4}
                textAnchor="end"
                fontSize="10"
                fill="#A0AEC0"
                style={{ fontVariantNumeric: 'tabular-nums' }}
              >
                {format(Math.round(top * f))}
              </text>
            ))}
            <path d={area} fill={color} opacity={0.1} />
            <path
              d={line}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {active && (
              <line
                x1={x(hover)}
                x2={x(hover)}
                y1={0}
                y2={plotH}
                stroke={color}
                strokeWidth={1}
                opacity={0.45}
              />
            )}
            {/* End marker: >=8px, ringed in the surface so it stays legible. */}
            <circle
              cx={x(data.length - 1)}
              cy={y(last?.value ?? 0)}
              r={4.5}
              fill={color}
              stroke={SURFACE}
              strokeWidth={2}
            />
            {active && (
              <circle
                cx={x(hover)}
                cy={y(active.value)}
                r={4.5}
                fill={color}
                stroke={SURFACE}
                strokeWidth={2}
              />
            )}
            {/* First and last date only — a label per point is unreadable. */}
            <text x={0} y={plotH + 16} fontSize="10" fill="#A0AEC0">
              {data[0]?.label}
            </text>
            <text
              x={plotW}
              y={plotH + 16}
              fontSize="10"
              fill="#A0AEC0"
              textAnchor="end"
            >
              {last?.label}
            </text>
          </g>
        </svg>
      )}
      {active && (
        <Box
          position="absolute"
          top="0"
          left={`${Math.min(Math.max(padL + x(hover) - 50, 0), Math.max(0, width - 110))}px`}
          bg="gray.700"
          color="white"
          px="0.6rem"
          py="0.3rem"
          borderRadius="md"
          fontSize="xs"
          pointerEvents="none"
          whiteSpace="nowrap"
        >
          {active.label}: {format(active.value)}
        </Box>
      )}
    </Box>
  );
}

TrendArea.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })
  ).isRequired,
  color: PropTypes.string,
  format: PropTypes.func,
  height: PropTypes.number,
};

TrendArea.defaultProps = { color: BRAND, format: (v) => v, height: 170 };

// Discrete counts per day. Columns rather than a line, because the quantity is
// a count of distinct events and reads as such. Capped thickness with a 2px
// surface gap doing the separating.
export function ColumnSeries({ data, color, format, height }) {
  const top = Math.max(1, ...data.map((d) => d.value));
  const peak = data.reduce((a, b) => (b.value > a.value ? b : a), data[0]);
  return (
    <Box>
      <Flex align="flex-end" gap="2px" h={`${height}px`}>
        {data.map((d) => (
          <Tooltip
            key={d.label}
            hasArrow
            placement="top"
            label={`${d.label}: ${format(d.value)}`}
          >
            <Box
              flex="1"
              maxW="24px"
              h="100%"
              display="flex"
              alignItems="flex-end"
              role="img"
              aria-label={`${d.label}: ${format(d.value)}`}
            >
              <Box
                w="100%"
                h={`${Math.max(d.value === 0 ? 0 : 3, (d.value / top) * 100)}%`}
                bg={color}
                borderTopRadius="4px"
                transition="height .45s ease"
              />
            </Box>
          </Tooltip>
        ))}
      </Flex>
      <Flex justify="space-between" mt="0.4rem">
        <Text fontSize="10px" color="gray.400">
          {data[0]?.label}
        </Text>
        {peak?.value > 0 && (
          <Text fontSize="10px" color="gray.500">
            peak {format(peak.value)}
          </Text>
        )}
        <Text fontSize="10px" color="gray.400">
          {data[data.length - 1]?.label}
        </Text>
      </Flex>
    </Box>
  );
}

ColumnSeries.propTypes = {
  data: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
    })
  ).isRequired,
  color: PropTypes.string,
  format: PropTypes.func,
  height: PropTypes.number,
};

ColumnSeries.defaultProps = { color: BRAND, format: (v) => v, height: 140 };

// One whole split into a few parts, read beside its own figures. Thin, no
// baseline, 2px surface gaps between segments; the list beside it carries the
// numbers, so nothing is printed on the bar itself.
export function SegmentedBar({ parts }) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  return (
    <Box>
      <Flex
        h="8px"
        borderRadius="full"
        overflow="hidden"
        gap="2px"
        bg="gray.100"
      >
        {total > 0 &&
          parts.map((p) => (
            <Box
              key={p.label}
              w={`${(p.value / total) * 100}%`}
              bg={p.color}
              transition="width .45s ease"
            />
          ))}
      </Flex>
      <Box mt="0.75rem">
        {parts.map((p) => (
          <Flex key={p.label} align="center" gap="0.5rem" mb="0.35rem">
            <Box
              w="0.7rem"
              h="0.7rem"
              borderRadius="sm"
              bg={p.color}
              flexShrink={0}
            />
            <Text fontSize="sm" color="gray.600">
              {p.label}
            </Text>
            <Text
              ml="auto"
              fontSize="sm"
              fontWeight={600}
              color="gray.700"
              sx={{ fontVariantNumeric: 'tabular-nums' }}
            >
              {p.value}
              {total > 0 && (
                <Text as="span" color="gray.400" fontWeight={400} ml="0.4rem">
                  {Math.round((p.value / total) * 100)}%
                </Text>
              )}
            </Text>
          </Flex>
        ))}
      </Box>
    </Box>
  );
}

SegmentedBar.propTypes = {
  parts: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      value: PropTypes.number.isRequired,
      color: PropTypes.string.isRequired,
    })
  ).isRequired,
};

export default HBar;
