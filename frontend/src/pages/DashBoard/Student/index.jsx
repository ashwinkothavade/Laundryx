import { Box, Button, Flex, HStack, Stack, Text } from '@chakra-ui/react';
import React, { useState } from 'react';
import { FiBox } from 'react-icons/fi';

import { Helmet } from 'react-helmet-async';
import { MdKeyboardArrowRight } from 'react-icons/md';
import { RiAccountBoxLine, RiSettingsLine } from 'react-icons/ri';
import Navbar from '../../../components/Navbar';
import StudentDetails from '../../../components/StudentDetails';
import OrderDetail from '../../../components/StudentOrdersDetail';

function StudentDashBoard() {
  const [isActive, setIsActive] = useState(0);
  return (
    <>
      <Helmet>
        <title>LaundriX - Dashboard</title>
        <meta name="description" content="" />
      </Helmet>
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
        pt="5rem"
        pl="5rem"
        mt={['50px', '55px', '70px']}
      >
        {!isActive ? <StudentDetails /> : <OrderDetail />}
      </Flex>
    </>
  );
}
export default StudentDashBoard;
