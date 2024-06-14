import { Box, Flex } from '@chakra-ui/react';
import { DotLottiePlayer } from '@dotlottie/react-player';
import '@dotlottie/react-player/dist/index.css';
// eslint-disable-next-line import/no-extraneous-dependencies
import { Helmet } from 'react-helmet-async';
import LoginForm from '../../components/LoginForm';
import Navbar from '../../components/Navbar';

export default function Login() {
  return (
    <>
      <Helmet>
        <title>LaundriX - Login</title>
        <meta name="description" content="" />
      </Helmet>
      <Navbar />
      <Flex justify="center" align="center" gap="8rem" h="100vh">
        <Box display={{ base: 'none', lg: 'block' }} h="50rem" w="50rem">
          <DotLottiePlayer
            src="/Launderer.lottie"
            autoplay
            loop
            playMode="bounce"
            speed={0.75}
          />
        </Box>
        <LoginForm />
      </Flex>
    </>
  );
}
