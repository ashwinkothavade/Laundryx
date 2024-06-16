import React from 'react';
import { motion } from 'framer-motion';
import { Text, Heading, Box, Flex, chakra, useToast } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import Landing from '../../../public/assets/LandingImg.svg';
import useAuthStore from '../Store/AuthStore';

const LandingButton = chakra('button', {
  baseStyle: {
    px: '6',
    mt: '2',
    py: '3',
    bg: '#584BAC', // Adjust background color for dimmer effect
    fontSize: '1.2rem',
    fontWeight: '600',
    color: 'white',
    borderRadius: 'lg ',
    _hover: {
      bg: '#4c4196',
    },
    _active: {
      bg: '#3f3680',
      transform: 'scale(0.98)',
    },
  },
});

const AnimatedBox = motion.div;
const AnimatedImage = motion.img;

function Hero() {
  const navigate = useNavigate();
  const toast = useToast();
  const { isAuth, userRole } = useAuthStore((state) => ({
    isAuth: state.isAuth,
    userRole: state.userRole,
  }));

  const contentVariant = {
    initial: { opacity: 0, transform: 'translateX(-50px)' },
    animate: { opacity: 1, transform: 'translateX(0)' },
    transition: { duration: 0.9, ease: 'easeInOut' },
  };

  const imageVariant = {
    initial: { opacity: 0, scale: 0.9 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.9, ease: 'anticipate' },
  };

  return (
    <Flex
      alignItems="center"
      justifyContent="space-around"
      mt="5rem"
      direction={{ base: 'column', lg: 'row' }}
      px="1rem"
      mx="1rem"
    >
      <AnimatedBox
        variants={contentVariant}
        animate="animate"
        initial="initial"
      >
        <Box
          maxW="32rem"
          minW={{ base: 'auto', md: '29rem' }}
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          order={{ base: '1', md: '0' }}
        >
          <Heading color="lxPurple" mb="2rem" textAlign="center" size="2xl">
            Laundry and Dry Cleaning, Done.
          </Heading>
          <Text fontSize="xl" textAlign="center" mb="1rem">
            LaundriX picks up, cleans and delivers. Amazingly awesome,
            ridiculously simple.
          </Text>

          {userRole === 'student' ? (
            <LandingButton
              onClick={() => {
                if (isAuth) {
                  navigate('/OrderList');
                } else {
                  toast({
                    title: 'Please login to place an order',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                    position: 'top',
                  });
                  navigate('/login');
                }
              }}
            >
              Place Order
            </LandingButton>
          ) : (
            <LandingButton
              onClick={() => {
                if (isAuth) {
                  navigate('/dashboard');
                } else {
                  toast({
                    title: 'Login required',
                    status: 'error',
                    duration: 3000,
                    isClosable: true,
                    position: 'top',
                  });
                  navigate('/login');
                }
              }}
              w="auto"
            >
              Go to Dashboard
            </LandingButton>
          )}
        </Box>
      </AnimatedBox>
      <Box>
        <AnimatedImage
          src={Landing}
          alt="Landing Image"
          variants={imageVariant}
        />
      </Box>
    </Flex>
  );
}

export default Hero;
