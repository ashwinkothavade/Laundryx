import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Text,
  VStack,
  Spinner,
  Center,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Divider,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Select,
  Box,
  Flex,
  Tag,
  Grid,
  GridItem,
  Accordion,
  AccordionItem,
  AccordionButton,
  AccordionPanel,
  AccordionIcon,
} from '@chakra-ui/react';

function OrderDetail() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('all');
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  const handleFilterChange = (event) => {
    setFilter(event.target.value);
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
    return (
      <Center>
        <Text>Error: {error}</Text>
      </Center>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      <Text fontSize="2xl" fontWeight="bold">
        Order Details:
      </Text>
      <Flex justify="space-between" align="center">
        <Box>{}</Box>
        <Box width="200px">
          <Select
            placeholder="Filter by status"
            onChange={handleFilterChange}
            borderColor="#ce1567"
            _hover={{
              borderColor: '#584BAC',
            }}
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
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th textAlign="center">Order ID</Th>
            <Th textAlign="center">Order Total</Th>
            <Th textAlign="center">Pickup Date</Th>
            <Th textAlign="center">Total Quantity</Th>
            <Th textAlign="center">Accepted Status</Th>
            <Th textAlign="center">Delivery Status</Th>
          </Tr>
        </Thead>
        <Tbody>
          {filteredOrders.map((order) => (
            <Tr key={order._id}>
              <Td textAlign="center">{order._id}</Td>
              <Td textAlign="center">${order.orderTotal}</Td>
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
                <Button color="#ce1567" onClick={() => handleCardClick(order)}>
                  View Details
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>

      {selectedOrder && (
        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent
            width="90%"
            border="2px solid #ce1567"
            borderRadius="0.5rem"
          >
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
              <Accordion allowToggle>
                <AccordionItem>
                  <AccordionButton>
                    <Box
                      flex="1"
                      textAlign="left"
                      fontSize="lg"
                      fontWeight="bold"
                    >
                      Status
                    </Box>
                    <AccordionIcon />
                  </AccordionButton>
                  <AccordionPanel pb={4}>
                    <Grid templateColumns="repeat(2, 1fr)" gap={4}>
                      <GridItem>
                        <Text>
                          <strong>Accepted Status:</strong>
                        </Text>
                        <Tag
                          size="lg"
                          colorScheme={
                            selectedOrder.acceptedStatus ? 'green' : 'red'
                          }
                        >
                          {selectedOrder.acceptedStatus
                            ? 'Accepted'
                            : 'Not Accepted'}
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
                          colorScheme={
                            selectedOrder.pickUpStatus ? 'green' : 'red'
                          }
                        >
                          {selectedOrder.pickUpStatus
                            ? 'Picked Up'
                            : 'Not Picked Up'}
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
                  </AccordionPanel>
                </AccordionItem>
              </Accordion>
              <Divider my={2} />
              <Text fontSize="lg" fontWeight="bold">
                Items:
              </Text>

              {['simple_wash', 'power_clean', 'dry_clean'].map((washType) => {
                const itemsByWashType = selectedOrder.items.filter(
                  (item) => item.washType === washType
                );

                if (itemsByWashType.length === 0) {
                  return null;
                }

                return (
                  <Box key={washType} mt={4}>
                    <Text
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
                    </Text>
                    <Table
                      variant="simple"
                      mt={2}
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
                  </Box>
                );
              })}

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
