import {
  Box,
  Button,
  Center,
  Divider,
  Flex,
  Grid,
  GridItem,
  HStack,
  Icon,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  SimpleGrid,
  Spinner,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { HiArrowLongRight } from 'react-icons/hi2';
import { LuIndianRupee } from 'react-icons/lu';
import {
  MdStorefront,
  MdEdit,
  MdShoppingBasket,
  MdCheck,
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';
import LaundererPicker from '../LaundererPicker';
import useOrderStore from '../Store/OrderStore';
import { getLaundererCatalog } from '../../utils/apis';

const BRAND = '#584BAC';
const ACCENT = '#CE1567';

function OrderCard() {
  const { order, updateItems, clearItems, setLaunderer } = useOrderStore(
    (state) => ({
      order: state.order,
      updateItems: state.updateItems,
      clearItems: state.clearItems,
      setLaunderer: state.setLaunderer,
    })
  );

  const [catalog, setCatalog] = useState([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);
  const [quantities, setQuantities] = useState({});
  const [changing, setChanging] = useState(false);
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
    setQuantities({});
    setChanging(false);
    loadCatalog(username);
  };

  const setQty = (id, value) =>
    setQuantities((prev) => ({ ...prev, [id]: parseInt(value, 10) || 0 }));

  // Live preview of what the "Add" button will add.
  const pending = useMemo(() => {
    let count = 0;
    let total = 0;
    catalog.forEach((item) => {
      const qty = quantities[item._id] || 0;
      count += qty;
      total += qty * item.price;
    });
    return { count, total };
  }, [quantities, catalog]);

  const priceRange = useMemo(() => {
    if (!catalog.length) return null;
    const prices = catalog.map((c) => c.price);
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [catalog]);

  const handleAddItems = () => {
    const newItems = catalog
      .filter((item) => (quantities[item._id] || 0) > 0)
      .map((item) => ({
        name: item.clothingType,
        washType: item.washType,
        quantity: quantities[item._id],
        pricePerItem: item.price,
      }));
    if (newItems.length === 0) {
      handleToast('Set a quantity on at least one item first.', '', 'error');
      return;
    }
    updateItems(newItems);
    handleToast('Items added to the order.', '', 'success');
    setQuantities({});
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

  const showPicker = !order.launderer || changing;

  return (
    <Box
      maxW="78rem"
      mx="auto"
      px={{ base: '1rem', md: '2rem' }}
      pt={{ base: '5.5rem', md: '6.5rem' }}
      pb="4rem"
    >
      <Box mb="2rem">
        <Text fontWeight={700} fontSize={{ base: '1.6rem', md: '2rem' }}>
          Select &amp; Add Items
        </Text>
        <Text color="gray.500">
          Choose a launderer, then add the items you want cleaned.
        </Text>
      </Box>

      <Grid
        templateColumns={{ base: '1fr', lg: '1fr 22rem' }}
        gap={{ base: '2rem', lg: '2.5rem' }}
        alignItems="start"
      >
        {/* ---- Main column: launderer + catalog ---- */}
        <GridItem>
          {/* Step 1 — launderer */}
          <StepHeader
            n={1}
            title="Choose a launderer"
            done={!!order.launderer && !changing}
          />

          {showPicker ? (
            <Box mb="2.5rem">
              <LaundererPicker
                selected={order.launderer}
                onSelect={handleLaundererChange}
              />
              {changing && (
                <Button
                  mt="1rem"
                  size="sm"
                  variant="ghost"
                  onClick={() => setChanging(false)}
                >
                  Cancel
                </Button>
              )}
            </Box>
          ) : (
            <Flex
              mb="2.5rem"
              align="center"
              justify="space-between"
              gap={3}
              border="1px solid #e2e2e2"
              borderLeft={`4px solid ${ACCENT}`}
              borderRadius="0.75rem"
              bg="white"
              p="1rem 1.25rem"
              boxShadow="0px 2px 6px rgba(0,0,0,0.05)"
            >
              <HStack spacing={3}>
                <Flex
                  boxSize="2.75rem"
                  align="center"
                  justify="center"
                  borderRadius="0.6rem"
                  bg="#FFF0F6"
                  flexShrink={0}
                >
                  <Icon as={MdStorefront} boxSize="1.5rem" color={ACCENT} />
                </Flex>
                <Box>
                  <Text fontWeight={700} fontSize="1.1rem" lineHeight="1.2">
                    {order.launderer}
                  </Text>
                  <Text fontSize="sm" color="gray.500">
                    {catalog.length} item{catalog.length === 1 ? '' : 's'}
                    {priceRange
                      ? ` · ₹${priceRange.min}–₹${priceRange.max}`
                      : ''}
                  </Text>
                </Box>
              </HStack>
              <Button
                size="sm"
                variant="outline"
                colorScheme="purple"
                leftIcon={<MdEdit />}
                onClick={() => setChanging(true)}
              >
                Change
              </Button>
            </Flex>
          )}

          {/* Step 2 — items */}
          <StepHeader n={2} title="Add items" muted={!order.launderer} />

          {!order.launderer ? (
            <EmptyHint>
              Select a launderer above to see the clothing types, wash types and
              prices they offer.
            </EmptyHint>
          ) : loadingCatalog ? (
            <Center py="3rem">
              <Spinner size="lg" color={BRAND} />
            </Center>
          ) : catalog.length === 0 ? (
            <EmptyHint>
              This launderer hasn&apos;t added any items to their catalog yet.
            </EmptyHint>
          ) : (
            <>
              <SimpleGrid columns={{ base: 1, sm: 2, xl: 3 }} spacing={4}>
                {catalog.map((item) => {
                  const qty = quantities[item._id] || 0;
                  const active = qty > 0;
                  return (
                    <Box
                      key={item._id}
                      border="1px solid"
                      borderColor={active ? ACCENT : '#e2e2e2'}
                      bg={active ? '#FFF5FA' : 'white'}
                      borderRadius="0.75rem"
                      p="1rem"
                      transition="0.15s"
                      boxShadow="0px 2px 6px rgba(0,0,0,0.05)"
                      _hover={{ borderColor: ACCENT }}
                    >
                      <Flex justify="space-between" align="start" mb="0.75rem">
                        <Box pr={2}>
                          <Text fontWeight={700} noOfLines={1}>
                            {item.clothingType}
                          </Text>
                          <Text
                            color="gray.500"
                            fontSize="0.85rem"
                            noOfLines={1}
                          >
                            {item.washType}
                          </Text>
                        </Box>
                        <HStack gap={0} color={ACCENT} flexShrink={0}>
                          <Icon as={LuIndianRupee} boxSize="0.9rem" />
                          <Text fontWeight={700}>{item.price}</Text>
                        </HStack>
                      </Flex>
                      <NumberInput
                        allowMouseWheel
                        min={0}
                        size="sm"
                        value={qty}
                        onChange={(v) => setQty(item._id, v)}
                        focusBorderColor={ACCENT}
                      >
                        <NumberInputField
                          placeholder="Qty"
                          borderColor={active ? ACCENT : '#e2e2e2'}
                        />
                        <NumberInputStepper>
                          <NumberIncrementStepper />
                          <NumberDecrementStepper />
                        </NumberInputStepper>
                      </NumberInput>
                    </Box>
                  );
                })}
              </SimpleGrid>

              <Button
                mt="1.5rem"
                w={{ base: '100%', sm: 'auto' }}
                bg={ACCENT}
                color="white"
                _hover={{ bg: '#bf0055' }}
                leftIcon={<MdShoppingBasket />}
                isDisabled={pending.count === 0}
                onClick={handleAddItems}
              >
                {pending.count === 0
                  ? 'Add items'
                  : `Add ${pending.count} item${
                      pending.count === 1 ? '' : 's'
                    } · ₹${pending.total}`}
              </Button>
            </>
          )}
        </GridItem>

        {/* ---- Sidebar: order summary ---- */}
        <GridItem position={{ lg: 'sticky' }} top={{ lg: '6.5rem' }} w="100%">
          <OrderSummary
            order={order}
            onClear={() => {
              clearItems();
              handleToast('Items removed from the order.', '', 'info');
            }}
            onCheckout={handleCheckout}
          />
        </GridItem>
      </Grid>
    </Box>
  );
}

/* ------------------------- small presentational bits ------------------------ */

function StepHeader({ n, title, done, muted }) {
  return (
    <HStack mb="1rem" spacing={3} opacity={muted ? 0.5 : 1}>
      <Flex
        boxSize="1.75rem"
        align="center"
        justify="center"
        borderRadius="full"
        bg={done ? '#38A169' : BRAND}
        color="white"
        fontWeight={700}
        fontSize="0.9rem"
        flexShrink={0}
      >
        {done ? <Icon as={MdCheck} boxSize="1.1rem" /> : n}
      </Flex>
      <Text fontWeight={700} fontSize="1.15rem">
        {title}
      </Text>
    </HStack>
  );
}

StepHeader.propTypes = {
  n: PropTypes.number.isRequired,
  title: PropTypes.string.isRequired,
  done: PropTypes.bool,
  muted: PropTypes.bool,
};

StepHeader.defaultProps = { done: false, muted: false };

function EmptyHint({ children }) {
  return (
    <Box
      border="1px dashed #d9d9d9"
      borderRadius="0.75rem"
      p="2rem"
      textAlign="center"
    >
      <Text color="gray.500" maxW="30rem" mx="auto">
        {children}
      </Text>
    </Box>
  );
}

EmptyHint.propTypes = {
  children: PropTypes.node.isRequired,
};

function OrderSummary({ order, onClear, onCheckout }) {
  const hasItems = order.items.length > 0;
  return (
    <Box
      border="1px solid #e2e2e2"
      borderRadius="1rem"
      bg="white"
      boxShadow="0px 4px 16px rgba(0,0,0,0.06)"
      overflow="hidden"
    >
      <Box bg={BRAND} px="1.25rem" py="1rem">
        <Text color="white" fontWeight={700} fontSize="1.1rem">
          Order Summary
        </Text>
        <Text color="whiteAlpha.800" fontSize="sm">
          {order.items.reduce((n, i) => n + i.quantity, 0)} item(s)
        </Text>
      </Box>

      <Box px="1.25rem" py="1rem">
        {!hasItems ? (
          <Text color="gray.400" fontSize="sm" py="1.5rem" textAlign="center">
            No items yet. Add items from the catalog to build your order.
          </Text>
        ) : (
          <Stack spacing={3} mb="1rem" maxH="18rem" overflowY="auto">
            {order.items.map((item, i) => (
              <Flex key={i} justify="space-between" align="start" gap={2}>
                <Box>
                  <Text fontSize="sm" fontWeight={600}>
                    {item.quantity}× {item.name}
                  </Text>
                  <Text fontSize="xs" color="gray.500">
                    {item.washType}
                  </Text>
                </Box>
                <HStack gap={0} flexShrink={0}>
                  <Icon as={LuIndianRupee} boxSize="0.8rem" color={ACCENT} />
                  <Text fontSize="sm" fontWeight={600} color={ACCENT}>
                    {item.quantity * item.pricePerItem}
                  </Text>
                </HStack>
              </Flex>
            ))}
          </Stack>
        )}

        <Divider mb="1rem" />
        <Flex justify="space-between" align="center" mb="1rem">
          <Text fontWeight={700}>Total</Text>
          <HStack gap={0}>
            <Icon as={LuIndianRupee} boxSize="1rem" color={ACCENT} />
            <Text fontWeight={700} fontSize="1.2rem" color={ACCENT}>
              {order.orderTotal}
            </Text>
          </HStack>
        </Flex>

        <Button
          w="100%"
          bg={ACCENT}
          color="white"
          _hover={{ bg: '#bf0055' }}
          rightIcon={<HiArrowLongRight size={22} />}
          isDisabled={!hasItems}
          onClick={onCheckout}
          mb="0.5rem"
        >
          Proceed to checkout
        </Button>
        <Button
          w="100%"
          variant="ghost"
          size="sm"
          colorScheme="gray"
          isDisabled={!hasItems}
          onClick={onClear}
        >
          Clear items
        </Button>
      </Box>
    </Box>
  );
}

OrderSummary.propTypes = {
  order: PropTypes.shape({
    items: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        washType: PropTypes.string,
        quantity: PropTypes.number,
        pricePerItem: PropTypes.number,
      })
    ).isRequired,
    orderTotal: PropTypes.number,
  }).isRequired,
  onClear: PropTypes.func.isRequired,
  onCheckout: PropTypes.func.isRequired,
};

export default OrderCard;
