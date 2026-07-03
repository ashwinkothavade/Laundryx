import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Flex,
  HStack,
  Stack,
  Text,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { FiBox, FiList } from 'react-icons/fi';

import { Helmet } from 'react-helmet-async';
import { MdKeyboardArrowRight } from 'react-icons/md';
import { RiAccountBoxLine, RiSettingsLine } from 'react-icons/ri';
import LaundererDetails from '../../../components/LaundererDetails';
import LaundererOrdersDetail from '../../../components/LaundererOrdersDetail';
import LaundererCatalog from '../../../components/LaundererCatalog';
import Navbar from '../../../components/Navbar';
import { getMe } from '../../../utils/apis';

function LaundererDashboard() {
  const [isActive, setIsActive] = useState(0);
  const [approved, setApproved] = useState(null);

  useEffect(() => {
    getMe()
      .then((res) => setApproved(res.data.approved))
      .catch(() => setApproved(null));
  }, []);

  return (
    <>
      <Helmet>
        <title>LaundriX - Dashboard</title>
        <meta name="description" content="" />
      </Helmet>
      <Navbar />
      <Flex
        direction={{ base: 'column', md: 'row' }}
        justify="space-evenly"
        pt={{ base: '0', md: '7rem' }}
      >
        <Box
          position={{ base: 'static', md: 'fixed' }}
          left={0}
          top={['50px', '55px', '70px']}
          bottom={{ base: 'auto', md: 0 }}
          w={{ base: '100%', md: '15rem' }}
          boxShadow="0px 2px 3px lightgray"
          pl={{ base: '1rem', md: '2rem' }}
          pr="1rem"
          pt="3rem"
          mt={{ base: '50px', xs: '55px', sm: '70px', md: 0 }}
        >
          <HStack mb="2rem" display={{ base: 'none', md: 'flex' }}>
            <RiSettingsLine size={35} />
            <Text fontWeight={600} fontSize="1.4rem">
              Dashboard
            </Text>
          </HStack>
          <Stack
            direction={{ base: 'row', md: 'column' }}
            gap={{ base: 2, md: 4 }}
          >
            {[
              { label: 'Profile', icon: RiAccountBoxLine },
              { label: 'Orders', icon: FiBox },
              { label: 'Catalog', icon: FiList },
            ].map((tab, index) => (
              <Button
                key={tab.label}
                p={0}
                color={isActive === index ? 'white' : '#9197B3'}
                bgColor={isActive === index ? '#CE1567' : 'transparent'}
                onClick={() => setIsActive(index)}
                _hover={{
                  bgColor: isActive === index ? '#bf0055' : 'transparent',
                }}
              >
                <Flex w="100%" justify="space-between" align="center" px="1rem">
                  <Flex align="center" gap={2}>
                    <tab.icon size={20} />
                    <Text>{tab.label}</Text>
                  </Flex>
                  <MdKeyboardArrowRight />
                </Flex>
              </Button>
            ))}
          </Stack>
        </Box>
        <Box w="100%">
          {approved === false && (
            <Alert
              status="warning"
              borderRadius="md"
              mt={{ base: '1rem', md: 0 }}
              mx={{ base: '1rem', md: '5rem' }}
              w="auto"
            >
              <AlertIcon />
              Your launderer account is pending admin approval. You can set up
              your catalog now, but students won’t see you or be able to place
              orders until you’re approved.
            </Alert>
          )}
          <Flex
            justify="space-evenly"
            align="center"
            pt="3rem"
            pl={{ base: '1rem', md: '5rem' }}
            pr={{ base: '1rem', md: 0 }}
            w="100%"
          >
            {isActive === 0 && <LaundererDetails />}
            {isActive === 1 && <LaundererOrdersDetail />}
            {isActive === 2 && <LaundererCatalog />}
          </Flex>
        </Box>
      </Flex>
    </>
  );
}

export default LaundererDashboard;
