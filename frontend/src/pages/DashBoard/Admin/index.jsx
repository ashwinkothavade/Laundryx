import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Heading,
  Icon,
  IconButton,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  SimpleGrid,
  Spinner,
  Stat,
  StatHelpText,
  StatLabel,
  StatNumber,
  Table,
  Tag,
  TagCloseButton,
  TagLabel,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Wrap,
  WrapItem,
  useToast,
} from '@chakra-ui/react';
import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Helmet } from 'react-helmet-async';
import {
  MdDelete,
  MdGroups,
  MdReceiptLong,
  MdPayments,
  MdInventory2,
  MdPendingActions,
  MdAccountBalanceWallet,
  MdSearch,
  MdRefresh,
} from 'react-icons/md';
import Navbar from '../../../components/Navbar';
import HBar, { CATEGORY_COLORS, ChartCard, Legend } from './charts';
import {
  addSettingValue,
  adminCreateCoupon,
  adminDeleteCoupon,
  adminDeleteUser,
  adminGetAnalytics,
  adminGetCatalog,
  adminGetOrders,
  adminGetUsers,
  adminListCoupons,
  adminSetApproval,
  adminUpdateUserRole,
  getSettings,
  removeSettingValue,
  upsertSetting,
} from '../../../utils/apis';

const ROLE_COLORS = { admin: 'purple', launderer: 'pink', customer: 'blue' };

const money = (v) => `₹${Number(v || 0).toLocaleString('en-IN')}`;

function ScrollTable({ children }) {
  return (
    <Box overflowX="auto" w="100%">
      <Table variant="simple" size="sm" minW="40rem">
        {children}
      </Table>
    </Box>
  );
}

ScrollTable.propTypes = {
  children: PropTypes.node.isRequired,
};

