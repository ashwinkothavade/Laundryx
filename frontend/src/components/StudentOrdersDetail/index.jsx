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
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  useToast,
} from '@chakra-ui/react';
import React, { useEffect, useRef, useState } from 'react';
import { MdDelete } from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../Store/AuthStore';
import {
  cancelOrder,
  deleteOrder,
  getStudentOrders,
  makePayment,
  postNotif,
  updatePickupStatus,
  validatePayment,
} from '../../utils/apis';
import {
  formatCurrency,
  formatDate,
  orderStatus,
  paidStatus,
  shortOrderRef,
} from '../../utils/format';
import { getApiErrorMessage } from '../../utils/errors';
import { useAsyncAction } from '../../hooks/useAsyncAction';
import EmptyState from '../EmptyState';
import RateOrderModal from '../RateOrderModal';
import RescheduleModal from '../RescheduleModal';
import OrderTimeline from '../OrderTimeline';
import InvoiceModal from '../InvoiceModal';

function OrderDetail() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState(['all']);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const rate = useDisclosure();
  const reschedule = useDisclosure();
  const invoice = useDisclosure();
  const [orderToRate, setOrderToRate] = useState(null);
  const [orderToReschedule, setOrderToReschedule] = useState(null);
  const [orderForInvoice, setOrderForInvoice] = useState(null);
  const [reviewedIds, setReviewedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();
  const { run, isPending, busy } = useAsyncAction();
  const navigate = useNavigate();
  const { userName, userHostel } = useAuthStore((state) => ({
    userName: state.userName,
    userHostel: state.userHostel,
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
        const response = await getStudentOrders();
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
      // Send only which order is being paid for. The server reads the amount
      // from that order, so nothing here can change what is charged.
      const response = await makePayment({ orderId: order._id });
      const orderDetails = await response.data;

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderDetails.amount,
        currency: 'INR',
        name: 'LaundriX',
        description: 'Order Payment',
        image: `${window.location.origin}/assets/favicon.svg`,
        order_id: orderDetails.id,
        async handler(resp) {
          try {
            // The server resolves which order this settles from the
            // signed razorpay_order_id; it does not take our word for it.
            await validatePayment(resp);
            const notification = {
              student: userName,
              launderer: order.launderer,
              message: `Order Total of order ${order._id} of ${userName} paid successfully.`,
              orderId: '',
            };
            const notifResponse = await postNotif(notification);
            if (notifResponse.status !== 500) {
              console.log(notifResponse);
            }
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
      rzp1.on('payment.failed', (result) => {
        handleToast(
          'Payment Failed',
          result.error?.description || 'Please try again.',
          'error'
        );
      });
      rzp1.open();
    } catch (err) {
      handleToast('Payment Failed', err.message, 'error');
    }
  };

  const handleUpdatePickupStatus = async (order_id) => {
    try {
      const response = await updatePickupStatus(order_id);
      if (response.status === 200) {
        const notification = {
          student: userName,
          launderer: selectedOrder.launderer,
          message: `Order ${order_id} of ${userName} of ${userHostel} picked up successfully.`,
          orderId: '',
        };
        const notifResponse = await postNotif(notification);
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

  // Deleting an order is irreversible — the server hard-deletes it. A single
  // click on a small red icon should not be able to do that.
  const [orderToDelete, setOrderToDelete] = useState(null);
  const confirmDelete = useDisclosure();
  const cancelDeleteRef = useRef(null);

  const handleDeleteOrder = async (order_id) => {
    try {
      const response = await deleteOrder(order_id);
      if (response.status === 200) {
        handleToast('Order Deleted Successfully', '', 'success');
        setOrders((prevOrders) =>
          prevOrders.filter((order) => order._id !== order_id)
        );
      }
    } catch (err) {
      handleToast('Error Deleting Order', getApiErrorMessage(err), 'error');
    }
  };

  const handleCancelOrder = async (order_id) => {
    try {
      const response = await cancelOrder(order_id);
      if (response.status === 200) {
        handleToast('Order Cancelled', '', 'success');
        setOrders((prevOrders) =>
          prevOrders.filter((order) => order._id !== order_id)
        );
        onClose();
      }
    } catch (err) {
      handleToast(
        'Could not cancel order',
        err.response?.data?.message || '',
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
    <VStack align="start" gap={{ base: 8, md: 14 }} w="100%" minW={0}>
      <Text fontSize={{ base: '1.5rem', md: '2rem' }} fontWeight="bold">
        Your Orders
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
      <Box w="100%" maxW="100%" overflowX="auto">
        <Box maxH="70vh" overflowY="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Order</Th>
                <Th isNumeric>Total</Th>
                <Th>Pickup</Th>
                <Th isNumeric>Items</Th>
                <Th>Status</Th>
                <Th>Payment</Th>
                <Th textAlign="right">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {filteredOrders.map((order) => (
                <Tr key={order._id}>
                  <Td
                    fontFamily="mono"
                    fontSize="sm"
                    title={order._id}
                    whiteSpace="nowrap"
                  >
                    {shortOrderRef(order._id)}
                  </Td>
                  <Td isNumeric whiteSpace="nowrap">
                    {formatCurrency(order.orderTotal)}
                  </Td>
                  <Td whiteSpace="nowrap">{formatDate(order.pickupDate)}</Td>
                  <Td isNumeric>{getTotalQuantity(order.items)}</Td>
                  <Td>
                    <Tag size="sm" colorScheme={orderStatus(order).scheme}>
                      {orderStatus(order).label}
                    </Tag>
                  </Td>
                  <Td>
                    <Tag size="sm" colorScheme={paidStatus(order).scheme}>
                      {paidStatus(order).label}
                    </Tag>
                  </Td>
                  <Td textAlign="right" whiteSpace="nowrap">
                    <Flex gap={2} justify="flex-end" align="center">
                      <Button
                        size="sm"
                        color="#ce1567"
                        onClick={() => handleCardClick(order)}
                      >
                        View Details
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        color="#584BAC"
                        borderColor="#584BAC"
                        onClick={() => {
                          setOrderForInvoice(order);
                          invoice.onOpen();
                        }}
                      >
                        Receipt
                      </Button>
                      <Button
                        size="sm"
                        color="#ffffff"
                        bgColor="green.500"
                        isDisabled={order.paid || busy}
                        display={
                          !order.acceptedStatus || !order.pickUpStatus
                            ? 'none'
                            : 'block'
                        }
                        _hover={{ bgColor: 'green.600' }}
                        isLoading={isPending(`pay-${order._id}`)}
                        loadingText="Opening"
                        onClick={() =>
                          run(`pay-${order._id}`, () => handlePayment(order))
                        }
                      >
                        Pay
                      </Button>
                      <Button
                        size="sm"
                        color="#ffffff"
                        bgColor="#F6AD55"
                        _hover={{ bgColor: '#dd9540' }}
                        display={
                          order.deliveredStatus &&
                          !reviewedIds.includes(order._id)
                            ? 'block'
                            : 'none'
                        }
                        onClick={() => {
                          setOrderToRate(order);
                          rate.onOpen();
                        }}
                      >
                        Rate
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="purple"
                        display={!order.pickUpStatus ? 'block' : 'none'}
                        onClick={() => {
                          setOrderToReschedule(order);
                          reschedule.onOpen();
                        }}
                      >
                        Reschedule
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        colorScheme="orange"
                        display={
                          order.acceptedStatus && !order.pickUpStatus
                            ? 'block'
                            : 'none'
                        }
                        isLoading={isPending(`cancel-${order._id}`)}
                        isDisabled={busy}
                        onClick={() =>
                          run(`cancel-${order._id}`, () =>
                            handleCancelOrder(order._id)
                          )
                        }
                      >
                        Cancel
                      </Button>
                      <IconButton
                        size="sm"
                        colorScheme="red"
                        aria-label="Delete Order"
                        icon={<MdDelete size={20} />}
                        // button should be abled either when the order is not accepted, or when the order is paid and delivered.
                        isDisabled={
                          order.acceptedStatus &&
                          (!order.paid || !order.deliveredStatus)
                        }
                        onClick={() => {
                          setOrderToDelete(order);
                          confirmDelete.onOpen();
                        }}
                      />
                    </Flex>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
          {orders.length === 0 && (
            <EmptyState
              title="No orders yet"
              description="When you place an order it will appear here, with its status and receipt."
            />
          )}
          {orders.length > 0 && filteredOrders.length === 0 && (
            <EmptyState
              title="No orders match these filters"
              description="Clear a filter above to see the rest of your orders."
            />
          )}
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
              <OrderTimeline order={selectedOrder} />
              <Divider my={2} />
              <Text fontSize="xl" fontWeight="bold">
                <strong>Order Total:</strong>{' '}
                {formatCurrency(selectedOrder.orderTotal)}
              </Text>
              <Divider my={2} />
              <Grid
                templateColumns={{ base: '1fr', sm: 'repeat(2, 1fr)' }}
                gap={4}
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
                    <strong>Pickup Date:</strong>{' '}
                    {formatDate(selectedOrder.pickupDate)}
                  </Text>
                </GridItem>
                <GridItem>
                  <Text>
                    <strong>Pickup Time:</strong> {selectedOrder.pickupTime}
                  </Text>
                </GridItem>
                <GridItem>
                  <Text>
                    <strong>Delivery Date:</strong>{' '}
                    {formatDate(selectedOrder.deliveryDate)}
                  </Text>
                </GridItem>
                <GridItem>
                  <Text>
                    <strong>Delivery Time:</strong> {selectedOrder.deliveryTime}
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
              <Button colorScheme="blue" mr={3} onClick={onClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}

      <RateOrderModal
        isOpen={rate.isOpen}
        onClose={rate.onClose}
        order={orderToRate}
        onRated={(id) => setReviewedIds((prev) => [...prev, id])}
      />

      <RescheduleModal
        isOpen={reschedule.isOpen}
        onClose={reschedule.onClose}
        order={orderToReschedule}
        onRescheduled={(updated) =>
          setOrders((prev) =>
            prev.map((o) => (o._id === updated._id ? updated : o))
          )
        }
      />

      <InvoiceModal
        isOpen={invoice.isOpen}
        onClose={invoice.onClose}
        order={orderForInvoice}
      />

      <AlertDialog
        isOpen={confirmDelete.isOpen}
        leastDestructiveRef={cancelDeleteRef}
        onClose={confirmDelete.onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete order {shortOrderRef(orderToDelete?._id)}?
            </AlertDialogHeader>
            <AlertDialogBody>
              This permanently removes the order and its receipt. It cannot be
              undone.
            </AlertDialogBody>
            <AlertDialogFooter gap={3}>
              <Button ref={cancelDeleteRef} onClick={confirmDelete.onClose}>
                Keep order
              </Button>
              <Button
                colorScheme="red"
                isLoading={isPending('delete-order')}
                loadingText="Deleting"
                onClick={() => {
                  const id = orderToDelete?._id;
                  confirmDelete.onClose();
                  setOrderToDelete(null);
                  if (id) run('delete-order', () => handleDeleteOrder(id));
                }}
              >
                Delete order
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </VStack>
  );
}

export default OrderDetail;
