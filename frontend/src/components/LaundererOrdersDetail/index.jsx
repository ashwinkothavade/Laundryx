import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Box,
  Button,
  Center,
  Divider,
  Flex,
  Grid,
  GridItem,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Spinner,
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
import { useNavigate } from 'react-router-dom';

function LaundererOrdersDetail() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('all');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();
  const navigate = useNavigate();
  const handleToast = (title, description, status) => {
    toast({
      position: 'top',
      title,
      description,
      status,
      duration: 5000,
      isClosable: true,
      onCloseComplete: () => {
        if (status === 'error') {
          navigate('/login');
        }
      },
    });
  };
  useEffect(() => {
    const getOrders = async () => {
      try {
        const response = await axios.get('http://localhost:4000/allorders');
        setOrders(response.data.orders);
        setLoading(false);
      } catch (err) {
        console.log(err);
        console.log(err.message);
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

  const handleFilterChange = (e) => {
    setFilter(e.target.value);
  };

  const filteredOrders = orders.filter((order) => {
    if (filter === 'all') return true;
    if (filter === 'accepted') return order.acceptedStatus;
    if (filter === 'notAccepted') return !order.acceptedStatus;
    if (filter === 'delivered') return order.deliveredStatus;
    if (filter === 'notDelivered') return !order.deliveredStatus;
    if (filter === 'paid') return order.paid;
    if (filter === 'notPaid') return !order.paid;
    if (filter === 'pickedUp') return order.pickUpStatus;
    if (filter === 'notPickedUp') return !order.pickUpStatus;
    return true;
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
    <VStack align="start" gap={14} ml="8rem">
      <Flex justify="space-between" align="center" w="100%">
        <Text fontSize="2rem" fontWeight="bold">
          Order Details:
        </Text>
        <Box>
          <Select
            placeholder="Select Filter"
            onChange={handleFilterChange}
            border="2px solid #ce1567"
            _hover={{ border: '2px solid #ce1567' }}
            _focus={{ border: '2px solid #ce1567' }}
          >
            <option value="all">All</option>
            <option value="accepted">Accepted</option>
            <option value="notAccepted">Not Accepted</option>
            <option value="delivered">Delivered</option>
            <option value="notDelivered">Not Delivered</option>
            <option value="paid">Paid</option>
            <option value="notPaid">Not Paid</option>
            <option value="pickedUp">Picked Up</option>
            <option value="notPickedUp">Not Picked Up</option>
          </Select>
        </Box>
      </Flex>
      <Box w="75vw" overflowX="auto">
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
                      colorScheme={order.pickupStatus ? 'green' : 'red'}
                    >
                      {order.pickupStatus ? 'Picked Up' : 'Not Picked Up'}
                    </Tag>
                  </Td>
                  <Td textAlign="center">
                    <Tag
                      size="lg"
                      colorScheme={order.paidStatus ? 'green' : 'red'}
                    >
                      {order.paidStatus ? 'Paid' : 'Not Paid'}
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
            // width="90%"
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
              <Grid templateColumns="repeat(2, 1fr)" gap={2}>
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
              <Grid templateColumns="repeat(2, 1fr)" gap={2}>
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
