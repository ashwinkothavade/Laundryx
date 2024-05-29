import React from 'react';
import { Text, Heading, Box, Image, Flex, chakra } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import Landing from '../../../public/assets/LandingImg.svg';
import useAuthStore from '../Store/AuthStore';

const LandingButton = chakra('button', {
  baseStyle: {
    px: '3',
    mt: '2',
    py: '2',
    bg: '#584BAC',
    width: '10rem',
    fontSize: '1.3rem',
    color: 'white',
    rounded: 'lg',
    _hover: {
      bg: '#4c4196',
    },
    _active: {
      bg: '#3f3680',
      transform: 'scale(0.98)',
    },
  },
});
function Hero() {
  const navigate = useNavigate();
  const isAuth = useAuthStore((state) => state.isAuth);
  return (
    <Flex
      alignItems="center"
      justifyContent="space-around"
      mt="5rem"
      direction={{ base: 'column', lg: 'row' }}
      px="1rem"
      mx="1rem"
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

        <LandingButton
          onClick={() => {
            // eslint-disable-next-line no-unused-expressions
            isAuth ? navigate('/OrderList') : navigate('/login');
          }}
        >
          Place Order
        </LandingButton>
      </Box>
      <Box>
        <Image src={Landing} alt="Landing Image" />
      </Box>
    </Flex>
  );
}

export default Hero;
