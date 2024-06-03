import { Box, Button, Flex, HStack, Stack, Text } from '@chakra-ui/react';
import React, { useState } from 'react';
import { FiBox } from 'react-icons/fi';
import { MdKeyboardArrowRight } from 'react-icons/md';
import { RiAccountBoxLine, RiSettingsLine } from 'react-icons/ri';
import Navbar from '../../../components/Navbar';
import StudentDetails from '../../../components/StudentDetails';

function StudentDashBoard() {
  const [isActive, setIsActive] = useState(0);
  return (
    <>
      <Navbar />
      <Box
        position="fixed"
        left={0}
        top={['50px', '55px', '70px']}
        bottom={0}
        w="15rem"
        boxShadow="0px 2px 3px lightgray"
        pl="2rem"
        pr="1rem"
        pt="2rem"
      >
        <HStack mb="2rem">
          <RiSettingsLine size={35} />
          <Text fontWeight={600} fontSize="1.4rem">
            Dashboard
          </Text>
        </HStack>
        <Stack gap={4}>
          <Button
            p={0}
            color={!isActive ? 'white' : '#9197B3'}
            bgColor={!isActive ? '#CE1567' : 'transparent'}
            onClick={() => setIsActive(0)}
            _hover={{
              bgColor: `${!isActive ? '#bf0055' : 'transparent'}`,
            }}
          >
            <Flex w="100%" justify="space-between" align="center" px="1rem">
              <Flex align="center" gap={2}>
                <RiAccountBoxLine size={20} />
                <Text>Profile</Text>
              </Flex>
              <MdKeyboardArrowRight />
            </Flex>
          </Button>
          <Button
            p={0}
            color={isActive ? 'white' : '#9197B3'}
            bgColor={isActive ? '#CE1567' : 'transparent'}
            onClick={() => setIsActive(1)}
            _hover={{
              bgColor: `${isActive ? '#bf0055' : 'transparent'}`,
            }}
          >
            <Flex w="100%" justify="space-between" align="center" px="1rem">
              <Flex align="center" gap={2}>
                <FiBox size={20} />
                <Text>Orders</Text>
              </Flex>
              <MdKeyboardArrowRight />
            </Flex>
          </Button>
        </Stack>
      </Box>

      <Flex
        justify="space-evenly"
        align="center"
        mt={['50px', '55px', '70px']}
        pt="10rem"
      >
        {!isActive ? <StudentDetails /> : ''}
      </Flex>
    </>
  );
}
export default StudentDashBoard;
