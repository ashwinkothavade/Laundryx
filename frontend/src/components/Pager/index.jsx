import { Button, Flex, HStack, Spinner, Text } from '@chakra-ui/react';
import React from 'react';
import PropTypes from 'prop-types';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';

// Paging controls for a server-driven list.
//
// The range is stated in rows ("26–50 of 312") rather than only as a page
// number, because "page 2 of 13" does not tell you how much there is or where
// you are in it.
function Pager({ page, limit, total, totalPages, loading, onChange, noun }) {
  const first = total === 0 ? 0 : (page - 1) * limit + 1;
  const last = Math.min(page * limit, total);
  const atStart = page <= 1;
  const atEnd = page >= totalPages;

  // One page of results needs no controls; the count alone is the whole story.
  if (total <= limit && page === 1) {
    return (
      <Text fontSize="sm" color="gray.500">
        {total} {noun}
        {loading && (
          <Spinner size="xs" ml="0.5rem" color="#584BAC" speed="0.7s" />
        )}
      </Text>
    );
  }

  return (
    <Flex align="center" justify="space-between" gap={3} wrap="wrap" w="100%">
      <Text fontSize="sm" color="gray.500">
        {first}–{last} of {total} {noun}
        {loading && (
          <Spinner size="xs" ml="0.5rem" color="#584BAC" speed="0.7s" />
        )}
      </Text>
      <HStack spacing={2}>
        <Button
          size="sm"
          variant="outline"
          leftIcon={<MdChevronLeft />}
          isDisabled={atStart || loading}
          onClick={() => onChange(page - 1)}
        >
          Previous
        </Button>
        <Text fontSize="sm" color="gray.600" minW="6.5rem" textAlign="center">
          Page {page} of {totalPages}
        </Text>
        <Button
          size="sm"
          variant="outline"
          rightIcon={<MdChevronRight />}
          isDisabled={atEnd || loading}
          onClick={() => onChange(page + 1)}
        >
          Next
        </Button>
      </HStack>
    </Flex>
  );
}

Pager.propTypes = {
  page: PropTypes.number,
  limit: PropTypes.number,
  total: PropTypes.number,
  totalPages: PropTypes.number,
  loading: PropTypes.bool,
  onChange: PropTypes.func.isRequired,
  noun: PropTypes.string,
};

Pager.defaultProps = {
  page: 1,
  limit: 25,
  total: 0,
  totalPages: 1,
  loading: false,
  noun: 'results',
};

export default Pager;
