import { Box } from '@chakra-ui/react';
import React from 'react';
import Navbar from '../../components/Navbar';
import OrderCard2 from '../../components/OrderCard2';

function OrderList() {
  console.log('this is order card 2');
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
