import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Stack,
  useToast,
  Text,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
  Icon,
  Grid,
  useMediaQuery,
} from '@chakra-ui/react';
import axios from 'axios';
import { FaUser, FaPhone, FaEnvelope } from 'react-icons/fa';
import useAuthStore from '../Store/AuthStore';

function LaundererDetails() {
  const {
    userName,
    userEmail,
    Phone,
    setUserName,
    setUserEmail,
    setUserPhone,
  } = useAuthStore((state) => ({
    userName: state.userName,
    userEmail: state.userEmail,
    Phone: state.Phone,
    setUserName: state.setUserName,
    setUserEmail: state.setUserEmail,
    setUserPhone: state.setUserPhone,
  }));
  const usernameRef = useRef(null);
  const phoneRef = useRef(null);
  const emailRef = useRef(null);

  const [isEditMode, setIsEditMode] = useState(true);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const getChangedData = (initialData, currentData) => {
    const changedData = {};
    const changedFields = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const key in currentData) {
      if (currentData[key] !== initialData[key]) {
        changedData[key] = currentData[key];
        changedFields.push(key);
      }
    }
    return { changedData, changedFields };
  };

  const initialData = {
    username: userName,
    phone_number: Phone,
    email: userEmail,
  };

  const handleToast = (title, description, status) => {
    toast({
      position: 'top',
      title,
      description,
      status,
      isClosable: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const currentData = {
      username: usernameRef.current.value,
      phone_number: phoneRef.current.value,
      email: emailRef.current.value,
    };

    const { changedData, changedFields } = getChangedData(
      initialData,
      currentData
    );

    if (changedFields.length === 0) {
      handleToast('No changes made', '', 'info');
      return;
    }
    try {
      const response = await axios.patch(
        'http://localhost:4000/user',
        changedData
      );
      changedFields.forEach((field) => {
        switch (field) {
          case 'username':
            setUserName(changedData.username);
            break;
          case 'phone_number':
            setUserPhone(changedData.phone_number);
            break;
          case 'email':
            setUserEmail(changedData.email);
            break;
          default:
            break;
        }
      });
      console.log(response);
      handleToast('Updated', 'Student details updated', 'success');
      setIsEditMode(false);
    } catch (err) {
      let errorDescription = '';
      if (err.response.data.errors.username) {
        errorDescription += err.response.data.errors.username;
      } else if (err.response.data.errors.email) {
        errorDescription += err.response.data.errors.email;
      } else if (err.response.data.errors.role) {
        errorDescription += err.response.data.errors.role;
      } else if (err.response.data.errors.phone_number) {
        errorDescription += err.response.data.errors.phone_number;
      }
      handleToast(
        'Error while updating launderer data',
        errorDescription,
        'error'
      );
    }
  };

  const handleOpen = () => {
    onOpen();
    setTimeout(() => {
      if (usernameRef.current) usernameRef.current.value = userName || '';
      if (phoneRef.current) phoneRef.current.value = Phone || '';
      if (emailRef.current) emailRef.current.value = userEmail || '';
    }, 0);
  };

  const [isLargerThan768px] = useMediaQuery('(min-width: 768px)');
  return (
    <>
      {/* {' '} */}
      <Center m={0} p={0}>
        <Stack align="center" justify="center" spacing={4}>
          <Box
            borderRadius="1.2rem"
            px={['2rem', '3rem']}
            py={['2rem', '3rem']}
            shadow="md"
            w={['auto', 'auto', 'auto', '40rem', '40rem', '45rem']}
            mb="2rem"
            bg="#ffffff"
            border="1px solid #ce1567"
            boxShadow="0px 0px 20px 0px rgba(0, 0, 0, 0.20)"
            mx="auto"
          >
            <Flex
              align="center"
              justify={isLargerThan768px ? 'space-between' : 'center'}
              mb="1rem"
              direction={isLargerThan768px ? 'row' : 'column'}
            >
              <Text
                textAlign="center"
                color="#292929"
                fontSize={['1.5rem', '1.8rem']}
                fontWeight="100"
                mb={isLargerThan768px ? '0' : '1rem'}
              >
                User Details
              </Text>
              {isLargerThan768px && (
                <Button
                  onClick={handleOpen}
                  bgColor="#ce1567"
                  color="#ffff"
                  textAlign="center"
                  width="7rem"
                  _hover={{
                    color: '#292929',
                    bgColor: '#ce1567',
                  }}
                  mb="1rem"
                >
                  Edit
                </Button>
              )}
            </Flex>
            <Grid templateColumns="1fr" gap={4} mb="1rem">
              <Flex align="center" mb="0.5rem">
                <Icon as={FaUser} mr="0.5rem" />
                <Text fontSize={['1rem', '1.2rem']} fontWeight="500">
                  <strong>Username:</strong> {userName}
                </Text>
              </Flex>

              <Flex align="center" mb="0.5rem">
                <Icon as={FaPhone} mr="0.5rem" />
                <Text fontSize={['1rem', '1.2rem']} fontWeight="500">
                  <strong>Phone:</strong> {Phone}
                </Text>
              </Flex>
              <Flex align="center" mb="0.5rem">
                <Icon as={FaEnvelope} mr="0.5rem" />
                <Text fontSize={['1rem', '1.2rem']} fontWeight="500">
                  <strong>Email:</strong> {userEmail}
                </Text>
              </Flex>
            </Grid>
            {!isLargerThan768px && (
              <Button
                onClick={onOpen}
                bgColor="#ce1567"
                color="#ffff"
                textAlign="center"
                width="7rem"
                _hover={{
                  color: '#292929',
                  bgColor: '#ce1567',
                }}
                mt="2rem"
                mx="auto"
                display="block"
              >
                Edit
              </Button>
            )}
          </Box>

          <Modal isOpen={isOpen} onClose={onClose} isCentered>
            <ModalOverlay />
            <ModalContent maxWidth="500px">
              <ModalHeader textAlign="center">User Details</ModalHeader>
              <ModalCloseButton />
              <ModalBody>
                <Flex
                  direction="column"
                  border="2px solid #292929"
                  w="full"
                  px={['1rem', '2rem']}
                  py={['1rem', '2rem']}
                  borderRadius="1.2rem"
                  shadow="md"
                  bg="white"
                >
                  <form onSubmit={handleSubmit}>
                    <Stack spacing={4}>
                      <FormControl id="username" isRequired>
                        <FormLabel>Username</FormLabel>
                        <Input
                          type="text"
                          name="username"
                          ref={usernameRef}
                          isDisabled={!isEditMode}
                        />
                      </FormControl>

                      <FormControl id="phone" isRequired>
                        <FormLabel>Phone</FormLabel>
                        <Input
                          type="tel"
                          name="phone_number"
                          ref={phoneRef}
                          isDisabled={!isEditMode}
                        />
                      </FormControl>
                      <FormControl id="email" isRequired>
                        <FormLabel>Email</FormLabel>
                        <Input
                          type="email"
                          name="email"
                          ref={emailRef}
                          isDisabled={!isEditMode}
                        />
                      </FormControl>
                    </Stack>
                    {isEditMode && (
                      <Button
                        type="submit"
                        colorScheme="blue"
                        width="full"
                        mt="1rem"
                      >
                        Save
                      </Button>
                    )}
                  </form>
                </Flex>
              </ModalBody>

              <ModalFooter justifyContent="flex-end">
                <Button colorScheme="red" onClick={onClose} mr={3}>
                  Close
                </Button>
                <Button
                  onClick={() => setIsEditMode(!isEditMode)}
                  colorScheme={isEditMode ? 'red' : 'blue'}
                >
                  {isEditMode ? 'Cancel' : 'Edit Details'}
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        </Stack>
      </Center>
    </>
  );
}

export default LaundererDetails;
