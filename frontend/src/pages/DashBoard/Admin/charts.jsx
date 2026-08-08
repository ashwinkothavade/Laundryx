import { Box, Flex, HStack, Text, Tooltip } from '@chakra-ui/react';
import PropTypes from 'prop-types';

// Brand-derived categorical palette (validated for CVD separation). Identity is
// always reinforced with a direct value label, never colour alone.
export const CATEGORY_COLORS = {
  customer: '#584BAC',
  launderer: '#CE1567',
  admin: '#0E9AA7',
};

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
  defaultColor: '#584BAC',
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

// A section wrapper used across the analytics grid.
export function ChartCard({ title, subtitle, children }) {
  return (
    <Box
      border="1px solid #e2e2e2"
      borderRadius="0.75rem"
      p={{ base: '1rem', md: '1.25rem' }}
      bg="white"
      boxShadow="0px 2px 6px rgba(0,0,0,0.04)"
    >
      <Text fontWeight={700} color="gray.700">
        {title}
      </Text>
      {subtitle && (
        <Text fontSize="xs" color="gray.400" mb="1rem">
          {subtitle}
        </Text>
      )}
      {!subtitle && <Box mb="1rem" />}
      {children}
    </Box>
  );
}

ChartCard.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
};

ChartCard.defaultProps = {
  subtitle: '',
};

export default HBar;
