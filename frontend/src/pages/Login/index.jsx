import { Box, Flex } from '@chakra-ui/react';
import { DotLottiePlayer } from '@dotlottie/react-player';
import '@dotlottie/react-player/dist/index.css';
import LoginForm from '../../components/LoginForm';
import Navbar from '../../components/Navbar';

export default function Login() {
  return (
    <>
      <Navbar />
      <Flex justify="center" align="center" gap="8rem" h="100vh">
        <Box display={{ base: 'none', lg: 'block' }} h="50rem" w="50rem">
          <DotLottiePlayer
            src="/Child-with-laundry.lottie"
            autoplay
            loop
            playMode="bounce"
          />
        </Box>
        <LoginForm />
      </Flex>
    </>
  );
}