function AdminDashboard() {
  const toast = useToast();
  const notify = (title, status, description = '') =>
    toast({
      position: 'top',
      title,
      description,
      status,
      duration: 2500,
      isClosable: true,
    });

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [settings, setSettings] = useState({});
  const [newValue, setNewValue] = useState({});
  const [newKey, setNewKey] = useState('');
  const [coupons, setCoupons] = useState([]);
  const emptyCoupon = {
    code: '',
    discountType: 'percent',
    value: '',
    minOrder: '',
  };
  const [newCoupon, setNewCoupon] = useState(emptyCoupon);
  const [refreshing, setRefreshing] = useState(false);

  // Search / filter state for the data tables.
  const [userSearch, setUserSearch] = useState('');
  const [userRole, setUserRole] = useState('all');
  const [orderSearch, setOrderSearch] = useState('');
  const [orderStatus, setOrderStatus] = useState('all');
  const [orderPaid, setOrderPaid] = useState('all');
  const [catalogSearch, setCatalogSearch] = useState('');

  const orderStatusOf = (o) => {
    if (o.deliveredStatus) return 'delivered';
    if (o.pickUpStatus) return 'pickedup';
    if (o.acceptedStatus) return 'accepted';
    return 'pending';
  };

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    return users.filter(
      (u) =>
        (userRole === 'all' || u.role === userRole) &&
        (!q ||
          u.username?.toLowerCase().includes(q) ||
          u.email?.toLowerCase().includes(q))
    );
  }, [users, userSearch, userRole]);

  const filteredOrders = useMemo(() => {
    const q = orderSearch.trim().toLowerCase();
    return orders.filter(
      (o) =>
        (orderStatus === 'all' || orderStatusOf(o) === orderStatus) &&
        (orderPaid === 'all' || (orderPaid === 'paid' ? o.paid : !o.paid)) &&
        (!q ||
          o.user?.username?.toLowerCase().includes(q) ||
          o.launderer?.toLowerCase().includes(q))
    );
  }, [orders, orderSearch, orderStatus, orderPaid]);

  const filteredCatalog = useMemo(() => {
    const q = catalogSearch.trim().toLowerCase();
    if (!q) return catalog;
    return catalog.filter(
      (c) =>
        c.launderer?.username?.toLowerCase().includes(q) ||
        c.clothingType?.toLowerCase().includes(q) ||
        c.washType?.toLowerCase().includes(q)
    );
  }, [catalog, catalogSearch]);

  // Metrics derived client-side from the already-loaded orders / users, so the
  // analytics tab shows actionable numbers without extra endpoints.
  const derived = useMemo(() => {
    const pendingApprovals = users.filter(
      (u) => u.role === 'launderer' && !u.approved
    ).length;
    const outstanding = orders
      .filter((o) => !o.paid)
      .reduce((s, o) => s + (o.orderTotal || 0), 0);
    const paidOrders = orders.filter((o) => o.paid);
    const avgOrderValue = paidOrders.length
      ? Math.round(
          paidOrders.reduce((s, o) => s + (o.orderTotal || 0), 0) /
            paidOrders.length
        )
      : 0;
    const statusCounts = orders.reduce(
      (acc, o) => {
        acc[orderStatusOf(o)] += 1;
        return acc;
      },
      { pending: 0, accepted: 0, pickedup: 0, delivered: 0 }
    );
    return { pendingApprovals, outstanding, avgOrderValue, statusCounts };
  }, [users, orders]);

  const loadAll = async () => {
    const [a, u, o, c, s, cp] = await Promise.allSettled([
      adminGetAnalytics(),
      adminGetUsers(),
      adminGetOrders(),
      adminGetCatalog(),
      getSettings(),
      adminListCoupons(),
    ]);
    if (a.status === 'fulfilled') setAnalytics(a.value.data.analytics);
    if (u.status === 'fulfilled') setUsers(u.value.data.users);
    if (o.status === 'fulfilled') setOrders(o.value.data.orders);
    if (c.status === 'fulfilled') setCatalog(c.value.data.items);
    if (s.status === 'fulfilled') setSettings(s.value.data.settings);
    if (cp.status === 'fulfilled') setCoupons(cp.value.data.coupons);
    setLoading(false);
  };

  const refresh = async () => {
    setRefreshing(true);
    await loadAll();
    setRefreshing(false);
    notify('Dashboard refreshed', 'success');
  };

  const createCoupon = async () => {
    try {
      const res = await adminCreateCoupon({
        code: newCoupon.code.trim(),
        discountType: newCoupon.discountType,
        value: Number(newCoupon.value),
        minOrder: Number(newCoupon.minOrder) || 0,
      });
      setCoupons((prev) => [res.data.coupon, ...prev]);
      setNewCoupon(emptyCoupon);
      notify('Coupon created', 'success');
    } catch (err) {
      notify(
        'Could not create coupon',
        'error',
        err.response?.data?.message || ''
      );
    }
  };

  const removeCoupon = async (id) => {
    try {
      await adminDeleteCoupon(id);
      setCoupons((prev) => prev.filter((c) => c._id !== id));
      notify('Coupon deleted', 'success');
    } catch (err) {
      notify('Could not delete coupon', 'error');
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const changeRole = async (id, role) => {
    try {
      const res = await adminUpdateUserRole(id, role);
      setUsers((prev) => prev.map((u) => (u._id === id ? res.data.user : u)));
      notify('Role updated', 'success');
    } catch (err) {
      notify(
        'Could not update role',
        'error',
        err.response?.data?.message || ''
      );
    }
  };

  const removeUser = async (id) => {
    try {
      await adminDeleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      notify('User deleted', 'success');
    } catch (err) {
      notify(
        'Could not delete user',
        'error',
        err.response?.data?.message || ''
      );
    }
  };

  const toggleApproval = async (id, approved) => {
    try {
      const res = await adminSetApproval(id, approved);
      setUsers((prev) => prev.map((u) => (u._id === id ? res.data.user : u)));
      notify(approved ? 'Launderer approved' : 'Approval revoked', 'success');
    } catch (err) {
      notify(
        'Could not update approval',
        'error',
        err.response?.data?.message || ''
      );
    }
  };

  const addValue = async (key) => {
    const value = (newValue[key] || '').trim();
    if (!value) return;
    try {
      const res = await addSettingValue(key, value);
      setSettings((prev) => ({ ...prev, [key]: res.data.values }));
      setNewValue((prev) => ({ ...prev, [key]: '' }));
    } catch (err) {
      notify('Could not add value', 'error');
    }
  };

  const removeValue = async (key, value) => {
    try {
      const res = await removeSettingValue(key, value);
      setSettings((prev) => ({ ...prev, [key]: res.data.values }));
    } catch (err) {
      notify('Could not remove value', 'error');
    }
  };

  const createList = async () => {
    const key = newKey.trim();
    if (!key) return;
    try {
      await upsertSetting(key, []);
      setSettings((prev) => ({ ...prev, [key]: [] }));
      setNewKey('');
      notify(`List "${key}" created`, 'success');
    } catch (err) {
      notify('Could not create list', 'error');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <Center h="100vh">
          <Spinner size="xl" color="#584BAC" />
        </Center>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>LaundriX - Admin</title>
      </Helmet>
      <Navbar />
      <Box
        pt={{ base: '70px', md: '90px' }}
        px={{ base: '1rem', md: '3rem' }}
        pb="3rem"
        maxW="80rem"
        mx="auto"
      >
        <Flex
          justify="space-between"
          align={{ base: 'start', sm: 'center' }}
          direction={{ base: 'column', sm: 'row' }}
          gap={3}
          mb="1.5rem"
        >
          <Box>
            <Heading size="lg" color="#584BAC">
              Admin Console
            </Heading>
            <Text color="gray.500" fontSize="sm">
              Marketplace overview and management
            </Text>
          </Box>
          <Button
            leftIcon={<MdRefresh size={18} />}
            variant="outline"
            colorScheme="purple"
            size="sm"
            isLoading={refreshing}
            loadingText="Refreshing"
            onClick={refresh}
          >
            Refresh
          </Button>
        </Flex>
        <Tabs colorScheme="purple" variant="enclosed" isLazy>
          <TabList overflowX="auto" overflowY="hidden">
            <Tab>Analytics</Tab>
            <Tab>Users</Tab>
            <Tab>Orders</Tab>
            <Tab>Catalog</Tab>
            <Tab>Coupons</Tab>
            <Tab>Settings</Tab>
          </TabList>
          <TabPanels>
            {/* Analytics */}
            <TabPanel px={0}>
              {analytics && (
                <>
                  <SimpleGrid
                    columns={{ base: 1, sm: 2, lg: 3 }}
                    spacing={4}
                    mb="1.5rem"
                  >
                    <StatCard
                      label="Total Users"
                      value={analytics.totalUsers}
                      icon={MdGroups}
                      accent="#584BAC"
                      help={`${analytics.usersByRole?.customer || 0} customers · ${
                        analytics.usersByRole?.launderer || 0
                      } launderers`}
                    />
                    <StatCard
                      label="Total Orders"
                      value={analytics.totalOrders}
                      icon={MdReceiptLong}
                      accent="#0E9AA7"
                      help={`${derived.statusCounts.delivered} delivered`}
                    />
                    <StatCard
                      label="Paid Revenue"
                      value={money(analytics.paidRevenue)}
                      icon={MdPayments}
                      accent="#38A169"
                      help={`Avg ${money(derived.avgOrderValue)} / paid order`}
                    />
                    <StatCard
                      label="Outstanding"
                      value={money(derived.outstanding)}
                      icon={MdAccountBalanceWallet}
                      accent="#DD6B20"
                      help="Unpaid order value"
                    />
                    <StatCard
                      label="Catalog Items"
                      value={analytics.totalCatalogItems}
                      icon={MdInventory2}
                      accent="#CE1567"
                      help="Across all launderers"
                    />
                    <StatCard
                      label="Pending Approvals"
                      value={derived.pendingApprovals}
                      icon={MdPendingActions}
                      accent={derived.pendingApprovals ? '#E53E3E' : '#718096'}
                      help="Launderers awaiting review"
                    />
                  </SimpleGrid>

                  <SimpleGrid columns={{ base: 1, lg: 2 }} spacing={5}>
                    <ChartCard
                      title="Orders per launderer"
                      subtitle="Order volume by provider"
                    >
                      <HBar
                        data={(analytics.ordersPerLaunderer || []).map((o) => ({
                          label: o.launderer,
                          value: o.orders,
                        }))}
                        defaultColor="#584BAC"
                      />
                    </ChartCard>

                    <ChartCard
                      title="Users by role"
                      subtitle="Marketplace composition"
                    >
                      <HBar
                        labelWidth="6.5rem"
                        data={['customer', 'launderer', 'admin'].map((r) => ({
                          label: `${r[0].toUpperCase()}${r.slice(1)}s`,
                          value: analytics.usersByRole?.[r] || 0,
                          color: CATEGORY_COLORS[r],
                        }))}
                      />
                      <Legend
                        items={[
                          {
                            label: 'Customers',
                            color: CATEGORY_COLORS.customer,
                          },
                          {
                            label: 'Launderers',
                            color: CATEGORY_COLORS.launderer,
                          },
                          { label: 'Admins', color: CATEGORY_COLORS.admin },
                        ]}
                      />
                    </ChartCard>

                    <ChartCard
                      title="Orders by status"
                      subtitle="Where orders are in the pipeline"
                    >
                      <HBar
                        labelWidth="6.5rem"
                        data={[
                          {
                            label: 'Pending',
                            value: derived.statusCounts.pending,
                            color: '#A0AEC0',
                          },
                          {
                            label: 'Accepted',
                            value: derived.statusCounts.accepted,
                            color: '#DD6B20',
                          },
                          {
                            label: 'Picked up',
                            value: derived.statusCounts.pickedup,
                            color: '#3182CE',
                          },
                          {
                            label: 'Delivered',
                            value: derived.statusCounts.delivered,
                            color: '#38A169',
                          },
                        ]}
                      />
                    </ChartCard>

                    <ChartCard
                      title="Revenue"
                      subtitle="Collected vs outstanding"
                    >
                      <HBar
                        labelWidth="6.5rem"
                        format={money}
                        data={[
                          {
                            label: 'Collected',
                            value: analytics.paidRevenue || 0,
                            color: '#38A169',
                          },
                          {
                            label: 'Outstanding',
                            value: derived.outstanding,
                            color: '#DD6B20',
                          },
                        ]}
                      />
                    </ChartCard>
                  </SimpleGrid>
                </>
              )}
            </TabPanel>

            {/* Users */}
            <TabPanel px={0}>
              <Flex
                direction={{ base: 'column', md: 'row' }}
                gap={3}
                mb="1rem"
                align={{ md: 'center' }}
              >
                <SearchInput
                  value={userSearch}
                  onChange={setUserSearch}
                  placeholder="Search username or email"
                />
                <Select
                  size="sm"
                  w={{ base: '100%', md: '10rem' }}
                  value={userRole}
                  onChange={(e) => setUserRole(e.target.value)}
                  bg="white"
                  borderRadius="md"
                >
                  <option value="all">All roles</option>
                  <option value="customer">Customers</option>
                  <option value="launderer">Launderers</option>
                  <option value="admin">Admins</option>
                </Select>
                <ResultCount
                  shown={filteredUsers.length}
                  total={users.length}
                  noun="users"
                />
              </Flex>
              <ScrollTable>
                <Thead>
                  <Tr>
                    <Th>Username</Th>
                    <Th>Email</Th>
                    <Th>Role</Th>
                    <Th>Approval</Th>
                    <Th>Change role</Th>
                    <Th>Delete</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredUsers.map((u) => (
                    <Tr key={u._id}>
                      <Td>{u.username}</Td>
                      <Td>{u.email}</Td>
                      <Td>
                        <Badge colorScheme={ROLE_COLORS[u.role] || 'gray'}>
                          {u.role}
                        </Badge>
                      </Td>
                      <Td>
                        {u.role === 'launderer' ? (
                          <HStack>
                            <Tag
                              size="sm"
                              colorScheme={u.approved ? 'green' : 'orange'}
                            >
                              {u.approved ? 'Approved' : 'Pending'}
                            </Tag>
                            <Button
                              size="xs"
                              variant="outline"
                              colorScheme={u.approved ? 'red' : 'green'}
                              onClick={() => toggleApproval(u._id, !u.approved)}
                            >
                              {u.approved ? 'Revoke' : 'Approve'}
                            </Button>
                          </HStack>
                        ) : (
                          <Text color="gray.400">—</Text>
                        )}
                      </Td>
                      <Td>
                        <Select
                          size="sm"
                          w="9rem"
                          value={u.role}
                          onChange={(e) => changeRole(u._id, e.target.value)}
                        >
                          <option value="customer">customer</option>
                          <option value="launderer">launderer</option>
                          <option value="admin">admin</option>
                        </Select>
                      </Td>
                      <Td>
                        <IconButton
                          aria-label="Delete user"
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          icon={<MdDelete size={18} />}
                          onClick={() => removeUser(u._id)}
                        />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </ScrollTable>
            </TabPanel>

            {/* Orders */}
            <TabPanel px={0}>
              <Flex
                direction={{ base: 'column', md: 'row' }}
                gap={3}
                mb="1rem"
                align={{ md: 'center' }}
              >
                <SearchInput
                  value={orderSearch}
                  onChange={setOrderSearch}
                  placeholder="Search customer or launderer"
                />
                <Select
                  size="sm"
                  w={{ base: '100%', md: '10rem' }}
                  value={orderStatus}
                  onChange={(e) => setOrderStatus(e.target.value)}
                  bg="white"
                  borderRadius="md"
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="pickedup">Picked up</option>
                  <option value="delivered">Delivered</option>
                </Select>
                <Select
                  size="sm"
                  w={{ base: '100%', md: '8rem' }}
                  value={orderPaid}
                  onChange={(e) => setOrderPaid(e.target.value)}
                  bg="white"
                  borderRadius="md"
                >
                  <option value="all">All</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </Select>
                <ResultCount
                  shown={filteredOrders.length}
                  total={orders.length}
                  noun="orders"
                />
              </Flex>
              <ScrollTable>
                <Thead>
                  <Tr>
                    <Th>Customer</Th>
                    <Th>Launderer</Th>
                    <Th isNumeric>Total</Th>
                    <Th>Status</Th>
                    <Th>Paid</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredOrders.map((o) => (
                    <Tr key={o._id}>
                      <Td>{o.user?.username || '—'}</Td>
                      <Td>{o.launderer}</Td>
                      <Td isNumeric>{money(o.orderTotal)}</Td>
                      <Td>
                        {(() => {
                          const s = orderStatusOf(o);
                          const map = {
                            delivered: { c: 'green', t: 'Delivered' },
                            pickedup: { c: 'blue', t: 'Picked up' },
                            accepted: { c: 'orange', t: 'Accepted' },
                            pending: { c: 'gray', t: 'Pending' },
                          };
                          return (
                            <Tag size="sm" colorScheme={map[s].c}>
                              {map[s].t}
                            </Tag>
                          );
                        })()}
                      </Td>
                      <Td>
                        <Tag size="sm" colorScheme={o.paid ? 'green' : 'red'}>
                          {o.paid ? 'Paid' : 'Unpaid'}
                        </Tag>
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </ScrollTable>
              {filteredOrders.length === 0 && (
                <Text color="gray.500" mt="1rem">
                  {orders.length === 0
                    ? 'No orders yet.'
                    : 'No orders match your filters.'}
                </Text>
              )}
            </TabPanel>

            {/* Catalog */}
            <TabPanel px={0}>
              <Flex
                direction={{ base: 'column', md: 'row' }}
                gap={3}
                mb="1rem"
                align={{ md: 'center' }}
              >
                <SearchInput
                  value={catalogSearch}
                  onChange={setCatalogSearch}
                  placeholder="Search launderer, clothing or wash"
                />
                <ResultCount
                  shown={filteredCatalog.length}
                  total={catalog.length}
                  noun="items"
                />
              </Flex>
              <ScrollTable>
                <Thead>
                  <Tr>
                    <Th>Launderer</Th>
                    <Th>Clothing</Th>
                    <Th>Wash type</Th>
                    <Th isNumeric>Price</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {filteredCatalog.map((c) => (
                    <Tr key={c._id}>
                      <Td>{c.launderer?.username || '—'}</Td>
                      <Td>{c.clothingType}</Td>
                      <Td>{c.washType}</Td>
                      <Td isNumeric>{money(c.price)}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </ScrollTable>
              {filteredCatalog.length === 0 && (
                <Text color="gray.500" mt="1rem">
                  {catalog.length === 0
                    ? 'No catalog items yet.'
                    : 'No items match your search.'}
                </Text>
              )}
            </TabPanel>

            {/* Coupons */}
            <TabPanel px={0}>
              <Box
                border="1px solid #e2e2e2"
                borderRadius="0.6rem"
                p="1rem"
                mb="1.5rem"
              >
                <Text fontWeight={600} mb="1rem">
                  Create a coupon
                </Text>
                <Flex
                  direction={{ base: 'column', md: 'row' }}
                  gap={3}
                  align={{ md: 'end' }}
                  wrap="wrap"
                >
                  <Input
                    placeholder="CODE"
                    w={{ base: '100%', md: '8rem' }}
                    value={newCoupon.code}
                    onChange={(e) =>
                      setNewCoupon({ ...newCoupon, code: e.target.value })
                    }
                  />
                  <Select
                    w={{ base: '100%', md: '9rem' }}
                    value={newCoupon.discountType}
                    onChange={(e) =>
                      setNewCoupon({
                        ...newCoupon,
                        discountType: e.target.value,
                      })
                    }
                  >
                    <option value="percent">Percent</option>
                    <option value="flat">Flat</option>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Value"
                    w={{ base: '100%', md: '7rem' }}
                    value={newCoupon.value}
                    onChange={(e) =>
                      setNewCoupon({ ...newCoupon, value: e.target.value })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="Min order"
                    w={{ base: '100%', md: '8rem' }}
                    value={newCoupon.minOrder}
                    onChange={(e) =>
                      setNewCoupon({ ...newCoupon, minOrder: e.target.value })
                    }
                  />
                  <Button
                    bg="#CE1567"
                    color="white"
                    _hover={{ bg: '#bf0055' }}
                    onClick={createCoupon}
                  >
                    Create
                  </Button>
                </Flex>
              </Box>
              <ScrollTable>
                <Thead>
                  <Tr>
                    <Th>Code</Th>
                    <Th>Type</Th>
                    <Th isNumeric>Value</Th>
                    <Th isNumeric>Min order</Th>
                    <Th>Status</Th>
                    <Th>Delete</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {coupons.map((c) => (
                    <Tr key={c._id}>
                      <Td fontWeight={600}>{c.code}</Td>
                      <Td>{c.discountType}</Td>
                      <Td isNumeric>
                        {c.discountType === 'percent'
                          ? `${c.value}%`
                          : `₹${c.value}`}
                      </Td>
                      <Td isNumeric>₹{c.minOrder}</Td>
                      <Td>
                        <Tag
                          size="sm"
                          colorScheme={c.active ? 'green' : 'gray'}
                        >
                          {c.active ? 'Active' : 'Inactive'}
                        </Tag>
                      </Td>
                      <Td>
                        <IconButton
                          aria-label="Delete coupon"
                          size="sm"
                          colorScheme="red"
                          variant="ghost"
                          icon={<MdDelete size={18} />}
                          onClick={() => removeCoupon(c._id)}
                        />
                      </Td>
                    </Tr>
                  ))}
                </Tbody>
              </ScrollTable>
              {coupons.length === 0 && (
                <Text color="gray.500">No coupons yet.</Text>
              )}
            </TabPanel>

            {/* Settings */}
            <TabPanel px={0}>
              <Text color="gray.600" mb="1rem">
                These lists drive the app dynamically (pickup/delivery
                locations, time slots, etc.). Nothing here is hardcoded.
              </Text>
              {Object.entries(settings).map(([key, values]) => (
                <Box
                  key={key}
                  border="1px solid #e2e2e2"
                  borderRadius="0.6rem"
                  p="1rem"
                  mb="1rem"
                >
                  <Text fontWeight={600} mb="0.5rem" textTransform="capitalize">
                    {key}
                  </Text>
                  <Wrap mb="0.75rem">
                    {values.map((v) => (
                      <WrapItem key={v}>
                        <Tag colorScheme="purple" borderRadius="full">
                          <TagLabel>{v}</TagLabel>
                          <TagCloseButton onClick={() => removeValue(key, v)} />
                        </Tag>
                      </WrapItem>
                    ))}
                    {values.length === 0 && (
                      <Text color="gray.400" fontSize="sm">
                        No values yet.
                      </Text>
                    )}
                  </Wrap>
                  <HStack maxW="24rem">
                    <Input
                      size="sm"
                      placeholder={`Add to ${key}`}
                      value={newValue[key] || ''}
                      onChange={(e) =>
                        setNewValue((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      onKeyDown={(e) => e.key === 'Enter' && addValue(key)}
                    />
                    <Button
                      size="sm"
                      colorScheme="purple"
                      onClick={() => addValue(key)}
                    >
                      Add
                    </Button>
                  </HStack>
                </Box>
              ))}
              <Flex gap={2} maxW="24rem" mt="1rem">
                <Input
                  size="sm"
                  placeholder="New list name (e.g. hostels)"
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && createList()}
                />
                <Button
                  size="sm"
                  bg="#CE1567"
                  color="white"
                  _hover={{ bg: '#bf0055' }}
                  onClick={createList}
                >
                  Create list
                </Button>
              </Flex>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </>
  );
}

function StatCard({ label, value, icon, accent, help }) {
  return (
    <Stat
      position="relative"
      border="1px solid #e2e2e2"
      borderLeft={`4px solid ${accent}`}
      borderRadius="0.6rem"
      p="1.1rem 1.25rem"
      bg="white"
      boxShadow="0px 2px 4px rgba(0,0,0,0.05)"
      transition="box-shadow .2s ease, transform .2s ease"
      _hover={{
        boxShadow: '0px 6px 16px rgba(0,0,0,0.08)',
        transform: 'translateY(-2px)',
      }}
    >
      <Flex justify="space-between" align="start">
        <Box>
          <StatLabel color="gray.500" fontWeight={500}>
            {label}
          </StatLabel>
          <StatNumber color="gray.800" fontSize="1.9rem" lineHeight="1.2">
            {value}
          </StatNumber>
          {help && (
            <StatHelpText color="gray.400" mb={0} mt="0.15rem">
              {help}
            </StatHelpText>
          )}
        </Box>
        {icon && (
          <Flex
            align="center"
            justify="center"
            boxSize="2.5rem"
            borderRadius="0.6rem"
            bg={`${accent}1A`}
            flexShrink={0}
          >
            <Icon as={icon} boxSize="1.4rem" color={accent} />
          </Flex>
        )}
      </Flex>
    </Stat>
  );
}

StatCard.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  icon: PropTypes.elementType,
  accent: PropTypes.string,
  help: PropTypes.string,
};

StatCard.defaultProps = {
  icon: null,
  accent: '#584BAC',
  help: '',
};

function SearchInput({ value, onChange, placeholder }) {
  return (
    <InputGroup size="sm" maxW={{ base: '100%', md: '18rem' }}>
      <InputLeftElement pointerEvents="none">
        <Icon as={MdSearch} color="gray.400" />
      </InputLeftElement>
      <Input
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        borderRadius="md"
        bg="white"
      />
    </InputGroup>
  );
}

SearchInput.propTypes = {
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  placeholder: PropTypes.string,
};

SearchInput.defaultProps = { placeholder: 'Search…' };

function ResultCount({ shown, total, noun }) {
  return (
    <Text fontSize="sm" color="gray.500" ml={{ md: 'auto' }}>
      {shown === total ? `${total} ${noun}` : `${shown} of ${total} ${noun}`}
    </Text>
  );
}

ResultCount.propTypes = {
  shown: PropTypes.number.isRequired,
  total: PropTypes.number.isRequired,
  noun: PropTypes.string.isRequired,
};

export default AdminDashboard;
