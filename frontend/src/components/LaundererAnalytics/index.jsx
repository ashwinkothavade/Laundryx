import {
  Box,
  Button,
  Center,
  Flex,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FiArrowDownRight, FiArrowUpRight } from 'react-icons/fi';
import HBar, {
  ACCENT,
  BRAND,
  ChartCard,
  ColumnSeries,
  ORDINAL_PURPLE,
  SegmentedBar,
  TableView,
  TrendArea,
  compact,
  formatINR,
} from '../Charts';
import EmptyState from '../EmptyState';
import { getLaundererAnalytics } from '../../utils/apis';

// 'YYYY-MM-DD' -> '04 Nov'. The API's trend buckets are real dates, so they
// can be formatted; most other dates in this app are stored as display
// strings and cannot.
const shortDay = (iso) => {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  });
};

const pctChange = (now, before) => {
  if (!before) return now ? 100 : 0;
  return Math.round(((now - before) / before) * 100);
};

// label + value, with an optional direction against a named period. Values use
// proportional figures — tabular widths make a headline number look loose.
function StatTile({ label, value, delta, deltaLabel, help }) {
  const up = delta > 0;
  const flat = delta === 0 || delta === null;
  return (
    <Box
      border="1px solid #e2e2e2"
      borderRadius="0.75rem"
      p="1rem"
      bg="white"
      boxShadow="0px 2px 6px rgba(0,0,0,0.04)"
    >
      <Text fontSize="xs" color="gray.500" noOfLines={1}>
        {label}
      </Text>
      <Text
        fontSize="1.6rem"
        fontWeight={600}
        color="gray.800"
        lineHeight="1.2"
      >
        {value}
      </Text>
      {!flat && (
        <Flex align="center" gap="0.25rem" mt="0.1rem">
          <Box
            as={up ? FiArrowUpRight : FiArrowDownRight}
            color={up ? 'green.500' : 'red.500'}
          />
          <Text
            fontSize="xs"
            color={up ? 'green.600' : 'red.600'}
            fontWeight={600}
          >
            {Math.abs(delta)}%
          </Text>
          <Text fontSize="xs" color="gray.400">
            {deltaLabel}
          </Text>
        </Flex>
      )}
      {flat && help && (
        <Text fontSize="xs" color="gray.400" mt="0.1rem" noOfLines={1}>
          {help}
        </Text>
      )}
    </Box>
  );
}

StatTile.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  delta: PropTypes.number,
  deltaLabel: PropTypes.string,
  help: PropTypes.string,
};

StatTile.defaultProps = { delta: null, deltaLabel: '', help: '' };

// A toggle that reveals a chart's table twin, so no value is reachable only by
// hovering a mark.
function TableToggle({ isOpen, onToggle }) {
  return (
    <Button size="xs" variant="ghost" color="gray.500" onClick={onToggle}>
      {isOpen ? 'Hide table' : 'Table'}
    </Button>
  );
}

TableToggle.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onToggle: PropTypes.func.isRequired,
};

function LaundererAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const revenueTable = useDisclosure();
  const ordersTable = useDisclosure();

  useEffect(() => {
    let live = true;
    getLaundererAnalytics()
      .then((res) => {
        if (live) setData(res.data.analytics);
      })
      .catch(() => {
        if (live) setFailed(true);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  if (loading) {
    return (
      <Center w="100%" py="4rem">
        <Spinner size="xl" color={BRAND} thickness="3px" />
      </Center>
    );
  }

  if (failed || !data) {
    return (
      <EmptyState
        title="Could not load your analytics"
        description="We couldn't reach the server. Refresh the page to try again."
      />
    );
  }

  // The API gained these fields after the first version of this screen; fall
  // back rather than render NaN if an older API is deployed.
  const trend = data.trend || [];
  const funnel = data.funnel || {};
  const topItems = data.topItems || [];
  const last7 = data.last7 || { orders: 0, revenue: 0 };
  const prev7 = data.prev7 || { orders: 0, revenue: 0 };
  const ratings = data.ratings || {};

  const revenueSeries = trend.map((d) => ({
    label: shortDay(d.date),
    value: d.revenue,
  }));
  const orderSeries = trend.map((d) => ({
    label: shortDay(d.date),
    value: d.orders,
  }));

  const hasHistory = (data.totalOrders || 0) > 0;

  return (
    <Stack w="100%" maxW="72rem" gap={6} pb="3rem">
      <Box>
        <Text
          fontSize={{ base: '1.4rem', md: '1.8rem' }}
          fontWeight="bold"
          color="gray.800"
        >
          Overview
        </Text>
        <Text color="gray.500" fontSize="sm">
          How your laundry is doing, updated live.
        </Text>
      </Box>

      {/* The one number the dashboard leads with. */}
      <Box
        border="1px solid #e2e2e2"
        borderRadius="0.75rem"
        bg="white"
        p={{ base: '1.25rem', md: '1.5rem' }}
        boxShadow="0px 2px 6px rgba(0,0,0,0.04)"
      >
        <Text fontSize="sm" color="gray.500">
          Revenue collected
        </Text>
        <Text
          fontSize={{ base: '2.6rem', md: '3rem' }}
          fontWeight={700}
          color={BRAND}
          lineHeight="1.1"
        >
          {formatINR(data.revenue)}
        </Text>
        <Text fontSize="sm" color="gray.500">
          across {data.totalOrders} order{data.totalOrders === 1 ? '' : 's'}
          {data.outstanding > 0 && (
            <>
              {' · '}
              <Text as="span" color={ACCENT} fontWeight={600}>
                {formatINR(data.outstanding)} still owed
              </Text>
            </>
          )}
        </Text>
      </Box>

      <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4}>
        <StatTile
          label="Orders this week"
          value={last7.orders}
          delta={pctChange(last7.orders, prev7.orders)}
          deltaLabel="vs last week"
          help="No orders last week"
        />
        <StatTile
          label="Earned this week"
          value={formatINR(last7.revenue)}
          delta={pctChange(last7.revenue, prev7.revenue)}
          deltaLabel="vs last week"
          help="Nothing collected yet"
        />
        <StatTile
          label="Average order"
          value={formatINR(data.avgOrderValue)}
          help="Across paid orders"
        />
        <StatTile
          label="Rating"
          value={data.reviewCount ? `${data.avgRating} ★` : 'New'}
          help={`${data.reviewCount} review${data.reviewCount === 1 ? '' : 's'}`}
        />
      </SimpleGrid>

      {!hasHistory && (
        <EmptyState
          title="No orders yet"
          description="Once students start placing orders with you, your revenue, busiest days and most-washed items will appear here."
        />
      )}

      {hasHistory && (
        <>
          {/* Two measures, two charts — never two y-scales on one plot. */}
          <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={5}>
            <ChartCard
              title="Revenue collected"
              subtitle={`Paid orders, last ${data.trendDays || trend.length} days`}
              action={
                <TableToggle
                  isOpen={revenueTable.isOpen}
                  onToggle={revenueTable.onToggle}
                />
              }
            >
              <TrendArea
                data={revenueSeries}
                color={BRAND}
                format={(v) => `₹${compact(v)}`}
              />
              <TableView
                isOpen={revenueTable.isOpen}
                columns={['Day', 'Revenue']}
                rows={revenueSeries.map((d) => [d.label, formatINR(d.value)])}
              />
            </ChartCard>

            <ChartCard
              title="Orders placed"
              subtitle={`All orders, last ${data.trendDays || trend.length} days`}
              action={
                <TableToggle
                  isOpen={ordersTable.isOpen}
                  onToggle={ordersTable.onToggle}
                />
              }
            >
              <ColumnSeries data={orderSeries} color={ACCENT} />
              <TableView
                isOpen={ordersTable.isOpen}
                columns={['Day', 'Orders']}
                rows={orderSeries.map((d) => [d.label, d.value])}
              />
            </ChartCard>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, xl: 2 }} spacing={5}>
            {/* Ordered stages -> the ordinal ramp, not categorical hues. */}
            <ChartCard
              title="Where your orders are"
              subtitle="Each stage includes the ones past it"
            >
              <HBar
                labelWidth="7rem"
                data={[
                  {
                    label: 'Placed',
                    value: funnel.placed || 0,
                    color: ORDINAL_PURPLE[0],
                  },
                  {
                    label: 'Accepted',
                    value: funnel.accepted || 0,
                    color: ORDINAL_PURPLE[1],
                  },
                  {
                    label: 'Picked up',
                    value: funnel.pickedUp || 0,
                    color: ORDINAL_PURPLE[2],
                  },
                  {
                    label: 'Delivered',
                    value: funnel.delivered || 0,
                    color: ORDINAL_PURPLE[3],
                  },
                  {
                    label: 'Paid',
                    value: funnel.paid || 0,
                    color: ORDINAL_PURPLE[4],
                  },
                ]}
              />
            </ChartCard>

            {/* Nominal categories -> one hue for every bar. */}
            <ChartCard
              title="Most washed"
              subtitle="By number of items, all time"
            >
              <HBar
                labelWidth="8rem"
                data={topItems.map((i) => ({
                  label: i.name,
                  value: i.quantity,
                }))}
              />
            </ChartCard>
          </SimpleGrid>

          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={5}>
            <ChartCard
              title="How orders reach you"
              subtitle="Pickup vs drop-off"
            >
              <SegmentedBar
                parts={[
                  {
                    label: 'You collect',
                    value: data.fulfilment?.home_pickup || 0,
                    color: BRAND,
                  },
                  {
                    label: 'Student drops off',
                    value: data.fulfilment?.self_dropoff || 0,
                    color: '#0E9AA7',
                  },
                ]}
              />
            </ChartCard>

            <ChartCard
              title="Express demand"
              subtitle="Orders paying the surcharge"
            >
              <SegmentedBar
                parts={[
                  {
                    label: 'Express',
                    value: data.express?.express || 0,
                    color: ACCENT,
                  },
                  {
                    label: 'Standard',
                    value: data.express?.standard || 0,
                    color: BRAND,
                  },
                ]}
              />
            </ChartCard>

            <ChartCard title="Customers" subtitle="People who ordered from you">
              <SegmentedBar
                parts={[
                  {
                    label: 'Came back',
                    value: data.repeatCustomers || 0,
                    color: BRAND,
                  },
                  {
                    label: 'Ordered once',
                    value: Math.max(
                      0,
                      (data.uniqueCustomers || 0) - (data.repeatCustomers || 0)
                    ),
                    color: '#0E9AA7',
                  },
                ]}
              />
            </ChartCard>
          </SimpleGrid>

          {data.reviewCount > 0 && (
            <ChartCard
              title="Ratings"
              subtitle={`${data.reviewCount} review${data.reviewCount === 1 ? '' : 's'}`}
            >
              <HBar
                labelWidth="4rem"
                data={[5, 4, 3, 2, 1].map((star, i) => ({
                  label: `${star} ★`,
                  value: ratings[star] || 0,
                  color: ORDINAL_PURPLE[4 - i],
                }))}
              />
            </ChartCard>
          )}
        </>
      )}
    </Stack>
  );
}

export default LaundererAnalytics;
