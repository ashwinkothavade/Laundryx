import {
  Button,
  FormControl,
  FormLabel,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Select,
  Stack,
  useToast,
} from '@chakra-ui/react';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { getSettings, rescheduleOrder } from '../../utils/apis';

function RescheduleModal({ isOpen, onClose, order, onRescheduled }) {
  const [timeSlots, setTimeSlots] = useState([]);
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [saving, setSaving] = useState(false);
  const toast = useToast();

  useEffect(() => {
    if (!isOpen) return;
    getSettings()
      .then((res) => setTimeSlots(res.data.settings?.timeSlots || []))
      .catch(() => setTimeSlots([]));
    if (order) {
      setPickupDate(order.pickupDate || '');
      setPickupTime(order.pickupTime || '');
      setDeliveryTime(order.deliveryTime || '');
    }
  }, [isOpen, order]);

  const dateOptions = [0, 1, 2].map((d) =>
    moment().add(d, 'days').format('ddd, D MMM YYYY')
  );

  const submit = async () => {
    setSaving(true);
    try {
      const res = await rescheduleOrder(order._id, {
        pickupDate,
        pickupTime,
        deliveryTime,
      });
      toast({
        position: 'top',
        title: 'Order rescheduled',
        status: 'success',
        duration: 2000,
      });
      if (onRescheduled) onRescheduled(res.data.updatedOrder);
      onClose();
    } catch (err) {
      toast({
        position: 'top',
        title: 'Could not reschedule',
        description: err.response?.data?.message || '',
        status: 'error',
        duration: 2500,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered>
      <ModalOverlay />
      <ModalContent maxWidth={{ base: '90vw', md: '420px' }}>
        <ModalHeader>Reschedule order</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Stack gap={4}>
            <FormControl>
              <FormLabel>Pickup date</FormLabel>
              <Select
                focusBorderColor="#584BAC"
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
              >
                {dateOptions.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Pickup time</FormLabel>
              <Select
                placeholder="Select time"
                focusBorderColor="#584BAC"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
              >
                {timeSlots.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </FormControl>
            <FormControl>
              <FormLabel>Delivery time</FormLabel>
              <Select
                placeholder="Select time"
                focusBorderColor="#584BAC"
                value={deliveryTime}
                onChange={(e) => setDeliveryTime(e.target.value)}
              >
                {timeSlots.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Cancel
          </Button>
          <Button
            bg="#CE1567"
            color="white"
            _hover={{ bg: '#bf0055' }}
            isLoading={saving}
            onClick={submit}
          >
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

RescheduleModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  order: PropTypes.shape({
    _id: PropTypes.string,
    pickupDate: PropTypes.string,
    pickupTime: PropTypes.string,
    deliveryTime: PropTypes.string,
  }),
  onRescheduled: PropTypes.func,
};

RescheduleModal.defaultProps = {
  order: null,
  onRescheduled: null,
};

export default RescheduleModal;
