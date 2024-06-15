import React from 'react';
import { motion } from 'framer-motion';
import { Box, Text } from '@chakra-ui/react';
import Services from '../../TempData/Services';
import Service from './Service';

const cardVariant = {
  initial: { y: 20, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { duration: 0.9, ease: 'easeInOut' },
};

function ServiceCard() {
  const tasks = Services.map((task) => {
    return <Service key={task.id} task={task} />;
  });

  return (
    <>
      <Box
        pt={{ base: '8rem', md: '2rem' }}
        pb={{ base: '2rem', md: '4rem' }}
        mx="1rem"
      >
        <Box pt="6rem">
          <motion.div
            variants={cardVariant}
            animate="animate"
            initial="initial"
          >
            <Text fontSize="4xl" textAlign="center" fontWeight="semibold">
              What We Offer
            </Text>
            <Text
              textAlign="center"
              fontWeight="semibold"
              fontSize="xl"
              color="lxPurple"
            >
              Our services and prices
            </Text>
          </motion.div>
        </Box>
      </Box>
      <motion.div variants={cardVariant} animate="animate" initial="initial">
        <Box
          display="flex"
          flexDirection={{ base: 'column', lg: 'row' }}
          alignItems="center"
          gap="3.5rem"
          justifyContent="center"
          px={{ base: '0rem', md: '9rem' }}
          my={{ base: '1rem', md: '0rem' }}
        >
          {tasks}
        </Box>
      </motion.div>
    </>
  );
}

export default ServiceCard;
