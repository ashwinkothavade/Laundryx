import { Box, Button, Text, VStack } from '@chakra-ui/react';
import PropTypes from 'prop-types';
import React from 'react';

// Shown where a list would be, when the list is empty.
//
// Tables previously rendered their headers over nothing, which reads as a
// failed load rather than "there is nothing here yet". Distinguishing the two
// cases matters: a filter that hides every row looks identical to having no
// orders at all, and what the person should do next is different.
function EmptyState({ title, description, action, onAction }) {
  return (
    <Box
      border="1px dashed"
      borderColor="gray.300"
      borderRadius="0.75rem"
      py="3rem"
      px="2rem"
      w="100%"
    >
      <VStack spacing={2}>
        <Text fontSize="1.05rem" fontWeight={600} color="gray.700">
          {title}
        </Text>
        {description ? (
          <Text fontSize="0.95rem" color="gray.500" textAlign="center">
            {description}
          </Text>
        ) : null}
        {action && onAction ? (
          <Button
            mt={3}
            size="sm"
            bg="#584BAC"
            color="white"
            _hover={{ bg: '#4c4196' }}
            onClick={onAction}
          >
            {action}
          </Button>
        ) : null}
      </VStack>
    </Box>
  );
}

EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.string,
  onAction: PropTypes.func,
};

EmptyState.defaultProps = {
  description: '',
  action: '',
  onAction: null,
};

export default EmptyState;
