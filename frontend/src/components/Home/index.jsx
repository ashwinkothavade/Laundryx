import React from 'react';
import { Box } from '@chakra-ui/react';
import Hero from './Hero';
import ServiceCard from './ServiceCard';
import WorkingCard from './WorkingCard';

function Main() {
  return (
    <Box pt="4rem">
      <Hero />
      <ServiceCard />
      <WorkingCard />
    </Box>
  );
}

export default Main;
