import {
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
import React, { useRef } from 'react';
import { FaTruckPickup } from 'react-icons/fa';
import { FaLocationCrosshairs, FaLocationDot } from 'react-icons/fa6';
import { TbTruckDelivery } from 'react-icons/tb';

import useGeneralOrderStore from '../Store/OrderStore_';
import useAuthStore from '../Store/AuthStore';

function ScheduleCard() {
  const {
    setPickupDate,
    setPickupTime,
    setDeliveryTime,
    setPickupAddress,
    setDeliveryAddress,
  } = useGeneralOrderStore();
  const { userHostel } = useAuthStore((state) => ({
    userHostel: state.userHostel,
  }));
  const pickupDateRef = useRef();
  const pickupTimeRef = useRef();
  const deliveryTimeRef = useRef();
  const pickupAddressRef = useRef();
  const deliveryAddressRef = useRef();

  const toast = useToast();

  const handleToast = (title, description, status) => {
    toast({
      position: 'top',
      title,
      description,
      status,
      isClosable: true,
    });
  };

  const handleConfirmOrder = () => {
    if (userHostel === '') {
      handleToast(
        'Incomplete Details',
        'Please complete your profile to place an order.',
        'error'
      );
      return;
    }
    if (
      !pickupDateRef.current.value ||
      !pickupTimeRef.current.value ||
      !deliveryTimeRef.current.value ||
      !pickupAddressRef.current.value ||
      !deliveryAddressRef.current.value
    ) {
      handleToast('Please fill all the fields.', '', 'error');
      return;
    }
    setPickupDate(pickupDateRef.current.value);
    setPickupTime(pickupTimeRef.current.value);
    setDeliveryTime(deliveryTimeRef.current.value);
    setPickupAddress(pickupAddressRef.current.value);
    setDeliveryAddress(deliveryAddressRef.current.value);
  };

  return (
    <Stack align="center" gap={6}>
      <Flex
        border="2px solid gray"
        boxShadow="0px 0px 20px 0px rgba(0, 0, 0, 0.20)"
        borderRadius="1rem"
        w="32rem"
        py="2rem"
        px="2.5rem"
        gap={8}
      >
        <Flex direction="column" justify="start" align="center" gap={4}>
          <Flex align="center" gap={2}>
            <FaTruckPickup color="#CE1567" size="25" />
            <Text color="#CE1567" fontWeight={600}>
              Pickup Schedule
            </Text>
          </Flex>
          <Select
            placeholder="Select Pickup Date"
            border="2px solid #584BAC"
            w="auto"
            ref={pickupDateRef}
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
            placeholder="Select Pickup Time"
            border="2px solid #584BAC"
            w="auto"
            ref={pickupTimeRef}
            _hover={{ border: '2px solid #584BAC' }}
            _focus={{ border: '2px solid #584BAC' }}
          >
            <option value="12:00 PM">12:00 PM</option>
            <option value="04:00 PM">04:00 PM</option>
            <option value="07:00 PM">07:00 PM</option>
          </Select>
        </Flex>
        <Divider orientation="vertical" border="1px solid gray" height="9rem" />
        <Flex direction="column" justify="start" align="center" gap={4}>
          <Flex align="center" gap={2}>
            <TbTruckDelivery color="#CE1567" size="25" />
            <Text color="#CE1567" fontWeight={600}>
              Delivery Schedule
            </Text>
          </Flex>
          <Select
            placeholder="Select Time"
            border="2px solid #584BAC"
            w="auto"
            ref={deliveryTimeRef}
            _hover={{ border: '2px solid #584BAC' }}
            _focus={{ border: '2px solid #584BAC' }}
          >
            <option value="12:00 PM">12:00 PM</option>
            <option value="04:00 PM">04:00 PM</option>
            <option value="07:00 PM">07:00 PM</option>
          </Select>
        </Flex>
      </Flex>
      <Stack
        border="2px solid gray"
        boxShadow="0px 0px 20px 0px rgba(0, 0, 0, 0.20)"
        borderRadius="1rem"
        w="32rem"
        py="2rem"
        px="2.5rem"
        gap={4}
      >
        <Flex align="center" justify="space-between">
          <HStack gap={2}>
            <FaLocationDot color="#CE1567" size="20" />
            <Text color="#CE1567" fontWeight={600}>
              Pickup Address
            </Text>
          </HStack>
          <Select
            placeholder="Select location"
            border="2px solid #584BAC"
            w="auto"
            ref={pickupAddressRef}
            _hover={{ border: '2px solid #584BAC' }}
            _focus={{ border: '2px solid #584BAC' }}
          >
            <option value="H1">H1</option>
            <option value="H3">H3</option>
            <option value="H4">H4</option>
            <option value="Panini">Panini</option>
            <option value="Nagarjuna">Nagarjuna</option>
            <option value="Maa Saraswati">Maa Saraswati</option>
          </Select>
        </Flex>
        <Flex align="center" justify="space-between">
          <HStack gap={2}>
            <FaLocationCrosshairs color="#CE1567" size="20" />
            <Text color="#CE1567" fontWeight={600}>
              Delivery Address
            </Text>
          </HStack>
          <Select
            placeholder="Select location"
            border="2px solid #584BAC"
            w="auto"
            ref={deliveryAddressRef}
            _hover={{ border: '2px solid #584BAC' }}
            _focus={{ border: '2px solid #584BAC' }}
          >
            <option value="H1">H1</option>
            <option value="H3">H3</option>
            <option value="H4">H4</option>
            <option value="Panini">Panini</option>
            <option value="Nagarjuna">Nagarjuna</option>
            <option value="Maa Saraswati">Maa Saraswati</option>
          </Select>
        </Flex>
      </Stack>
      <Button
        bg="#CE1567"
        color="#FFFFFF"
        _hover={{ bg: '#bf0055' }}
        onClick={handleConfirmOrder}
      >
        Confirm Order
      </Button>
    </Stack>
  );
}

export default ScheduleCard;
