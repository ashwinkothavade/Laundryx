import {
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormLabel,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  Spinner,
  Stack,
  Tag,
  TagLabel,
  TagLeftIcon,
  Text,
  useToast,
} from '@chakra-ui/react';
import React, { useEffect, useRef, useState } from 'react';
import { HiArrowLongRight, HiMiniCurrencyRupee } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import OrderItemsAccordion from '../OrderItemsAccordion';
import useOrderStore from '../Store/OrderStore';
import { fetchLaunderers, getLaundererCatalog } from '../../utils/apis';

function OrderCard() {
  const { order, updateItems, clearItems, setLaunderer } = useOrderStore(
    (state) => ({
      order: state.order,
      updateItems: state.updateItems,
      clearItems: state.clearItems,
      setLaunderer: state.setLaunderer,
    })
  );

  const [launderers, setLaunderers] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const quantityRefs = useRef({});
  const [formKey, setFormKey] = useState(0);
  const navigate = useNavigate();
  const toast = useToast();

  const handleToast = (title, description, status) =>
    toast({
      position: 'top',
      title,
      description,
      status,
      isClosable: true,
      duration: 2000,
    });

  // Load the list of launderers to choose from.
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetchLaunderers();
        setLaunderers(res.data.launderers || res.data || []);
      } catch (err) {
        handleToast('Could not load launderers', '', 'error');
      }
    };
    load();
  }, []);

  // Load the chosen launderer's catalog whenever the selection changes.
  const loadCatalog = async (username) => {
    if (!username) {
      setCatalog([]);
      return;
    }
    setLoadingCatalog(true);
    try {
      const res = await getLaundererCatalog(username);
      setCatalog(res.data.items || []);
    } catch (err) {
      setCatalog([]);
      handleToast('Could not load this launderer’s catalog', '', 'error');
    } finally {
      setLoadingCatalog(false);
    }
  };

  useEffect(() => {
    if (order.launderer) loadCatalog(order.launderer);
  }, []);

  const handleLaundererChange = (username) => {
    setLaunderer(username);
    // Switching launderer invalidates the current items (prices differ).
    clearItems();
    quantityRefs.current = {};
    setFormKey((k) => k + 1);
    loadCatalog(username);
  };

  const handleAddItems = () => {
    const newItems = [];
    catalog.forEach((item) => {
      const qty = quantityRefs.current[item._id] || 0;
      if (qty > 0) {
        newItems.push({
          name: item.clothingType,
          washType: item.washType,
          quantity: qty,
          pricePerItem: item.price,
        });
      }
    });
    if (newItems.length === 0) {
      handleToast('Set a quantity on at least one item first.', '', 'error');
      return;
    }
    updateItems(newItems);
    handleToast('Items added to the order.', '', 'success');
    quantityRefs.current = {};
    setFormKey((k) => k + 1);
  };

  const handleCheckout = () => {
    if (order.items.length === 0) {
      handleToast(
        'Please add items before proceeding to checkout',
        '',
        'error'
      );
      return;
    }
    navigate('/CheckoutPage');
  };

  return (
    <>
      <Center>
        <Text
          mt="6rem"
          fontWeight={600}
          fontSize={{ base: '1.5rem', md: '2rem' }}
        >
          Select &amp; Add Items
        </Text>
      </Center>

      <Center mt="1.5rem" px="1rem">
        <FormControl maxW="26rem">
          <FormLabel fontWeight={600}>Choose a launderer</FormLabel>
          <Select
            placeholder="Select a launderer"
            focusBorderColor="#584BAC"
            value={order.launderer}
            onChange={(e) => handleLaundererChange(e.target.value)}
          >
            {launderers.map((l) => (
              <option key={l.username} value={l.username}>
                {l.username}
              </option>
            ))}
          </Select>
        </FormControl>
      </Center>

      <Flex
        flexDirection={{ base: 'column', '2xl': 'row' }}
        gap={{ base: '3rem', '2xl': '5rem' }}
        mt="2rem"
        pb={{ base: '5rem', '2xl': '0' }}
        justifyContent="center"
        alignItems={{ base: 'center', '2xl': 'start' }}
      >
        <OrderItemsAccordion />

        <Box px={{ base: '1rem', xl: 0 }} w={{ base: '100%', xl: 'auto' }}>
          {!order.launderer ? (
            <Text color="gray.500" textAlign="center" maxW="30rem">
              Select a launderer above to see the clothing types, wash types and
              prices they offer.
            </Text>
          ) : loadingCatalog ? (
            <Center py="3rem">
              <Spinner size="lg" color="#584BAC" />
            </Center>
          ) : catalog.length === 0 ? (
            <Text color="gray.500" textAlign="center" maxW="30rem">
              This launderer hasn&apos;t added any items to their catalog yet.
            </Text>
          ) : (
            <Stack key={formKey} gap={4} w="100%" maxW="34rem">
              {catalog.map((item) => (
                <Flex
                  key={item._id}
                  boxShadow="0px 4px 4px 0px rgba(0, 0, 0, 0.25)"
                  borderRadius="0.5rem"
                  p={{ base: '1rem', md: '1.25rem' }}
                  align="center"
                  justify="space-between"
                  gap={4}
                >
                  <Box>
                    <Text fontWeight={600} fontSize="1.1rem">
                      {item.clothingType}
                    </Text>
                    <Text color="gray.600" fontSize="0.9rem">
                      {item.washType}
                    </Text>
                    <Tag
                      mt={2}
                      bg="#FFFFFF"
                      color="#CE1567"
                      border="2px solid #CE1567"
                      size="sm"
                      borderRadius="full"
                    >
                      <TagLeftIcon boxSize="1rem" as={HiMiniCurrencyRupee} />
                      <TagLabel>{item.price}</TagLabel>
                    </Tag>
                  </Box>
                  <FormControl w="auto">
                    <FormLabel fontSize="0.8rem" mb={1}>
                      Quantity
                    </FormLabel>
                    <NumberInput
                      allowMouseWheel
                      min={0}
                      w="5.5rem"
                      defaultValue={0}
                      onChange={(value) => {
                        quantityRefs.current[item._id] =
                          parseInt(value, 10) || 0;
                      }}
                    >
                      <NumberInputField
                        border="2px solid #CE1567"
                        _hover={{ border: '2px solid #CE1567' }}
                        _focus={{ border: '2px solid #CE1567' }}
                      />
                      <NumberInputStepper border="1px solid #CE1567">
                        <NumberIncrementStepper />
                        <NumberDecrementStepper />
                      </NumberInputStepper>
                    </NumberInput>
                  </FormControl>
                </Flex>
              ))}

              <Flex
                align={{ base: 'center', lg: 'end' }}
                justify={{ base: 'center', lg: 'end' }}
                gap={5}
                mt={{ base: '1rem', lg: '0' }}
              >
                <Button
                  bg="#CE1567"
                  color="#FFFFFF"
                  _hover={{ bg: '#bf0055' }}
                  onClick={handleAddItems}
                >
                  Add Items
                </Button>
                <Button
                  bg="#CE1567"
                  color="#FFFFFF"
                  _hover={{ bg: '#bf0055' }}
                  rightIcon={<HiArrowLongRight size={30} />}
                  onClick={handleCheckout}
                >
                  Proceed
                </Button>
              </Flex>
            </Stack>
          )}
        </Box>
      </Flex>
    </>
  );
}

export default OrderCard;
