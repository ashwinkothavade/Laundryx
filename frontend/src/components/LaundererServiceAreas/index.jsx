import {
  Alert,
  AlertIcon,
  Box,
  Button,
  Center,
  Checkbox,
  Flex,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { MdLocationOn } from 'react-icons/md';
import { getMe, getSettings, setLaundererAreas } from '../../utils/apis';
import { getApiErrorMessage } from '../../utils/errors';
import { useAsyncAction } from '../../hooks/useAsyncAction';

const BRAND = '#584BAC';

// Where this launderer is willing to collect from and deliver to.
//
// Areas are chosen from the admin's list rather than typed: an address the
// admin does not serve could never match a student's hostel, so letting one be
// entered would look like it worked and quietly do nothing.
function LaundererServiceAreas() {
  const [locations, setLocations] = useState([]);
  const [selected, setSelected] = useState([]);
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const toast = useToast();
  const { run, isPending } = useAsyncAction();

  useEffect(() => {
    let live = true;
    Promise.allSettled([getSettings(), getMe()])
      .then(([settings, me]) => {
        if (!live) return;
        if (settings.status === 'fulfilled') {
          setLocations(settings.value.data.settings?.locations || []);
        }
        if (me.status === 'fulfilled') {
          const areas = me.value.data.serviceAreas || [];
          setSelected(areas);
          setSaved(areas);
        }
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  const toggle = (location) =>
    setSelected((prev) =>
      prev.includes(location)
        ? prev.filter((l) => l !== location)
        : [...prev, location]
    );

  const save = () =>
    run('save', async () => {
      try {
        // Keep the admin's ordering rather than click order, so the list reads
        // the same here as everywhere else it is shown.
        const ordered = locations.filter((l) => selected.includes(l));
        const res = await setLaundererAreas(ordered);
        const stored = res.data.serviceAreas || [];
        setSelected(stored);
        setSaved(stored);
        toast({
          position: 'top',
          title: stored.length
            ? 'Service areas saved'
            : 'You now accept orders from everywhere',
          status: 'success',
          duration: 2500,
        });
      } catch (err) {
        toast({
          position: 'top',
          title: 'Could not save service areas',
          description: getApiErrorMessage(err),
          status: 'error',
          duration: 4000,
        });
      }
    });

  const dirty =
    selected.length !== saved.length ||
    selected.some((s) => !saved.includes(s));

  if (loading) {
    return (
      <Center w="100%" py="2rem">
        <Spinner color={BRAND} />
      </Center>
    );
  }

  return (
    <Box
      w="100%"
      maxW="42rem"
      border="1px solid #e2e2e2"
      borderRadius="0.75rem"
      p={{ base: '1rem', md: '1.5rem' }}
      bg="white"
      boxShadow="0px 2px 6px rgba(0,0,0,0.04)"
    >
      <Flex align="center" gap={2} mb="0.25rem">
        <Box as={MdLocationOn} color={BRAND} size={22} />
        <Text fontWeight={700} fontSize="1.1rem" color="gray.800">
          Where you serve
        </Text>
      </Flex>
      <Text fontSize="sm" color="gray.500" mb="1rem">
        Students outside these areas won’t see you or be able to order.
      </Text>

      {locations.length === 0 ? (
        <Alert status="info" borderRadius="md" fontSize="sm">
          <AlertIcon />
          No pickup points have been set up yet. An admin adds these before
          launderers can choose between them.
        </Alert>
      ) : (
        <Stack gap={4}>
          <SimpleGrid columns={{ base: 2, md: 3 }} spacing={3}>
            {locations.map((location) => (
              <Checkbox
                key={location}
                colorScheme="purple"
                isChecked={selected.includes(location)}
                onChange={() => toggle(location)}
              >
                <Text fontSize="0.95rem">{location}</Text>
              </Checkbox>
            ))}
          </SimpleGrid>

          {/* An empty selection is permissive, not restrictive — worth saying
              plainly, because the opposite is the natural assumption. */}
          {selected.length === 0 && (
            <Alert status="info" borderRadius="md" fontSize="sm">
              <AlertIcon />
              Nothing selected means you accept orders from every area.
            </Alert>
          )}

          <Flex align="center" gap={3}>
            <Button
              bg={BRAND}
              color="white"
              _hover={{ bg: '#473a93' }}
              onClick={save}
              isLoading={isPending('save')}
              loadingText="Saving"
              isDisabled={!dirty}
            >
              Save areas
            </Button>
            {dirty && (
              <Text fontSize="sm" color="gray.500">
                Unsaved changes
              </Text>
            )}
          </Flex>
        </Stack>
      )}
    </Box>
  );
}

export default LaundererServiceAreas;
