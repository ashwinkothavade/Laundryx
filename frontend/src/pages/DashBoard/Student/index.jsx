import React from 'react';
import { Flex, Box } from '@chakra-ui/react';
import StudentDetails from '../../../components/StudentDetails';
import Navbar from '../../../components/Navbar';

function StudentDashBoard() {
  return (
    <>
      <Navbar />
      <Flex
        justify="space-evenly"
        align="center"
        mt={['50px', '55px', '70px']}
        pt="10rem"
      >
        <Box display={{ base: 'none', lg: 'block' }}>SideNav</Box>
        <Box display={{ base: 'none', lg: 'block' }}>Profile</Box>
        <Box display={{ base: 'none', lg: 'block' }} mx="2rem" />
        <StudentDetails />
      </Flex>
    </>
  );
}
export default StudentDashBoard;
