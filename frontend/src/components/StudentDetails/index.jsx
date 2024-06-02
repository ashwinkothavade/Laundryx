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
import {
  FaUser,
  FaPhone,
  FaEnvelope,
  FaBuilding,
  FaIdBadge,
  FaDoorOpen,
} from 'react-icons/fa';
import useAuthStore from '../Store/AuthStore';

function StudentDetails() {
  const {
    userName,
    userEmail,
    Phone,
    userHostel,
    userRoomNumber,
    userRollNumber,
    setUserName,
    setUserEmail,
    setUserPhone,
    setUserRoomNumber,
    setUserHostel,
    setUserRollNumber,
  } = useAuthStore((state) => ({
    userName: state.userName,
    userEmail: state.userEmail,
    Phone: state.Phone,
    userHostel: state.userHostel,
    userRoomNumber: state.userRoomNumber,
    userRollNumber: state.userRollNumber,
    setUserName: state.setUserName,
    setUserEmail: state.setUserEmail,
    setUserPhone: state.setUserPhone,
    setUserRoomNumber: state.setUserRoomNumber,
    setUserHostel: state.setUserHostel,
    setUserRollNumber: state.setUserRollNumber,
  }));
  const [formData, setFormData] = useState({
    username: userName,
    phone_number: Phone,
    email: userEmail,
    password: '',
    hostel: userHostel,
    room_number: userRoomNumber,
    roll_number: userRollNumber,
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
    hostel: userHostel,
    room_number: userRoomNumber,
    roll_number: userRollNumber,
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
    // get the keys for the changed fields
    console.log(changedFields);
    console.log(changedData);
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
          case 'hostel':
            setUserHostel(changedData.hostel);
            break;
          case 'email':
            setUserEmail(changedData.email);
            break;
          case 'room_number':
            setUserRoomNumber(changedData.room_number);
            break;
          case 'roll_number':
            setUserRollNumber(changedData.roll_number);
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
          <Flex align="center" mb="0.5rem">
            <Icon as={FaBuilding} mr="0.5rem" />
            <Text fontSize={['1rem', '1.2rem']} fontWeight="500">
              <strong>Hostel:</strong> {userHostel}
            </Text>
          </Flex>
          <Flex align="center" mb="0.5rem">
            <Icon as={FaIdBadge} mr="0.5rem" />
            <Text fontSize={['1rem', '1.2rem']} fontWeight="500">
              <strong>Roll Number:</strong> {userRollNumber}
            </Text>
          </Flex>
          <Flex align="center">
            <Icon as={FaDoorOpen} mr="0.5rem" />
            <Text fontSize={['1rem', '1.2rem']} fontWeight="500">
              <strong>Room Number:</strong> {userRoomNumber}
            </Text>
          </Flex>
        </Box>
        <Button onClick={onOpen} colorScheme="blue" width="5rem">
          Update
        </Button>

        <Modal isOpen={isOpen} onClose={onClose} isCentered>
          <ModalOverlay />
          <ModalContent maxWidth="500px">
            <ModalHeader textAlign="center">Student Details</ModalHeader>
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
                    <FormControl id="hostel" isRequired>
                      <FormLabel>Hostel</FormLabel>
                      <Input
                        type="text"
                        name="hostel"
                        value={formData.hostel}
                        onChange={handleChange}
                        isDisabled={!isEditMode}
                      />
                    </FormControl>

                    <FormControl id="roll" isRequired>
                      <FormLabel>Roll Number</FormLabel>
                      <Input
                        type="text"
                        name="roll_number"
                        value={formData.roll_number}
                        onChange={handleChange}
                        isDisabled={!isEditMode}
                      />
                    </FormControl>
                    <FormControl id="room" isRequired>
                      <FormLabel>Room</FormLabel>
                      <Input
                        type="text"
                        name="room_number"
                        value={formData.room_number}
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
  );
}

export default StudentDetails;
