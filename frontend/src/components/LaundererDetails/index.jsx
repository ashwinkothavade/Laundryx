import React, { useState } from 'react';
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
  const [formData, setFormData] = useState({
    username: userName,
    phone_number: Phone,
    email: userEmail,
    password: '',
  });
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
    password: '',
  };

  const [isEditMode, setIsEditMode] = useState(true);
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
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
    const { changedData, changedFields } = getChangedData(
      initialData,
      formData
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
      handleToast('Error while updating student data', '', 'error');
    }
  };
  return (
    <>
      {' '}
      <Center m={0} p={0}>
        <Stack align="center" justify="center" spacing={4}>
          <Text
            textAlign="center"
            color="#584BAC"
            fontSize={['1.7rem', '2.2rem']}
            fontWeight="600"
            mb="1rem"
          >
            User Details
          </Text>
          <Box
            borderRadius="1.2rem"
            px={['1rem', '2rem']}
            py={['1rem', '2rem']}
            shadow="md"
            w="auto"
            mb="1rem"
            bg="#f0f0f0"
            border="2px solid gray"
            boxShadow="0px 0px 20px 0px rgba(0, 0, 0, 0.20)"
          >
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
          </Box>
          <Button onClick={onOpen} colorScheme="blue" width="5rem">
            Update
          </Button>

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
                          value={formData.username}
                          onChange={handleChange}
                          isDisabled={!isEditMode}
                        />
                      </FormControl>

                      <FormControl id="phone" isRequired>
                        <FormLabel>Phone</FormLabel>
                        <Input
                          type="tel"
                          name="phone_number"
                          value={formData.phone_number}
                          onChange={handleChange}
                          isDisabled={!isEditMode}
                        />
                      </FormControl>
                      <FormControl id="email" isRequired>
                        <FormLabel>Email</FormLabel>
                        <Input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleChange}
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
