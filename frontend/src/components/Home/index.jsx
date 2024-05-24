import React from 'react';
import { Box } from '@chakra-ui/react';
import Hero from './Hero';
import ServiceCard from './ServiceCard';
import WorkingCard from './WorkingCard';

const main = () => {
  return (
    <Box pt="4rem">
      <Hero />
      <ServiceCard />
      <WorkingCard />
    </Box>
  );
};

export default main;
