import { Center, Flex, Text } from '@chakra-ui/react';

import { Helmet } from 'react-helmet-async';
import Navbar from '../../components/Navbar';
import OrderItemsAccordion from '../../components/OrderItemsAccordion';
import ScheduleCard from '../../components/ScheduleCard';

function CheckoutPage() {
  return (
    <>
      <Helmet>
        <title>LaundriX - Schedule Order</title>
        <meta name="description" content="" />
      </Helmet>
      <Navbar />
      <Center>
        <Text mt="6rem" fontWeight={600} fontSize="2rem">
          Schedule Your Order
        </Text>
      </Center>
      <Flex
        direction={{ base: 'column-reverse', xl: 'row' }}
        justify="center"
        align="center"
        gap={{ base: '4rem', xl: '8rem' }}
        mt={{ base: '2rem', md: '5rem' }}
        pb={{ base: '4rem', xl: '0' }}
      >
        <OrderItemsAccordion />
        <ScheduleCard />
      </Flex>
    </>
  );
}
export default CheckoutPage;
