import { Box, Flex } from '@chakra-ui/react';
import { DotLottiePlayer } from '@dotlottie/react-player';
import '@dotlottie/react-player/dist/index.css';
import Navbar from '../../components/Navbar';
import SignupForm from '../../components/SignupForm';

export default function Signup() {
  return (
    <>
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
        <SignupForm />
      </Flex>
    </>
  );
}
