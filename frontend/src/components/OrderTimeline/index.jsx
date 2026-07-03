import { Box, Flex, HStack, Text } from '@chakra-ui/react';
import React from 'react';
import PropTypes from 'prop-types';
import { AiFillCheckCircle } from 'react-icons/ai';
import { BsCircle } from 'react-icons/bs';

// Visualises an order's lifecycle from its status booleans.
function OrderTimeline({ order }) {
  const steps = [
    { label: 'Placed', done: true },
    { label: 'Accepted', done: !!order.acceptedStatus },
    { label: 'Picked up', done: !!order.pickUpStatus },
    { label: 'Delivered', done: !!order.deliveredStatus },
    { label: 'Paid', done: !!order.paid },
  ];

  return (
    <HStack align="start" spacing={0} w="100%" overflowX="auto" py={2}>
      {steps.map((step, i) => (
        <Flex
          key={step.label}
          direction="column"
          align="center"
          flex="1"
          minW="4rem"
        >
          <Flex align="center" w="100%">
            <Box
              flex="1"
              h="2px"
              bg={
                i === 0
                  ? 'transparent'
                  : steps[i - 1].done
                    ? '#38A169'
                    : '#E2E8F0'
              }
            />
            {step.done ? (
              <AiFillCheckCircle color="#38A169" size={22} />
            ) : (
              <BsCircle color="#A0AEC0" size={20} />
            )}
            <Box
              flex="1"
              h="2px"
              bg={
                i === steps.length - 1
                  ? 'transparent'
                  : step.done
                    ? '#38A169'
                    : '#E2E8F0'
              }
            />
          </Flex>
          <Text
            mt={1}
            fontSize="0.75rem"
            textAlign="center"
            color={step.done ? '#2F855A' : 'gray.500'}
            fontWeight={step.done ? 600 : 400}
          >
            {step.label}
          </Text>
        </Flex>
      ))}
    </HStack>
  );
}

OrderTimeline.propTypes = {
  order: PropTypes.shape({
    acceptedStatus: PropTypes.bool,
    pickUpStatus: PropTypes.bool,
    deliveredStatus: PropTypes.bool,
    paid: PropTypes.bool,
  }).isRequired,
};

export default OrderTimeline;
