import { Center, Flex, Text } from '@chakra-ui/react';
import Navbar from '../../components/Navbar';
import OrderItemsAccordion from '../../components/OrderItemsAccordion';
import ScheduleCard from '../../components/ScheduleForm';

function CheckoutPage() {
  return (
    <>
      <Navbar />
      <Center>
        <Text mt="6rem" fontWeight={600} fontSize="2rem">
          Select & Add Items
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
