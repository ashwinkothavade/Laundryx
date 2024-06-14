import React from 'react';
import { Box } from '@chakra-ui/react';
import Hero from './Hero';
import ServiceCard from './ServiceCard';
import WorkingCard from './WorkingCard';

function Main() {
  return (
    <Box
      pt="4rem"
      height="100vh"
      overflowY="scroll"
      scrollSnapType="y mandatory"
      css={{
        scrollBehavior: 'smooth',
      }}
    >
      <Box height="100vh" scrollSnapAlign="start">
        <Hero />
      </Box>
      <Box height="80vh" scrollSnapAlign="start">
        <ServiceCard />
      </Box>
      <Box height="100vh" scrollSnapAlign="start">
        <WorkingCard />
      </Box>
    </Box>
  );
}

export default Main;
