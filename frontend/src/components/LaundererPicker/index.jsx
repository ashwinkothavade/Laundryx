import {
  Badge,
  Box,
  Center,
  Flex,
  HStack,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Text,
} from '@chakra-ui/react';
import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { AiFillStar } from 'react-icons/ai';
import { fetchLaundererDirectory } from '../../utils/apis';

function LaundererPicker({ selected, onSelect }) {
  const [directory, setDirectory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('rating');

  useEffect(() => {
    fetchLaundererDirectory()
      .then((res) => setDirectory(res.data.launderers || []))
      .catch(() => setDirectory([]))
      .finally(() => setLoading(false));
  }, []);

  const visible = useMemo(() => {
    const filtered = directory.filter((l) =>
      l.username.toLowerCase().includes(search.trim().toLowerCase())
    );
    const sorted = [...filtered];
    if (sortBy === 'rating') {
      sorted.sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));
    } else if (sortBy === 'priceLow') {
      sorted.sort(
        (a, b) => (a.minPrice ?? Infinity) - (b.minPrice ?? Infinity)
      );
    } else {
      sorted.sort((a, b) => a.username.localeCompare(b.username));
    }
    return sorted;
  }, [directory, search, sortBy]);

  if (loading) {
    return (
      <Center py="2rem">
        <Spinner color="#584BAC" />
      </Center>
    );
  }

  if (directory.length === 0) {
    return (
      <Text color="gray.500" textAlign="center">
        No launderers are available yet.
      </Text>
    );
  }

  return (
    <Box w="100%" maxW="52rem">
      <Flex direction={{ base: 'column', sm: 'row' }} gap={3} mb="1rem">
        <Input
          placeholder="Search launderers..."
          focusBorderColor="#584BAC"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select
          w={{ base: '100%', sm: '14rem' }}
          focusBorderColor="#584BAC"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="rating">Top rated</option>
          <option value="priceLow">Lowest price</option>
          <option value="name">Name (A–Z)</option>
        </Select>
      </Flex>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        {visible.map((l) => {
          const isSelected = l.username === selected;
          return (
            <Box
              key={l.username}
              as="button"
              type="button"
              textAlign="left"
              onClick={() => onSelect(l.username)}
              border="2px solid"
              borderColor={isSelected ? '#CE1567' : '#e2e2e2'}
              bg={isSelected ? '#FFF5FA' : 'white'}
              borderRadius="0.75rem"
              p="1rem"
              boxShadow="0px 2px 6px rgba(0,0,0,0.06)"
              transition="0.15s"
              _hover={{ borderColor: '#CE1567' }}
            >
              <Flex justify="space-between" align="center" mb="0.5rem">
                <Text fontWeight={700} fontSize="1.1rem">
                  {l.username}
                </Text>
                {isSelected && <Badge colorScheme="pink">Selected</Badge>}
              </Flex>
              <HStack spacing={4} color="gray.600" fontSize="0.9rem">
                <HStack spacing={1}>
                  <AiFillStar color="#F6AD55" />
                  <Text>
                    {l.avgRating ? l.avgRating.toFixed(1) : 'New'}
                    {l.reviewCount ? ` (${l.reviewCount})` : ''}
                  </Text>
                </HStack>
                <Text>
                  {l.itemCount
                    ? `₹${l.minPrice}–₹${l.maxPrice}`
                    : 'No items yet'}
                </Text>
                <Text>{l.itemCount} items</Text>
              </HStack>
            </Box>
          );
        })}
      </SimpleGrid>
    </Box>
  );
}

LaundererPicker.propTypes = {
  selected: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
};

LaundererPicker.defaultProps = {
  selected: '',
};

export default LaundererPicker;
