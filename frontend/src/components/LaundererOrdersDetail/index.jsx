import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Alert,
  AlertIcon,
  Box,
  Button,
  Center,
  Checkbox,
  CheckboxGroup,
  Divider,
  Grid,
  GridItem,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Switch,
  Table,
  Tag,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
  VStack,
  useDisclosure,
  useToast,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import moment from 'moment';
import useAuthStore from '../Store/AuthStore';
import {
  getAllOrders,
  postNotif,
  updateAcceptedStatus,
  updateDeliveryStatus,
} from '../../utils/apis';

function LaundererOrdersDetail() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState(['all']);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();
  const { userName } = useAuthStore((state) => ({
    userName: state.userName,
  }));
  const handleToast = (title, description, status) => {
    toast({
      position: 'top',
      title,
      description,
      status,
      duration: 5000,
      isClosable: true,
    });
  };

  useEffect(() => {
    const getOrders = async () => {
      try {
        const response = await getAllOrders();
        setOrders(response.data.orders);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };
    getOrders();
  }, []);

  const handleCardClick = (order) => {
    setSelectedOrder(order);
    onOpen();
  };

  const handleFilterChange = (value) => {
    if (value === 'all') {
      setSelectedFilters(['all']);
    } else {
      setSelectedFilters((prev) => {
        const newFilters = prev.includes(value)
          ? prev.filter((f) => f !== value)
          : [...prev.filter((f) => f !== 'all'), value];
        return newFilters.length === 0 ? ['all'] : newFilters;
      });
    }
  };

  const handleUpdateAcceptedStatus = async (order_id) => {
    try {
      const response = await updateAcceptedStatus(order_id);

      if (response.status === 200) {
        const notification = {
          launderer: userName,
          message: `Your order with Order ID: ${order_id} has been accepted.`,
          student: '', // need to query the student username from the order_id
          orderId: order_id,
        };
        const notifResponse = await postNotif(notification);

        if (notifResponse.status !== 500) {
          console.log(notifResponse);
        }
        setOrders((prevOrders) => {
          return prevOrders.map((order) => {
            if (order._id === order_id) {
              return { ...order, acceptedStatus: true };
            }
            return order;
          });
        });
        onClose();
      }
    } catch (err) {
      handleToast('Some Error Occurred', err.message, 'error');
    }
  };

  const handleUpdateDeliveredStatus = async (order_id) => {
    try {
      const response = await updateDeliveryStatus(order_id);

      if (response.status === 200) {
        const notification = {
          launderer: userName,
          message: `Your order with Order ID: ${order_id} has been delivered.`,
          student: '', // need to query the student username from the order_id
          orderId: order_id,
        };
        const notifResponse = await postNotif(notification);

        if (notifResponse.status !== 500) {
          console.log(notifResponse);
        }
        setOrders((prevOrders) => {
          return prevOrders.map((order) => {
            if (order._id === order_id) {
              return { ...order, deliveredStatus: true };
            }
            return order;
          });
        });
        onClose();
      }
    } catch (err) {
      handleToast('Some Error Occurred', err.message, 'error');
    }
  };

  // Home-pickup orders scheduled for collection today that aren't picked up yet.
  const todaysPickups = orders.filter(
    (order) =>
      order.fulfilmentMode !== 'self_dropoff' &&
      order.acceptedStatus &&
      !order.pickUpStatus &&
      order.pickupDate === moment().format('ddd, D MMM YYYY')
  );

  const filteredOrders = orders.filter((order) => {
    if (selectedFilters.includes('all')) return true;

    return selectedFilters.every((value) => {
      if (value === 'accepted') return order.acceptedStatus;
      if (value === 'pickedUp') return order.pickUpStatus;
      if (value === 'delivered') return order.deliveredStatus;
      if (value === 'paid') return order.paid;
      return true;
    });
  });

  if (loading) {
    return (
      <Center>
        <Spinner size="xl" />
      </Center>
    );
  }

  if (error) {
    return handleToast('Error', 'Please Login again', 'error');
  }

  return (
    <VStack
      align="start"
      gap={{ base: 8, md: 12 }}
      ml={{ base: '0', md: '8rem' }}
      w="100%"
    >
      <Text fontSize={{ base: '1.5rem', md: '2rem' }} fontWeight="bold">
        Order Details:
      </Text>
      {todaysPickups.length > 0 && (
        <Alert status="info" borderRadius="md" w="auto">
          <AlertIcon />
          You have {todaysPickups.length} home pickup
          {todaysPickups.length > 1 ? 's' : ''} to collect today.
        </Alert>
      )}
      <CheckboxGroup>
        <HStack
          gap={8}
          overflowX="scroll"
          css={{
            '&::-webkit-scrollbar': {
              display: 'none',
            },
            'scrollbar-width': 'none',
          }}
        >
          <Checkbox
            isChecked={selectedFilters.includes('all')}
            onChange={() => handleFilterChange('all')}
          >
            All
          </Checkbox>
          <Checkbox
            isChecked={selectedFilters.includes('accepted')}
            onChange={() => handleFilterChange('accepted')}
          >
            Accepted
          </Checkbox>
          <Checkbox
            isChecked={selectedFilters.includes('pickedUp')}
            onChange={() => handleFilterChange('pickedUp')}
          >
            Picked Up
          </Checkbox>
          <Checkbox
            isChecked={selectedFilters.includes('delivered')}
            onChange={() => handleFilterChange('delivered')}
          >
            Delivered
          </Checkbox>
          <Checkbox
            onChange={() => handleFilterChange('paid')}
            isChecked={selectedFilters.includes('paid')}
          >
            Paid
          </Checkbox>
        </HStack>
      </CheckboxGroup>
      <Box
        w={{ base: '100%', md: '75vw' }}
        overflowX="scroll"
        css={{
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          'scrollbar-width': 'none',
        }}
      >
        <Box maxH="70vh" overflowY="scroll">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th textAlign="center">Order ID</Th>
                <Th textAlign="center">Order Total</Th>
                <Th textAlign="center">Student Username</Th>
                <Th textAlign="center">Hostel</Th>
                <Th textAlign="center">Delivery Date</Th>
                <Th textAlign="center">Pickup Status</Th>
                <Th textAlign="center">Payment Status</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredOrders.map((order) => (
                <Tr key={order._id}>
                  <Td textAlign="center">{order._id}</Td>
                  <Td textAlign="center">₹{order.orderTotal}</Td>
                  <Td textAlign="center">{order.user.username}</Td>
                  <Td textAlign="center">{order.user.hostel}</Td>
                  <Td textAlign="center">{order.deliveryDate}</Td>
                  <Td textAlign="center">
                    <Tag
                      size="lg"
                      colorScheme={order.pickUpStatus ? 'green' : 'red'}
                    >
                      {order.pickUpStatus ? 'Picked Up' : 'Not Picked Up'}
                    </Tag>
                  </Td>
                  <Td textAlign="center">
                    <Tag size="lg" colorScheme={order.paid ? 'green' : 'red'}>
                      {order.paid ? 'Paid' : 'Not Paid'}
                    </Tag>
                  </Td>
                  <Td textAlign="center">
                    <Button
                      color="#ce1567"
                      onClick={() => handleCardClick(order)}
                    >
                      View Details
                    </Button>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>
      {/* Order Details Modal */}
      {selectedOrder && (
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent
            width="90%"
            border="2px solid #ce1567"
            borderRadius="0.5rem"
          >
            <ModalHeader />
            <ModalCloseButton />
            <ModalBody>
              <Text fontSize="xl" fontWeight="bold">
                Order ID: {selectedOrder._id}
              </Text>
              <Divider my={2} />
              <Text fontSize="lg" fontWeight="bold" color="purple.500">
                Student Details:
              </Text>
              <Divider my={2} />
              <Grid
                templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }}
                gap={2}
              >
                <GridItem>
                  <Text>
                    <strong>Student Username:</strong>{' '}
                    {selectedOrder.user.username}
                  </Text>
                </GridItem>
                <GridItem>
                  <Text>
                    <strong>Contact No.:</strong>{' '}
                    {selectedOrder.user.phone_number}
                  </Text>
                </GridItem>
                <GridItem>
                  <Text>
                    <strong>Hostel:</strong> {selectedOrder.user.hostel}
                  </Text>
                </GridItem>
                <GridItem>
                  <Text>
                    <strong>Room No.:</strong> {selectedOrder.user.room_number}
                  </Text>
                </GridItem>
              </Grid>
              <Divider my={2} />
              <Text fontSize="lg" fontWeight="bold" color="orange.500">
                Order Details:
              </Text>
              <Divider my={2} />
              <Grid
                templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }}
                gap={2}
              >
                <GridItem>
                  <Text>
                    <strong>Pickup Address:</strong>{' '}
                    {selectedOrder.pickupAddress}
                  </Text>
                </GridItem>
                <GridItem>
                  <Text>
                    <strong>Delivery Address:</strong>{' '}
                    {selectedOrder.deliveryAddress}
                  </Text>
                </GridItem>
                <GridItem>
                  <Text>
                    <strong>Pickup Date:</strong> {selectedOrder.pickupDate}
                  </Text>
                </GridItem>
                <GridItem>
                  <Text>
                    <strong>Pickup Time:</strong> {selectedOrder.pickupTime}
                  </Text>
                </GridItem>
                <GridItem>
                  <Text>
                    <strong>Delivery Date:</strong> {selectedOrder.deliveryDate}
                  </Text>
                </GridItem>
                <GridItem>
                  <Text>
                    <strong>Delivery Time:</strong> {selectedOrder.deliveryTime}
                  </Text>
                </GridItem>
                <GridItem>
                  <Text>
                    <strong>Handover:</strong>{' '}
                    {selectedOrder.fulfilmentMode === 'self_dropoff'
                      ? 'Self drop-off'
                      : 'Home pickup'}
                  </Text>
                </GridItem>
              </Grid>
              <Divider my={2} />
              <Grid
                templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }}
                gap={4}
                my={4}
              >
                <GridItem>
                  <Text>
                    <strong>Accepted Status:</strong>
                  </Text>
                  <Tag
                    size="lg"
                    colorScheme={selectedOrder.acceptedStatus ? 'green' : 'red'}
                  >
                    {selectedOrder.acceptedStatus ? 'Accepted' : 'Not Accepted'}
                  </Tag>
                  <Switch
                    size="md"
                    ml={2}
                    colorScheme="green"
                    display={selectedOrder.acceptedStatus ? 'none' : ''}
                    onChange={() =>
                      handleUpdateAcceptedStatus(selectedOrder._id)
                    }
                  />
                </GridItem>
                <GridItem>
                  <Text>
                    <strong>Delivery Status:</strong>
                  </Text>
                  <Tag
                    size="lg"
                    colorScheme={
                      selectedOrder.deliveredStatus ? 'green' : 'red'
                    }
                  >
                    {selectedOrder.deliveredStatus
                      ? 'Delivered'
                      : 'Not Delivered'}
                  </Tag>
                  <Switch
                    size="md"
                    ml={2}
                    colorScheme="green"
                    display={
                      !selectedOrder.pickUpStatus ||
                      !selectedOrder.acceptedStatus ||
                      selectedOrder.deliveredStatus
                        ? 'none'
                        : ''
                    }
                    onChange={() =>
                      handleUpdateDeliveredStatus(selectedOrder._id)
                    }
                  />
                </GridItem>
                <GridItem>
                  <Text>
                    <strong>Pickup Status:</strong>
                  </Text>
                  <Tag
                    size="lg"
                    colorScheme={selectedOrder.pickUpStatus ? 'green' : 'red'}
                  >
                    {selectedOrder.pickUpStatus ? 'Picked Up' : 'Not Picked Up'}
                  </Tag>
                </GridItem>
                <GridItem>
                  <Text>
                    <strong>Payment Status:</strong>
                  </Text>
                  <Tag
                    size="lg"
                    colorScheme={selectedOrder.paid ? 'green' : 'red'}
                  >
                    {selectedOrder.paid ? 'Paid' : 'Pending'}
                  </Tag>
                </GridItem>
              </Grid>
              <Divider my={2} />
              <Text fontSize="lg">
                <strong>Order Total: </strong>₹{selectedOrder.orderTotal}
              </Text>
              <Divider my={2} />
              <Text fontSize="lg" fontWeight="bold">
                Items:
              </Text>

              <Accordion allowToggle>
                {[
                  ...new Set(selectedOrder.items.map((item) => item.washType)),
                ].map((washType) => {
                  const itemsByWashType = selectedOrder.items.filter(
                    (item) => item.washType === washType
                  );

                  if (itemsByWashType.length === 0) {
                    return null;
                  }

                  return (
                    <AccordionItem key={washType}>
                      <AccordionButton>
                        <Box
                          flex="1"
                          textAlign="left"
                          fontSize="lg"
                          fontWeight="bold"
                          color="purple.500"
                        >
                          {washType}
                        </Box>
                        <AccordionIcon />
                      </AccordionButton>
                      <AccordionPanel pb={4}>
                        <Table
                          variant="simple"
                          sx={{
                            th: { padding: '8px', textAlign: 'center' },
                            td: { padding: '8px', textAlign: 'center' },
                          }}
                        >
                          <Thead>
                            <Tr>
                              <Th>Name</Th>
                              <Th>Quantity</Th>
                              <Th>Price per Item</Th>
                            </Tr>
                          </Thead>
                          <Tbody>
                            {itemsByWashType.map((item, index) => (
                              <Tr key={index}>
                                <Td>{item.name}</Td>
                                <Td>{item.quantity}</Td>
                                <Td>${item.pricePerItem}</Td>
                              </Tr>
                            ))}
                          </Tbody>
                        </Table>
                      </AccordionPanel>
                    </AccordionItem>
                  );
                })}
              </Accordion>
              <Divider my={2} />
            </ModalBody>
            <ModalFooter>
              <Button
                bg="#ce1567"
                color="#ffffff"
                _hover={{ bg: '#bf0055' }}
                mr={3}
                onClick={onClose}
              >
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </VStack>
  );
}

export default LaundererOrdersDetail;
