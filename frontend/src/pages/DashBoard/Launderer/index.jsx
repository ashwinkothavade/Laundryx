import { Box, Button, Flex, HStack, Stack, Text } from '@chakra-ui/react';
import React, { useState } from 'react';
import { FiBox } from 'react-icons/fi';
import { MdKeyboardArrowRight } from 'react-icons/md';
import { RiAccountBoxLine, RiSettingsLine } from 'react-icons/ri';
import LaundererDetails from '../../../components/LaundererDetails';
import Navbar from '../../../components/Navbar';

function LaundererDashboard() {
  const [isActive, setIsActive] = useState(0);
  return (
    <>
      <Navbar />
      <Box
        position="fixed"
        left={0}
        top={['50px', '55px', '70px']}
        bottom={0}
        bg="#f5f5f5"
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
        <Stack>
          <Button
            leftIcon={<RiAccountBoxLine />}
            rightIcon={<MdKeyboardArrowRight />}
            color={!isActive ? 'white' : '#9197B3'}
            bgColor={!isActive ? '#CE1567' : 'transparent'}
            onClick={() => setIsActive(0)}
            _hover={{
              bgColor: `${!isActive ? '#CE1567' : 'transparent'}`,
            }}
          >
            Profile
          </Button>
          <Button
            leftIcon={<FiBox />}
            rightIcon={<MdKeyboardArrowRight />}
            color={isActive ? 'white' : '#9197B3'}
            bgColor={isActive ? '#CE1567' : 'transparent'}
            onClick={() => setIsActive(1)}
            _hover={{
              bgColor: `${isActive ? '#CE1567' : 'transparent'}`,
            }}
          >
            Orders
          </Button>
        </Stack>
      </Box>

      <Flex
        justify="space-evenly"
        align="center"
        mt={['50px', '55px', '70px']}
        pt="10rem"
      >
        <LaundererDetails />
      </Flex>
    </>
  );
}

export default LaundererDashboard;
