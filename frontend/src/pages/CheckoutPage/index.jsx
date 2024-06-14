import { Center, Flex, Text } from '@chakra-ui/react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Helmet } from 'react-helmet-async';
import Navbar from '../../components/Navbar';
import OrderItemsAccordion from '../../components/OrderItemsAccordion';
import ScheduleCard from '../../components/ScheduleForm';

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
      <Flex justify="center" align="center" gap="6rem" mt="5rem">
        <OrderItemsAccordion />
        <ScheduleCard />
      </Flex>
    </>
  );
}
export default CheckoutPage;
