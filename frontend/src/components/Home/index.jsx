import React from 'react';
import { Box, Center } from '@chakra-ui/react';
import Hero from './Hero';
import ServiceCard from './ServiceCard';
import WorkingCard from './WorkingCard';
import ContactSection from './Contact';

function Main() {
  return (
    <Box
      pt="4rem"
      height="100vh"
    >
      <Box height="80vh">
        <Hero />
      </Box>
      <Box height="80vh">
        <ServiceCard />
      </Box>
      <Box height="100vh">
        <WorkingCard />
      </Box>
      <Center height="100vh">
        <ContactSection />
      </Center>
    </Box>
  );
}

export default Main;
