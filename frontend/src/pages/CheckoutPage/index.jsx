import { Box, Button, Center, Flex, Stack, Text } from '@chakra-ui/react';
import React from 'react';
import { Helmet } from 'react-helmet-async';
import { MdArrowBack } from 'react-icons/md';
import { Link } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import OrderItemsAccordion from '../../components/OrderItemsAccordion';
import ScheduleCard from '../../components/ScheduleCard';

function CheckoutPage() {
  return (
    <>
      <Helmet>
        <title>LaundriX - Schedule Order</title>
        <meta name="description" content="Schedule your LaundriX order" />
      </Helmet>
      <Navbar />
      {/* Checkout had no way back: changing your mind about an item meant the
          browser's back button or starting over. */}
      <Box pt={{ base: '5rem', md: '6rem' }} px={{ base: '1rem', md: '2rem' }}>
        <Button
          as={Link}
          to="/dashboard/place-order"
          variant="ghost"
          size="sm"
          color="#584BAC"
          leftIcon={<MdArrowBack />}
          _hover={{ color: '#CE1567', bg: 'transparent' }}
        >
          Back to your items
        </Button>
      </Box>
      <Center>
        <Stack align="center" gap={1} mt="0.5rem">
          <Text fontWeight={600} fontSize={{ base: '1.5rem', md: '2rem' }}>
            Schedule Your Order
          </Text>
          <Text color="gray.500" fontSize="sm">
            Step 2 of 2 — pick a pickup and delivery slot
          </Text>
        </Stack>
      </Center>
      <Flex
        direction={{ base: 'column-reverse', xl: 'row' }}
        justify="center"
        align="center"
        gap={{ base: '4rem', xl: '8rem' }}
        mt={{ base: '2rem', md: '3rem' }}
        pb={{ base: '4rem', xl: '2rem' }}
      >
        <OrderItemsAccordion />
        <ScheduleCard />
      </Flex>
    </>
  );
}
export default CheckoutPage;
