import {
  Box,
  Button,
  Divider,
  HStack,
  Input,
  Tag,
  TagCloseButton,
  TagLabel,
  Text,
  Wrap,
  WrapItem,
  useToast,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import {
  getMe,
  setLaundererAvailability,
  setLaundererExpress,
} from '../../utils/apis';

function LaundererAvailability() {
  const [slots, setSlots] = useState([]);
  const [input, setInput] = useState('');
  const [express, setExpress] = useState('');
  const toast = useToast();

  useEffect(() => {
    getMe()
      .then((res) => {
        setSlots(res.data.availableTimeSlots || []);
        setExpress(String(res.data.expressSurcharge ?? 0));
      })
      .catch(() => setSlots([]));
  }, []);

  const saveExpress = async () => {
    const value = Number(express);
    if (Number.isNaN(value) || value < 0) {
      toast({
        position: 'top',
        title: 'Enter a valid amount',
        status: 'error',
        duration: 2000,
      });
      return;
    }
    try {
      await setLaundererExpress(value);
      toast({
        position: 'top',
        title: 'Express service saved',
        status: 'success',
        duration: 2000,
      });
    } catch (err) {
      toast({
        position: 'top',
        title: 'Could not save express service',
        status: 'error',
        duration: 2000,
      });
    }
  };

  const persist = async (next) => {
    setSlots(next);
    try {
      await setLaundererAvailability(next);
    } catch (err) {
      toast({
        position: 'top',
        title: 'Could not save availability',
        status: 'error',
        duration: 2000,
      });
    }
  };

  const add = () => {
    const value = input.trim();
    if (!value || slots.includes(value)) return;
    persist([...slots, value]);
    setInput('');
  };

  const remove = (value) => persist(slots.filter((s) => s !== value));

  return (
    <Box
      border="1px solid #e2e2e2"
      borderRadius="0.6rem"
      p={{ base: '1rem', md: '1.25rem' }}
      w="100%"
      maxW="60rem"
    >
      <Text fontWeight={600} mb="0.25rem" color="#584BAC">
        Your available time slots
      </Text>
      <Text fontSize="sm" color="gray.500" mb="0.75rem">
        Customers will only be able to pick these times. Leave empty to use the
        platform default slots.
      </Text>
      <Wrap mb="0.75rem">
        {slots.map((s) => (
          <WrapItem key={s}>
            <Tag colorScheme="purple" borderRadius="full">
              <TagLabel>{s}</TagLabel>
              <TagCloseButton onClick={() => remove(s)} />
            </Tag>
          </WrapItem>
        ))}
        {slots.length === 0 && (
          <Text fontSize="sm" color="gray.400">
            Using platform default slots.
          </Text>
        )}
      </Wrap>
      <HStack maxW="24rem">
        <Input
          size="sm"
          placeholder="e.g. 09:00 AM"
          focusBorderColor="#584BAC"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <Button size="sm" colorScheme="purple" onClick={add}>
          Add
        </Button>
      </HStack>

      <Divider my="1rem" />
      <Text fontWeight={600} mb="0.25rem" color="#584BAC">
        Express service
      </Text>
      <Text fontSize="sm" color="gray.500" mb="0.75rem">
        Flat surcharge for express turnaround. Set 0 to not offer it.
      </Text>
      <HStack maxW="24rem">
        <Input
          size="sm"
          type="number"
          min={0}
          placeholder="e.g. 50"
          focusBorderColor="#584BAC"
          value={express}
          onChange={(e) => setExpress(e.target.value)}
        />
        <Button size="sm" colorScheme="purple" onClick={saveExpress}>
          Save
        </Button>
      </HStack>
    </Box>
  );
}

export default LaundererAvailability;
