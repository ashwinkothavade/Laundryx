import {
  Box,
  Flex,
  HStack,
  Select,
  Spinner,
  Stack,
  Text,
  Tooltip,
} from '@chakra-ui/react';
import React from 'react';
import PropTypes from 'prop-types';
import { MdCheckCircle, MdLocalLaundryService } from 'react-icons/md';

// The stages an item moves through, in order. Mirrors ITEM_STAGES on the
// server; the order is what makes progress readable as a position rather than
// as a set of flags.
export const STAGES = ['pending', 'washing', 'ready', 'returned'];

const STAGE_LABEL = {
  pending: 'Not started',
  washing: 'In the wash',
  ready: 'Ready',
  returned: 'Returned to you',
};

// Progress is ordinal, so the fill is one hue getting darker rather than four
// unrelated colours — the stage names carry identity, not the colour.
const STAGE_FILL = {
  pending: '#E2E8F0',
  washing: '#9080C8',
  ready: '#7260B4',
  returned: '#55429C',
};

const STAGE_TEXT = {
  pending: 'gray.500',
  washing: '#55429C',
  ready: '#55429C',
  returned: '#38296B',
};

const stageIndex = (stage) => Math.max(0, STAGES.indexOf(stage));

// Four segments, filled up to the item's current stage. Each segment is
// labelled through the accessible name and the tooltip, so the bar is never
// the only way to read where something is.
function StageBar({ stage }) {
  const reached = stageIndex(stage);
  return (
    <Tooltip hasArrow label={STAGE_LABEL[stage]} placement="top">
      <Flex
        gap="2px"
        w="100%"
        maxW="9rem"
        role="img"
        aria-label={`Stage: ${STAGE_LABEL[stage]}`}
      >
        {STAGES.map((s, i) => (
          <Box
            key={s}
            flex="1"
            h="6px"
            borderRadius="full"
            bg={i <= reached ? STAGE_FILL[stage] : '#EDF2F7'}
            transition="background-color .3s ease"
          />
        ))}
      </Flex>
    </Tooltip>
  );
}

StageBar.propTypes = { stage: PropTypes.string };
StageBar.defaultProps = { stage: 'pending' };

// Per-item progress for one order.
//
// The order's own status says where the *order* is. It cannot say that the
// shirts are done while the bedsheets are still in the wash, which is the
// thing students actually ask about — so this reads each line separately.
//
// The same component serves both sides: students get the read-only view, the
// launderer the order was placed with gets a stage control per line.
function ItemTracker({
  items,
  editable,
  onStageChange,
  isPending,
  disabled,
  emptyHint,
}) {
  if (!items || items.length === 0) {
    return (
      <Text color="gray.500" fontSize="sm">
        {emptyHint}
      </Text>
    );
  }

  const done = items.filter(
    (i) => (i.stage || 'pending') === 'returned'
  ).length;
  const ready = items.filter((i) =>
    ['ready', 'returned'].includes(i.stage || 'pending')
  ).length;

  return (
    <Stack gap={3} w="100%">
      <Flex align="center" gap={2}>
        <Box
          as={done === items.length ? MdCheckCircle : MdLocalLaundryService}
          color={done === items.length ? 'green.500' : '#584BAC'}
          size={18}
        />
        <Text fontSize="sm" fontWeight={600} color="gray.700">
          {ready} of {items.length} ready
        </Text>
        {done > 0 && done < items.length && (
          <Text fontSize="sm" color="gray.400">
            · {done} returned
          </Text>
        )}
      </Flex>

      <Stack gap={2}>
        {items.map((item) => {
          const stage = item.stage || 'pending';
          const key = item._id || `${item.name}-${item.washType}`;
          return (
            <Flex
              key={key}
              align={{ base: 'flex-start', sm: 'center' }}
              direction={{ base: 'column', sm: 'row' }}
              gap={{ base: 1, sm: 3 }}
              py="0.5rem"
              borderBottom="1px solid"
              borderColor="gray.100"
            >
              <Box minW={{ sm: '11rem' }} flexShrink={0}>
                <Text fontSize="0.9rem" fontWeight={600} color="gray.700">
                  {item.name}
                  <Text as="span" color="gray.400" fontWeight={400}>
                    {' '}
                    × {item.quantity}
                  </Text>
                </Text>
                <Text fontSize="xs" color="gray.400">
                  {item.washType}
                </Text>
              </Box>

              <HStack
                flex="1"
                minW={0}
                spacing={3}
                w={{ base: '100%', sm: 'auto' }}
              >
                <StageBar stage={stage} />
                <Text
                  fontSize="xs"
                  fontWeight={600}
                  color={STAGE_TEXT[stage]}
                  whiteSpace="nowrap"
                >
                  {STAGE_LABEL[stage]}
                </Text>
              </HStack>

              {editable && (
                <HStack spacing={2} flexShrink={0}>
                  {isPending(key) ? (
                    <Spinner size="sm" color="#584BAC" />
                  ) : (
                    <Select
                      size="sm"
                      w="9.5rem"
                      borderRadius="0.4rem"
                      value={stage}
                      isDisabled={disabled}
                      onChange={(e) => onStageChange(item, e.target.value, key)}
                    >
                      {STAGES.map((s) => (
                        <option key={s} value={s}>
                          {STAGE_LABEL[s]}
                        </option>
                      ))}
                    </Select>
                  )}
                </HStack>
              )}
            </Flex>
          );
        })}
      </Stack>
    </Stack>
  );
}

ItemTracker.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.shape({
      _id: PropTypes.string,
      name: PropTypes.string,
      quantity: PropTypes.number,
      washType: PropTypes.string,
      stage: PropTypes.string,
    })
  ),
  editable: PropTypes.bool,
  onStageChange: PropTypes.func,
  isPending: PropTypes.func,
  disabled: PropTypes.bool,
  emptyHint: PropTypes.string,
};

ItemTracker.defaultProps = {
  items: [],
  editable: false,
  onStageChange: () => {},
  isPending: () => false,
  disabled: false,
  emptyHint: 'No items on this order.',
};

export default ItemTracker;
