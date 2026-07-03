import {
  Center,
  SimpleGrid,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  Stack,
  Text,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { getLaundererAnalytics } from '../../utils/apis';

function StatCard({ label, value }) {
  return (
    <Stat
      border="1px solid #e2e2e2"
      borderRadius="0.6rem"
      p="1rem"
      boxShadow="0px 2px 4px rgba(0,0,0,0.05)"
    >
      <StatLabel color="gray.500">{label}</StatLabel>
      <StatNumber color="#584BAC">{value}</StatNumber>
    </Stat>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
};

function LaundererAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getLaundererAnalytics()
      .then((res) => setData(res.data.analytics))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Center w="100%" py="3rem">
        <Spinner size="xl" color="#584BAC" />
      </Center>
    );
  }

  if (!data) {
    return <Text color="gray.500">Could not load analytics.</Text>;
  }

  return (
    <Stack w="100%" maxW="60rem" gap={6}>
      <Text fontSize={{ base: '1.5rem', md: '2rem' }} fontWeight="bold">
        Your Analytics
      </Text>
      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <StatCard label="Total Orders" value={data.totalOrders} />
        <StatCard label="Revenue (paid)" value={`₹${data.revenue}`} />
        <StatCard label="Pending" value={data.pending} />
        <StatCard label="In Progress" value={data.inProgress} />
        <StatCard label="Delivered" value={data.delivered} />
        <StatCard label="Catalog Items" value={data.catalogItems} />
        <StatCard
          label="Avg Rating"
          value={data.reviewCount ? data.avgRating : 'New'}
        />
        <StatCard label="Reviews" value={data.reviewCount} />
      </SimpleGrid>
    </Stack>
  );
}

export default LaundererAnalytics;
