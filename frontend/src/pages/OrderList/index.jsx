import { Box } from '@chakra-ui/react';
import React from 'react';
import Navbar from '../../components/Navbar';
import OrderCard from '../../components/OrderCard';

function OrderList() {
  return (
    <>
      <Navbar />
      <Box>
        <OrderCard />
      </Box>
    </>
  );
}

export default OrderList;
