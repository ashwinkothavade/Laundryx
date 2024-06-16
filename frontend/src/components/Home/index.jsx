import React from 'react';
import { Box, Center } from '@chakra-ui/react';
import Hero from './Hero';
import ContactSection from './Contact';
import ServiceCard from './ServiceCard';
import WorkingCard from './WorkingCard';

function Main() {
  return (
    <Box
      pt="4rem"
      height="100vh"
      // overflowY="scroll"
      // scrollSnapType="y mandatory"
      // css={{
      //   scrollBehavior: 'smooth',
      // }}
    >
      <Center height="80vh">
        <Hero />
      </Center>
      <Center height="80vh">
        <ServiceCard />
      </Center>
      <Center height="80vh">
        <WorkingCard />
      </Center>
      <Center height="100vh">
        <ContactSection />
      </Center>
    </Box>
  );
}

export default Main;
