import { Box } from '@chakra-ui/react';
import React from 'react';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Helmet } from 'react-helmet-async';
import Navbar from '../../components/Navbar';
import OrderCard from '../../components/OrderCard';

function OrderList() {
  return (
    <>
      <Helmet>
        <title>LaundriX - Add Items</title>
        <meta name="description" content="" />
      </Helmet>
      <Navbar />
      <Box>
        <OrderCard />
      </Box>
    </>
  );
}

export default OrderList;
