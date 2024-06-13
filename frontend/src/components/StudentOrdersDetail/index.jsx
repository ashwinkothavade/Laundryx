import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Center,
  Checkbox,
  CheckboxGroup,
  Divider,
  Flex,
  Grid,
  GridItem,
  HStack,
  IconButton,
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
import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { MdDelete } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../Store/AuthStore';

function OrderDetail() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState(['all']);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();
  const { userName, userHostel, userRollNumber } = useAuthStore((state) => ({
    userName: state.userName,
    userHostel: state.userHostel,
    userRollNumber: state.userRollNumber,
  }));
  const handleToast = (title, description, status) => {
    toast({
      position: 'top',
      title,
      description,
      status,
      duration: 1000,
      isClosable: true,
    });
  };

  useEffect(() => {
    const getOrders = async () => {
      try {
        const response = await axios.get(
          'http://localhost:4000/student/myorders'
        );
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

  const getTotalQuantity = (items) => {
    return items.reduce((total, item) => total + item.quantity, 0);
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

  const handlePayment = async (order) => {
    try {
      const receipt = Math.random().toString(36).substring(7);
      const body = { amount: order.orderTotal * 100, currency: 'INR', receipt };
      const response = await axios.post('http://localhost:4000/payment', body);
      const orderDetails = await response.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderDetails.amount,
        currency: 'INR',
        name: 'LaundriX',
        description: 'Order Payment',
        image: 'http://localhost:5173/assets/favicon.svg',
        order_id: orderDetails.id,
        async handler(resp) {
          try {
            const validatePayment = await axios.put(
              'http://localhost:4000/payment/validate',
              { ...resp, order_id: order._id }
            );
            // eslint-disable-next-line no-unused-vars
            const validateResponse = await validatePayment.data;
            handleToast(
              'Payment Successfully Done and Verified',
              '',
              'success'
            );
            // set the paid field of this order to true in the filteredOrders state
            setOrders((prevOrders) =>
              prevOrders.map((prevOrder) => {
                if (prevOrder._id === order._id) {
                  return { ...prevOrder, paid: true };
                }
                return prevOrder;
              })
            );
          } catch (err) {
            handleToast('Payment Validation Failed', err.message, 'error');
          }
        },
        notes: {
          address: 'IIIT Jabalpur',
        },
        theme: {
          color: '#584BAC',
        },
      };
      const rzp1 = new window.Razorpay(options);
      // eslint-disable-next-line func-names
      rzp1.on('payment.failed', function (result) {
        alert(result.error.code);
        alert(result.error.description);
        alert(result.error.source);
        alert(result.error.step);
        alert(result.error.reason);
        alert(result.error.metadata.order_id);
        alert(result.error.metadata.payment_id);
      });
      rzp1.open();
    } catch (err) {
      handleToast('Payment Failed', err.message, 'error');
    }
  };

  const handleUpdatePickupStatus = async (order_id) => {
    try {
      const response = await axios.put(
        `http://localhost:4000/student/updatepickupstatus/${order_id}`,
        {}
      );
      if (response.status === 200) {
        const notification = {
          student: userName,
          launderer: selectedOrder.launderer,
          message: `Order of ${userName} with roll: ${userRollNumber} of ${userHostel} picked up successfully.`,
          orderId: '',
        };
        const notifResponse = await axios.post(
          'http://localhost:4000/notifications',
          notification
        );
        if (notifResponse.status !== 500) {
          console.log(notifResponse);
        }
        setOrders((prevOrders) => {
          return prevOrders.map((order) => {
            if (order._id === order_id) {
              return { ...order, pickUpStatus: true };
            }
            return order;
          });
        });
        onClose();
      }
    } catch (err) {
      handleToast('Error Updating Pickup Status', err.message, 'error');
    }
  };

  const deleteOrder = async (order_id) => {
    try {
      const response = await axios.delete(
        `http://localhost:4000/student/deleteorder/${order_id}`,
        { withCredentials: true }
      );
      if (response.status === 200) {
        handleToast('Order Deleted Successfully', '', 'success');
        setOrders((prevOrders) =>
          prevOrders.filter((order) => order._id !== order_id)
        );
      }
    } catch (err) {
      handleToast(
        'Error Deleting Order',
        err.message || err.error.message,
        'error'
      );
    }
  };

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
    toast({
      position: 'top',
      title: 'Error',
      description: 'Please login again',
      status: 'error',
      duration: 1000,
      isClosable: true,
      onCloseComplete: () => {
        navigate('/login');
      },
    });
  }

  return (
    <VStack align="start" gap={14} ml="8rem">
      <Text fontSize="2rem" fontWeight="bold">
        Order Details:
      </Text>
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
        w="75vw"
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
                <Th textAlign="center">Pickup Date</Th>
                <Th textAlign="center">Total Items</Th>
                <Th textAlign="center">Accepted Status</Th>
                <Th textAlign="center">Delivery Status</Th>
                <Th textAlign="center">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredOrders.map((order) => (
                <Tr key={order._id}>
                  <Td textAlign="center">{order._id}</Td>
                  <Td textAlign="center">₹{order.orderTotal}</Td>
                  <Td textAlign="center">{order.pickupDate}</Td>
                  <Td textAlign="center">{getTotalQuantity(order.items)}</Td>
                  <Td textAlign="center">
                    <Tag
                      size="lg"
                      colorScheme={order.acceptedStatus ? 'green' : 'red'}
                    >
                      {order.acceptedStatus ? 'Accepted' : 'Not Accepted'}
                    </Tag>
                  </Td>
                  <Td textAlign="center">
                    <Tag
                      size="lg"
                      colorScheme={order.deliveredStatus ? 'green' : 'red'}
                    >
                      {order.deliveredStatus ? 'Delivered' : 'Not Delivered'}
                    </Tag>
                  </Td>
                  <Td textAlign="center">
                    <Flex gap={4} w="fit-content">
                      <Button
                        color="#ce1567"
                        onClick={() => handleCardClick(order)}
                      >
                        View Details
                      </Button>
                      <Button
                        color="#ffffff"
                        bgColor="green.500"
                        isDisabled={order.paid}
                        display={
                          !order.acceptedStatus || !order.pickUpStatus
                            ? 'none'
                            : 'block'
                        }
                        _hover={{ bgColor: 'green.600' }}
                        onClick={() => handlePayment(order)}
                      >
                        Pay
                      </Button>
                      <IconButton
                        colorScheme="red"
                        aria-label="Delete Order"
                        icon={<MdDelete size={24} />}
                        // button should be abled either when the order is not accepted, or when the order is paid and delivered.
                        isDisabled={
                          order.acceptedStatus &&
                          (!order.paid || !order.deliveredStatus)
                        }
                        onClick={() => deleteOrder(order._id)}
                      />
                    </Flex>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      </Box>

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
              <Text fontSize="xl" fontWeight="bold">
                <strong>Order Total:</strong> ${selectedOrder.orderTotal}
              </Text>
              <Divider my={2} />
              <Grid templateColumns="repeat(2, 1fr)" gap={4}>
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
              </Grid>
              <Divider my={2} />
              <Grid templateColumns="repeat(2, 1fr)" gap={4} my={4}>
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
                  <Switch
                    size="md"
                    ml={2}
                    colorScheme="green"
                    display={
                      !selectedOrder.acceptedStatus ||
                      selectedOrder.pickUpStatus
                        ? 'none'
                        : ''
                    }
                    onChange={() => handleUpdatePickupStatus(selectedOrder._id)}
                  />
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
              <Text fontSize="xl" fontWeight="bold" mb={2}>
                Items
              </Text>
              <Accordion allowToggle>
                {['simple_wash', 'power_clean', 'dry_clean'].map((washType) => {
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
                          color={
                            washType === 'simple_wash'
                              ? 'blue.500'
                              : washType === 'power_clean'
                                ? 'orange.500'
                                : 'purple.500'
                          }
                        >
                          {washType === 'simple_wash'
                            ? 'Simple Wash'
                            : washType === 'power_clean'
                              ? 'Power Clean'
                              : 'Dry Clean'}
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
              <Button colorScheme="blue" mr={3} onClick={onClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </VStack>
  );
}

export default OrderDetail;
