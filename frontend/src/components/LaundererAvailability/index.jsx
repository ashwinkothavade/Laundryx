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
  getSettings,
  setLaundererAvailability,
  setLaundererExpress,
} from '../../utils/apis';
import { useAsyncAction } from '../../hooks/useAsyncAction';

function LaundererAvailability() {
  const [slots, setSlots] = useState([]);
  const [platformSlots, setPlatformSlots] = useState([]);
  const [input, setInput] = useState('');
  const [express, setExpress] = useState('');
  const toast = useToast();
  const { run, isPending, busy } = useAsyncAction();

  useEffect(() => {
    let live = true;
    Promise.allSettled([getMe(), getSettings()]).then(([me, settings]) => {
      if (!live) return;
      if (me.status === 'fulfilled') {
        setSlots(me.value.data.availableTimeSlots || []);
        setExpress(String(me.value.data.expressSurcharge ?? 0));
      }
      if (settings.status === 'fulfilled') {
        setPlatformSlots(settings.value.data.settings?.timeSlots || []);
      }
    });
    return () => {
      live = false;
    };
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
              <TagCloseButton
                isDisabled={busy}
                onClick={() => run(`remove-${s}`, () => remove(s))}
              />
            </Tag>
          </WrapItem>
        ))}
        {slots.length === 0 && (
          <Text fontSize="sm" color="gray.400">
            Using platform default slots.
          </Text>
        )}
      </Wrap>
      {/* The platform's own slots, one click each. Typing a time that does not
          match the format the rest of the app uses produces a slot students
          can technically book but nobody recognises. */}
      {platformSlots.filter((s) => !slots.includes(s)).length > 0 && (
        <Box mb="0.75rem">
          <Text fontSize="xs" color="gray.500" mb="0.35rem">
            Add a standard slot:
          </Text>
          <Wrap>
            {platformSlots
              .filter((slot) => !slots.includes(slot))
              .map((slot) => (
                <WrapItem key={slot}>
                  <Button
                    size="xs"
                    variant="outline"
                    colorScheme="purple"
                    borderRadius="full"
                    isDisabled={busy}
                    isLoading={isPending(`add-${slot}`)}
                    onClick={() =>
                      run(`add-${slot}`, () => persist([...slots, slot]))
                    }
                  >
                    + {slot}
                  </Button>
                </WrapItem>
              ))}
          </Wrap>
        </Box>
      )}
      <HStack maxW="24rem">
        <Input
          size="sm"
          placeholder="Or a custom time, e.g. 09:00 AM"
          focusBorderColor="#584BAC"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && add()}
        />
        <Button
          size="sm"
          colorScheme="purple"
          isLoading={isPending('add-slot')}
          isDisabled={busy}
          onClick={() => run('add-slot', add)}
        >
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
        <Button
          size="sm"
          colorScheme="purple"
          isLoading={isPending('save-express')}
          loadingText="Saving"
          isDisabled={busy}
          onClick={() => run('save-express', saveExpress)}
        >
          Save
        </Button>
      </HStack>
    </Box>
  );
}

export default LaundererAvailability;
