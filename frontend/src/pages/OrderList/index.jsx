import { Box } from '@chakra-ui/react';
import React from 'react';
import Navbar from '../../components/Navbar';
import OrderCard2 from '../../components/OrderCard2';

function OrderList() {
  return (
    <>
      <Navbar />
      <Box>
        <OrderCard2 />
      </Box>
    </>
  );
}

export default OrderList;
