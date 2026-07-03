import {
  Button,
  HStack,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { AiFillStar } from 'react-icons/ai';
import { createReview } from '../../utils/apis';

function RateOrderModal({ isOpen, onClose, order, onRated }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const toast = useToast();

  const submit = async () => {
    if (rating < 1) {
      toast({
        position: 'top',
        title: 'Pick a rating first',
        status: 'error',
        duration: 2000,
      });
      return;
    }
    setSubmitting(true);
    try {
      await createReview({ orderId: order._id, rating, comment });
      toast({
        position: 'top',
        title: 'Thanks for your review!',
        status: 'success',
        duration: 2000,
      });
      if (onRated) onRated(order._id);
      onClose();
    } catch (err) {
      toast({
        position: 'top',
        title: 'Could not submit review',
        description: err.response?.data?.message || '',
        status: 'error',
        duration: 2500,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent maxWidth={{ base: '90vw', md: '440px' }}>
        <ModalHeader>Rate {order?.launderer}</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <HStack justify="center" mb="1rem">
            {[1, 2, 3, 4, 5].map((star) => (
              <AiFillStar
                key={star}
                size={34}
                cursor="pointer"
                color={(hover || rating) >= star ? '#F6AD55' : '#E2E8F0'}
                onMouseEnter={() => setHover(star)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(star)}
              />
            ))}
          </HStack>
          <Text mb="0.5rem" fontSize="sm" color="gray.600">
            Leave a comment (optional)
          </Text>
          <Textarea
            value={comment}
            maxLength={500}
            focusBorderColor="#584BAC"
            placeholder="How was the service?"
            onChange={(e) => setComment(e.target.value)}
          />
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            bg="#CE1567"
            color="white"
            _hover={{ bg: '#bf0055' }}
            isLoading={submitting}
            onClick={submit}
          >
            Submit
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

RateOrderModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  order: PropTypes.shape({
    _id: PropTypes.string,
    launderer: PropTypes.string,
  }),
  onRated: PropTypes.func,
};

RateOrderModal.defaultProps = {
  order: null,
  onRated: null,
};

export default RateOrderModal;
