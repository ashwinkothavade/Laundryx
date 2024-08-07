import { Box, Center } from '@chakra-ui/react';
import React from 'react';
import ContactSection from './Contact';
import Hero from './Hero';
import ServiceCard from './ServiceCard';
import WorkingCard from './WorkingCard';

function Main() {
  return (
    <Box pt="4rem">
      <Center height="100vh">
        <Hero />
      </Center>
      <Box height="100vh">
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
