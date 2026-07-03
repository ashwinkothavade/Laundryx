import {
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Select,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { FaTruckPickup, FaUser } from 'react-icons/fa';
import { FaLocationCrosshairs, FaLocationDot } from 'react-icons/fa6';
import { TbTruckDelivery } from 'react-icons/tb';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../Store/AuthStore';
import useOrderStore from '../Store/OrderStore';
import {
  createOrder,
  getLaundererCatalog,
  getSettings,
  postNotif,
} from '../../utils/apis';

function ScheduleCard() {
  const {
    clearSchedule,
    order,
    setPickupDate,
    setPickupTime,
    setDeliveryTime,
    setPickupAddress,
    setDeliveryAddress,
    setFulfilmentMode,
    clearItems,
  } = useOrderStore((state) => ({
    clearSchedule: state.clearSchedule,
    order: state.order,
    setPickupDate: state.setPickupDate,
    setPickupTime: state.setPickupTime,
    setDeliveryTime: state.setDeliveryTime,
    setPickupAddress: state.setPickupAddress,
    setDeliveryAddress: state.setDeliveryAddress,
    setFulfilmentMode: state.setFulfilmentMode,
    clearItems: state.clearItems,
  }));
  const isHomePickup = order.fulfilmentMode !== 'self_dropoff';
  const { userName, userHostel, userRollNumber } = useAuthStore((state) => ({
    userName: state.userName,
    userHostel: state.userHostel,
    userRollNumber: state.userRollNumber,
  }));

  // Locations and time slots come from the admin-managed dynamic settings
  // (nothing hardcoded).
  const [locations, setLocations] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);

  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await getSettings();
        setLocations(res.data.settings?.locations || []);
        let slots = res.data.settings?.timeSlots || [];
        // Prefer the chosen launderer's own available slots if they set any.
        if (order.launderer) {
          try {
            const cat = await getLaundererCatalog(order.launderer);
            if (cat.data.availableTimeSlots?.length) {
              slots = cat.data.availableTimeSlots;
            }
          } catch (e) {
            // ignore — fall back to global slots
          }
        }
        setTimeSlots(slots);
      } catch (err) {
        // Non-fatal — the selects will just be empty until settings load.
      }
    };
    loadSettings();
  }, [order.launderer]);

  const handleToast = (title, description, status) => {
    toast({
      position: 'top',
      title,
      description,
      status,
      duration: 2000,
      isClosable: true,
    });
  };

  const handleConfirmSchedule = () => {
    // Values are written to the (persisted) store live via each Select's
    // onChange, so here we only validate that everything is filled.
    const addressesOk =
      !isHomePickup || (order.pickupAddress && order.deliveryAddress);
    if (
      !order.pickupDate ||
      !order.pickupTime ||
      !order.deliveryTime ||
      !addressesOk ||
      !order.launderer
    ) {
      handleToast('Please confirm all the details.', '', 'error');
      return;
    }
    handleToast(
      'All schedule details are added.',
      'Order can now be confirmed and placed.',
      'success'
    );
  };

  const handleConfirmOrder = async (e) => {
    e.preventDefault();
    if (userHostel === '' || userRollNumber === '') {
      handleToast(
        'Incomplete Details',
        'Please complete your profile to place an order.',
        'error'
      );
      return;
    }
    const addressesOk =
      !isHomePickup || (order.pickupAddress && order.deliveryAddress);
    if (
      !order.pickupDate ||
      !order.pickupTime ||
      !order.deliveryTime ||
      !addressesOk ||
      !order.launderer
    ) {
      handleToast('Please confirm all schedule details.', '', 'error');
      return;
    }
    const notification = {
      student: userName,
      launderer: order.launderer,
      message: `New order placed by ${userName} of ${userHostel}, roll: ${userRollNumber}`,
      orderId: '',
    };
    try {
      // eslint-disable-next-line no-unused-vars
      const response = await createOrder(order);
      handleToast(
        'Order placed successfully',
        'Wait for launderer to accept your order',
        'success'
      );

      const notifResponse = await postNotif(notification);
      if (notifResponse.status !== 500) {
        console.log(notifResponse);
      }
      clearSchedule();
      clearItems();
      navigate('/OrderList');
    } catch (err) {
      handleToast('Error', err.response.data.message, 'error');
    }
  };

  return (
    <Stack align="center" gap={6}>
      <Stack
        border="2px solid gray"
        boxShadow="0px 0px 20px 0px rgba(0, 0, 0, 0.20)"
        borderRadius="1rem"
        w={{ base: '20rem', md: '32rem' }}
        py="1.5rem"
        px={{ base: '1.5rem', md: '2.5rem' }}
        gap={3}
      >
        <Text color="#CE1567" fontWeight={600}>
          How would you like to hand over your laundry?
        </Text>
        <Flex gap={3} direction={{ base: 'column', sm: 'row' }}>
          <Button
            flex="1"
            variant={isHomePickup ? 'solid' : 'outline'}
            bg={isHomePickup ? '#584BAC' : 'transparent'}
            color={isHomePickup ? 'white' : '#584BAC'}
            borderColor="#584BAC"
            _hover={{ bg: isHomePickup ? '#4c4196' : '#f0edfa' }}
            onClick={() => setFulfilmentMode('home_pickup')}
          >
            Home pickup
          </Button>
          <Button
            flex="1"
            variant={!isHomePickup ? 'solid' : 'outline'}
            bg={!isHomePickup ? '#584BAC' : 'transparent'}
            color={!isHomePickup ? 'white' : '#584BAC'}
            borderColor="#584BAC"
            _hover={{ bg: !isHomePickup ? '#4c4196' : '#f0edfa' }}
            onClick={() => setFulfilmentMode('self_dropoff')}
          >
            Drop off at launderer
          </Button>
        </Flex>
        <Text fontSize="sm" color="gray.500">
          {isHomePickup
            ? 'The launderer will collect from and deliver to your address.'
            : 'You will drop your laundry at the launderer and collect it there. No address needed.'}
        </Text>
      </Stack>
      <Flex
        direction={{ base: 'column', md: 'row' }}
        border="2px solid gray"
        boxShadow="0px 0px 20px 0px rgba(0, 0, 0, 0.20)"
        borderRadius="1rem"
        justify="center"
        w={{ base: '20rem', md: '32rem' }}
        py="2rem"
        px={{ base: '2rem', md: '2.5rem' }}
        gap={{ base: 6, md: 8 }}
      >
        <Flex
          direction="column"
          justify="space-between"
          align="start"
          gap={{ base: 4, md: '' }}
        >
          <Flex align="center" gap={2}>
            <FaTruckPickup color="#CE1567" size="25" />
            <Text color="#CE1567" fontWeight={600}>
              Pickup Schedule
            </Text>
          </Flex>
          <Select
            placeholder="Select Date"
            border="2px solid #584BAC"
            w="auto"
            value={order.pickupDate}
            onChange={(e) => setPickupDate(e.target.value)}
            _hover={{ border: '2px solid #584BAC' }}
            _focus={{ border: '2px solid #584BAC' }}
          >
            <option value={moment().format('ddd, D MMM YYYY')}>
              {moment().format('ddd, D MMM YYYY')}
            </option>
            <option value={moment().add(1, 'days').format('ddd, D MMM YYYY')}>
              {moment().add(1, 'days').format('ddd, D MMM YYYY')}
            </option>
            <option value={moment().add(2, 'days').format('ddd, D MMM YYYY')}>
              {moment().add(2, 'days').format('ddd, D MMM YYYY')}
            </option>
          </Select>
          <Select
            placeholder="Select Time"
            border="2px solid #584BAC"
            w="auto"
            value={order.pickupTime}
            onChange={(e) => setPickupTime(e.target.value)}
            _hover={{ border: '2px solid #584BAC' }}
            _focus={{ border: '2px solid #584BAC' }}
          >
            {timeSlots.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Flex>
        <Divider
          orientation={{ base: 'horizontal', md: 'vertical' }}
          border="1px solid gray"
          height={{ base: '', md: '9rem' }}
        />
        <Flex
          direction="column"
          justify="space-between"
          align="start"
          gap={{ base: 4, md: '' }}
        >
          <Flex align="center" gap={2}>
            <TbTruckDelivery color="#CE1567" size="25" />
            <Text color="#CE1567" fontWeight={600}>
              Delivery Schedule
            </Text>
          </Flex>
          <Text>{order.deliveryDate}</Text>
          <Select
            placeholder="Select Time"
            border="2px solid #584BAC"
            w="auto"
            value={order.deliveryTime}
            onChange={(e) => setDeliveryTime(e.target.value)}
            _hover={{ border: '2px solid #584BAC' }}
            _focus={{ border: '2px solid #584BAC' }}
          >
            {timeSlots.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </Flex>
      </Flex>
      <Stack
        border="2px solid gray"
        boxShadow="0px 0px 20px 0px rgba(0, 0, 0, 0.20)"
        borderRadius="1rem"
        w={{ base: '20rem', md: '32rem' }}
        py="2rem"
        px={{ base: '1.5rem', md: '2.5rem' }}
        gap={4}
      >
        {isHomePickup && (
          <>
            <Flex align="center" justify="space-between">
              <HStack gap={2}>
                <Box display={{ base: 'none', md: 'block' }}>
                  <FaLocationDot color="#CE1567" size="20" />
                </Box>
                <Text color="#CE1567" fontWeight={600}>
                  Pickup Address
                </Text>
              </HStack>
              <Select
                placeholder="Select location"
                border="2px solid #584BAC"
                w={{ base: '9rem', md: 'auto' }}
                value={order.pickupAddress}
                onChange={(e) => setPickupAddress(e.target.value)}
                _hover={{ border: '2px solid #584BAC' }}
                _focus={{ border: '2px solid #584BAC' }}
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </Select>
            </Flex>
            <Flex align="center" justify="space-between">
              <HStack gap={2}>
                <Box display={{ base: 'none', md: 'block' }}>
                  <FaLocationCrosshairs color="#CE1567" size="20" />
                </Box>
                <Text color="#CE1567" fontWeight={600}>
                  Delivery Address
                </Text>
              </HStack>
              <Select
                placeholder="Select location"
                border="2px solid #584BAC"
                w={{ base: '9rem', md: 'auto' }}
                value={order.deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                _hover={{ border: '2px solid #584BAC' }}
                _focus={{ border: '2px solid #584BAC' }}
              >
                {locations.map((loc) => (
                  <option key={loc} value={loc}>
                    {loc}
                  </option>
                ))}
              </Select>
            </Flex>
          </>
        )}
        <Flex align="center" justify="space-between">
          <HStack gap={2}>
            <Box display={{ base: 'none', md: 'block' }}>
              <FaUser color="#CE1567" size="20" />
            </Box>
            <Text color="#CE1567" fontWeight={600}>
              Launderer
            </Text>
          </HStack>
          <Text fontWeight={600} color="#584BAC">
            {order.launderer || 'Not selected'}
          </Text>
        </Flex>
      </Stack>
      <HStack gap={{ base: 4, sm: 6, md: 8 }}>
        <Button
          bg="#CE1567"
          color="#FFFFFF"
          _hover={{ bg: '#bf0055' }}
          onClick={handleConfirmSchedule}
        >
          Confirm Schedule
        </Button>
        <Button
          bg="#CE1567"
          color="#FFFFFF"
          _hover={{ bg: '#bf0055' }}
          onClick={handleConfirmOrder}
        >
          Confirm Order
        </Button>
      </HStack>
    </Stack>
  );
}

export default ScheduleCard;
