import React, { useState } from 'react';
import {
  Button,
  Center,
  Flex,
  FormControl,
  FormLabel,
  Input,
  Stack,
  useToast,
  Text,
} from '@chakra-ui/react';
import axios from 'axios';
import useAuthStore from '../Store/AuthStore';

function StudentForm() {
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

  const [isEditMode, setIsEditMode] = useState(false);
  const toast = useToast();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
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
      toast({
        title: 'Student details updated.',
        description: 'The student details have been successfully updated.',
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
      setIsEditMode(false);
    } catch (err) {
      toast({
        title: 'Error',
        description: 'An error occurred while updating student details.',
        status: 'error',
        duration: 5000,
        isClosable: true,
        position: 'top',
      });
    }
  };

  return (
    <Center m={0} p={0}>
      <Stack>
        <Text
          textAlign="center"
          color="#584BAC"
          fontSize={['1.7rem', '2.2rem']}
          fontWeight="600"
          mb="1rem"
        >
          Student Details
        </Text>
        <Flex
          direction="column"
          border="2px solid #292929"
          w={['20rem', '27rem']}
          px={['1rem', '2rem']}
          py={['1rem', '2rem']}
          borderRadius="1.2rem"
          mb="1rem"
          shadow="md"
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
              <Button type="submit" colorScheme="blue" width="full" mt="1rem">
                Save
              </Button>
            )}
          </form>
        </Flex>
        <Button
          onClick={() => setIsEditMode(!isEditMode)}
          colorScheme={isEditMode ? 'red' : 'blue'}
          width="full"
        >
          {isEditMode ? 'Cancel' : 'Edit Details'}
        </Button>
      </Stack>
    </Center>
  );
}

export default StudentForm;
