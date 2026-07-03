import {
  Badge,
  Box,
  Button,
  Center,
  Flex,
  HStack,
  Heading,
  IconButton,
  Input,
  Select,
  SimpleGrid,
  Spinner,
  Stat,
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
import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { MdDelete } from 'react-icons/md';
import Navbar from '../../../components/Navbar';
import {
  addSettingValue,
  adminDeleteUser,
  adminGetAnalytics,
  adminGetCatalog,
  adminGetOrders,
  adminGetUsers,
  adminUpdateUserRole,
  getSettings,
  removeSettingValue,
  upsertSetting,
} from '../../../utils/apis';

const ROLE_COLORS = { admin: 'purple', launderer: 'pink', student: 'blue' };

function ScrollTable({ children }) {
  return (
    <Box overflowX="auto" w="100%">
      <Table variant="simple" size="sm" minW="40rem">
        {children}
      </Table>
    </Box>
  );
}

function AdminDashboard() {
  const toast = useToast();
  const notify = (title, status, description = '') =>
    toast({ position: 'top', title, description, status, duration: 2500, isClosable: true });

  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState(null);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [settings, setSettings] = useState({});
  const [newValue, setNewValue] = useState({});
  const [newKey, setNewKey] = useState('');

  const loadAll = async () => {
    const [a, u, o, c, s] = await Promise.allSettled([
      adminGetAnalytics(),
      adminGetUsers(),
      adminGetOrders(),
      adminGetCatalog(),
      getSettings(),
    ]);
    if (a.status === 'fulfilled') setAnalytics(a.value.data.analytics);
    if (u.status === 'fulfilled') setUsers(u.value.data.users);
    if (o.status === 'fulfilled') setOrders(o.value.data.orders);
    if (c.status === 'fulfilled') setCatalog(c.value.data.items);
    if (s.status === 'fulfilled') setSettings(s.value.data.settings);
    setLoading(false);
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
      notify('Could not update role', 'error', err.response?.data?.message || '');
    }
  };

  const removeUser = async (id) => {
    try {
      await adminDeleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      notify('User deleted', 'success');
    } catch (err) {
      notify('Could not delete user', 'error', err.response?.data?.message || '');
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
        <Heading size="lg" mb="1.5rem" color="#584BAC">
          Admin Console
        </Heading>
        <Tabs colorScheme="purple" variant="enclosed" isLazy>
          <TabList overflowX="auto" overflowY="hidden">
            <Tab>Analytics</Tab>
            <Tab>Users</Tab>
            <Tab>Orders</Tab>
            <Tab>Catalog</Tab>
            <Tab>Settings</Tab>
          </TabList>
          <TabPanels>
            {/* Analytics */}
            <TabPanel px={0}>
              {analytics && (
                <>
                  <SimpleGrid columns={{ base: 2, md: 4 }} spacing={4} mb="2rem">
                    <StatCard label="Total Users" value={analytics.totalUsers} />
                    <StatCard label="Total Orders" value={analytics.totalOrders} />
                    <StatCard label="Paid Revenue" value={`₹${analytics.paidRevenue}`} />
                    <StatCard label="Catalog Items" value={analytics.totalCatalogItems} />
                    <StatCard label="Students" value={analytics.usersByRole?.student || 0} />
                    <StatCard label="Launderers" value={analytics.usersByRole?.launderer || 0} />
                    <StatCard label="Admins" value={analytics.usersByRole?.admin || 0} />
                  </SimpleGrid>
                  <Text fontWeight={600} mb="0.5rem">
                    Orders per launderer
                  </Text>
                  {analytics.ordersPerLaunderer?.length ? (
                    <ScrollTable>
                      <Thead>
                        <Tr>
                          <Th>Launderer</Th>
                          <Th isNumeric>Orders</Th>
                        </Tr>
                      </Thead>
                      <Tbody>
                        {analytics.ordersPerLaunderer.map((o) => (
                          <Tr key={o.launderer}>
                            <Td>{o.launderer}</Td>
                            <Td isNumeric>{o.orders}</Td>
                          </Tr>
                        ))}
                      </Tbody>
                    </ScrollTable>
                  ) : (
                    <Text color="gray.500">No orders yet.</Text>
                  )}
                </>
              )}
            </TabPanel>

            {/* Users */}
            <TabPanel px={0}>
              <ScrollTable>
                <Thead>
                  <Tr>
                    <Th>Username</Th>
                    <Th>Email</Th>
                    <Th>Role</Th>
                    <Th>Change role</Th>
                    <Th>Delete</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {users.map((u) => (
                    <Tr key={u._id}>
                      <Td>{u.username}</Td>
                      <Td>{u.email}</Td>
                      <Td>
                        <Badge colorScheme={ROLE_COLORS[u.role] || 'gray'}>
                          {u.role}
                        </Badge>
                      </Td>
                      <Td>
                        <Select
                          size="sm"
                          w="9rem"
                          value={u.role}
                          onChange={(e) => changeRole(u._id, e.target.value)}
                        >
                          <option value="student">student</option>
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
              <ScrollTable>
                <Thead>
                  <Tr>
                    <Th>Student</Th>
                    <Th>Launderer</Th>
                    <Th isNumeric>Total</Th>
                    <Th>Status</Th>
                    <Th>Paid</Th>
                  </Tr>
                </Thead>
                <Tbody>
                  {orders.map((o) => (
                    <Tr key={o._id}>
                      <Td>{o.user?.username || '—'}</Td>
                      <Td>{o.launderer}</Td>
                      <Td isNumeric>₹{o.orderTotal}</Td>
                      <Td>
                        <Tag size="sm" colorScheme={o.deliveredStatus ? 'green' : o.acceptedStatus ? 'orange' : 'gray'}>
                          {o.deliveredStatus ? 'Delivered' : o.acceptedStatus ? 'Accepted' : 'Pending'}
                        </Tag>
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
              {orders.length === 0 && <Text color="gray.500">No orders yet.</Text>}
            </TabPanel>

            {/* Catalog */}
            <TabPanel px={0}>
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
                  {catalog.map((c) => (
                    <Tr key={c._id}>
                      <Td>{c.launderer?.username || '—'}</Td>
                      <Td>{c.clothingType}</Td>
                      <Td>{c.washType}</Td>
                      <Td isNumeric>₹{c.price}</Td>
                    </Tr>
                  ))}
                </Tbody>
              </ScrollTable>
              {catalog.length === 0 && <Text color="gray.500">No catalog items yet.</Text>}
            </TabPanel>

            {/* Settings */}
            <TabPanel px={0}>
              <Text color="gray.600" mb="1rem">
                These lists drive the app dynamically (pickup/delivery locations,
                time slots, etc.). Nothing here is hardcoded.
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
                        setNewValue((prev) => ({ ...prev, [key]: e.target.value }))
                      }
                      onKeyDown={(e) => e.key === 'Enter' && addValue(key)}
                    />
                    <Button size="sm" colorScheme="purple" onClick={() => addValue(key)}>
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
                <Button size="sm" bg="#CE1567" color="white" _hover={{ bg: '#bf0055' }} onClick={createList}>
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

export default AdminDashboard;
