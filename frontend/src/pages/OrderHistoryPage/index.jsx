import { Box, Flex, Text } from '@chakra-ui/react';
import React from 'react';
import Navbar from '../../components/Navbar';
import PastOrderCard from '../../components/PastOrderTab/PastOrderCard';

function OrderHistoryPage() {
  return (
    <>
      <Navbar />
      <Box mt="75px">
        <Text mt="100px" fontSize="35px" ml="50px" fontWeight="medium">
          Order History
        </Text>
        <Flex
          w="100%"
          direction="column"
          align="center"
          gap="2rem"
          mt="6rem"
          mb="5rem"
        >
          <PastOrderCard />
          <PastOrderCard />
          <PastOrderCard />
        </Flex>
      </Box>
    </>
  );
}
export default OrderHistoryPage;
