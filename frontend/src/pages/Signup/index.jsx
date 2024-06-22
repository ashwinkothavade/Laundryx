import { Box, Flex } from '@chakra-ui/react';
import { DotLottiePlayer } from '@dotlottie/react-player';
import '@dotlottie/react-player/dist/index.css';

import { Helmet } from 'react-helmet-async';
import Navbar from '../../components/Navbar';
import SignupForm from '../../components/SignupForm';

export default function Signup() {
  return (
    <>
      <Helmet>
        <title>LaundriX - Register</title>
        <meta name="description" content="" />
      </Helmet>
      <Navbar />
      <Flex
        justify="center"
        align="center"
        gap={{ base: '0', xl: '4rem', '2xl': '8rem' }}
        h="100vh"
        px={{ base: '0', xl: '2rem', '2xl': '0' }}
      >
        <Box
          display={{ base: 'none', xl: 'block' }}
          h={{ base: '0', xl: '45rem', '2xl': '50rem' }}
          w={{ base: '0', xl: '45rem', '2xl': '50rem' }}
        >
          <DotLottiePlayer
            src="/Launderer.lottie"
            autoplay
            loop
            playMode="bounce"
            speed={0.75}
          />
        </Box>
        <SignupForm />
      </Flex>
    </>
  );
}
