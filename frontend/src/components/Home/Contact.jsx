import {
  Box,
  Button,
  Flex,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Text,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import { DotLottiePlayer } from '@dotlottie/react-player';
import '@dotlottie/react-player/dist/index.css';
import emailjs from '@emailjs/browser';
import React, { useRef, useState } from 'react';
import { HiArrowLongRight } from 'react-icons/hi2';

function ContactSection() {
  // eslint-disable-next-line no-unused-vars
  const [errors, setErrors] = useState({});
  const senderNameRef = useRef();
  const senderMailRef = useRef();
  const messageRef = useRef();
  const toast = useToast();

  const handleToast = (title, description, status) => {
    toast({
      position: 'top',
      title,
      description,
      status,
      isClosable: true,
    });
  };

  const handleClick = () => {
    const senderName = senderNameRef.current.value;
    const senderMail = senderMailRef.current.value;
    const message = messageRef.current.value;

    const newErrors = {};
    if (!senderName) {
      newErrors.senderName = 'Name is required';
    }
    if (!senderMail) {
      newErrors.senderMail = 'Email is required';
    }
    if (!message) {
      newErrors.message = 'Message is required';
    }
    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      const templateParams = {
        from_name: senderName,
        from_email: senderMail,
        to_name: 'Laundrix',
        message,
      };

      const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
      const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
      const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

      emailjs
        .send(serviceId, templateId, templateParams, publicKey)
        .then(() => {
          handleToast('Your email has been sent successfully.', '', 'success');
        })
        .catch((error) => {
          handleToast('Error sending mail!', error, 'error');
        });
    } else {
      const errorMessages = Object.values(newErrors).join(', ');
      handleToast('Cannot send mail!', errorMessages, 'error');
    }
  };

  return (
    <Flex align="center" gap="3rem">
      <Stack align="center">
        <Stack align="center" gap="1rem" mb="3rem">
          <Heading color="#584BAC" size="2xl">
            Reach Out to Us
          </Heading>
          <Text fontWeight={600} fontSize="1.3rem" textAlign="center" w="40rem">
            Whether you have inquiries, feedback, or need support, we're just a
            message away.
          </Text>
        </Stack>
        <Stack gap="2rem">
          <Flex gap="3rem">
            <Box>
              <FormControl>
                <FormLabel fontSize="1.2rem">Name</FormLabel>
                <Input
                  type="text"
                  ref={senderNameRef}
                  placeholder="Enter your name"
                  pl={0}
                  w="18rem"
                  border="none"
                  borderBottom="2px solid #584BAC"
                  borderRadius={0}
                  _hover={{ borderBottom: '2px solid #584BAC' }}
                  _focusVisible={{ outline: 'none' }}
                />
              </FormControl>
            </Box>
            <Box>
              <FormControl>
                <FormLabel fontSize="1.2rem">Email</FormLabel>
                <Input
                  type="email"
                  ref={senderMailRef}
                  placeholder="Enter your email"
                  pl={0}
                  w="18rem"
                  border="none"
                  borderBottom="2px solid #584BAC"
                  borderRadius={0}
                  _hover={{ borderBottom: '2px solid #584BAC' }}
                  _focusVisible={{ outline: 'none' }}
                />
              </FormControl>
            </Box>
          </Flex>
          <Box>
            <FormControl>
              <FormLabel fontSize="1.2rem">Message</FormLabel>
              <Textarea
                w="39rem"
                ref={messageRef}
                placeholder="Enter the message"
                pl={0}
                border="none"
                borderBottom="2px solid #584BAC"
                borderRadius={0}
                _hover={{ borderBottom: '2px solid #584BAC' }}
                _focusVisible={{ outline: 'none' }}
              />
            </FormControl>
          </Box>
        </Stack>
        <Button
          color="#FFFFFF"
          fontSize="1.2rem"
          bg="#584BAC"
          size="lg"
          mt="2rem"
          rightIcon={<HiArrowLongRight color="#ffffff" size={30} />}
          _hover={{ bg: '#4c4196' }}
          onClick={handleClick}
        >
          Send Mail
        </Button>
      </Stack>
      <Box display={{ base: 'none', lg: 'block' }} h="45rem" w="45rem">
        <DotLottiePlayer
          src="/Contact.lottie"
          autoplay
          loop
          playMode="bounce"
          speed={0.75}
        />
      </Box>
    </Flex>
  );
}

export default ContactSection;
