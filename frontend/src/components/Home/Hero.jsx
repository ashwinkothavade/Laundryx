import {
  Box,
  Flex,
  Heading,
  Image,
  Text,
  chakra,
  useToast,
} from '@chakra-ui/react';
import { motion } from 'framer-motion';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import Landing from '../../../public/assets/laundry_hero.png';
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

  return (
    <Flex
      w={{ base: '100%', xl: '' }}
      h={{ base: '100%', xl: '' }}
      bgImage={{ base: "url('public/assets/laundry_hero.png')", xl: '' }}
      bgPosition=""
      bgRepeat="no-repeat"
      alignItems="center"
      justifyContent="center"
      gap={{ base: '2.1rem', xl: '2rem', '2xl': '8rem' }}
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
          <Heading
            color="lxPurple"
            mb="2rem"
            textAlign="center"
            fontSize={{ base: '2.1rem', sm: '2.5rem', '2xl': '3.2rem' }}
          >
            Laundry and Dry Cleaning, Done.
          </Heading>
          <Text
            fontWeight={600}
            fontSize={{ base: '1rem', sm: '1.2rem', '2xl': '1.3rem' }}
            textAlign="center"
            w={{ base: '20rem', sm: '25rem', md: '28rem', '2xl': '35rem' }}
            mb="2rem"
          >
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
        <Image
          src={Landing}
          height={{
            base: '0',
            xl: '530px',
            '2xl': '600px',
          }}
          width={{
            base: '0',
            xl: '700px',
            '2xl': '850px',
          }}
        />
      </Box>
    </Flex>
  );
}

export default Hero;
