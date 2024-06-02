import React from 'react';
import { Flex } from '@chakra-ui/react';
import Navbar from '../../../components/Navbar';
import LaundererDetails from '../../../components/LaundererDetails';

function LaundererDashboard() {
  return (
    <>
      <Navbar />
      <Flex
        justify="space-evenly"
        align="center"
        mt={['50px', '55px', '70px']}
        pt="10rem"
      >
        <LaundererDetails />
      </Flex>
    </>
  );
}

export default LaundererDashboard;
