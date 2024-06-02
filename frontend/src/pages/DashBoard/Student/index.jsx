import React from 'react';
import { Flex } from '@chakra-ui/react';
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
        <StudentDetails />
      </Flex>
    </>
  );
}
export default StudentDashBoard;
