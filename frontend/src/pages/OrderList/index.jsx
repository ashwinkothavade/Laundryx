import React from 'react';
import {
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  Tab,
  Box,
  Text,
} from '@chakra-ui/react';
// import OrderCard from '../../components/OrderCard/OrderCard';
import OrderCard2 from '../../components/OrderCard2/OrderCard2';
import Navbar from '../../components/Navbar';

function OrderList() {
  return (
    <>
      <Navbar />
      <Box>
        <Tabs
          align="center"
          mt={{ base: '6rem', sm: '10rem' }}
          isFitted
          variant="unstyled"
        >
          <TabList
            bgColor="#FAF4FF"
            minHeight={{ base: '3.2rem', sm: '4.3rem', md: '5rem' }}
            maxWidth="85rem"
            dropShadow="0px 0px 13px rgba(0, 0, 0, 0.25)"
            borderRadius={{ base: '0.7rem', sm: '1rem' }}
            mr="2rem"
            ml="2rem"
            mb={{ base: '-3.5rem', sm: '-2rem', md: '-1.5rem' }}
          >
            <Tab _selected={{ color: '#584BAC' }} color="#A8A8A9">
              <Text
                fontSize={{ base: '11.6px', xs: 'small', sm: 'lg', md: '2xl' }}
              >
                Wash & Iron{' '}
              </Text>
            </Tab>
            <Tab _selected={{ color: '#584BAC' }} color="#A8A8A9">
              <Text
                fontSize={{ base: '11.6px', xs: 'small', sm: 'lg', md: '2xl' }}
              >
                Power Clean{' '}
              </Text>
            </Tab>
            <Tab _selected={{ color: '#584BAC' }} color="#A8A8A9">
              <Text
                fontSize={{ base: '11.6px', xs: 'small', sm: 'lg', md: '2xl' }}
              >
                Dry Clean{' '}
              </Text>
            </Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <OrderCard2 index={0} />
            </TabPanel>
            <TabPanel>
              <OrderCard2 index={1} />
            </TabPanel>
            <TabPanel>
              <OrderCard2 index={2} />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Box>
    </>
  );
}

export default OrderList;
