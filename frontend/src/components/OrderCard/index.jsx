import {
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  Image,
  NumberDecrementStepper,
  NumberIncrementStepper,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  Select,
  Stack,
  Tag,
  TagLabel,
  TagLeftIcon,
  Text,
  useToast,
} from '@chakra-ui/react';
import React, { useRef } from 'react';
import { HiArrowLongRight, HiMiniCurrencyRupee } from 'react-icons/hi2';
import { useNavigate } from 'react-router-dom';
import prices from '../../TempData/prices.json';
import OrderItemsAccordion from '../OrderItemsAccordion';
import useOrderStore from '../Store/OrderStore';

function OrderCard() {
  const { order, updateItems } = useOrderStore((state) => ({
    order: state.order,
    updateItems: state.updateItems,
  }));
  const quantityRefs = useRef(prices.map(() => 0));
  const washTypeRefs = useRef(prices.map(() => ''));
  const navigate = useNavigate();
  const toast = useToast();

  const handleToast = (title, description, status) => {
    toast({
      position: 'top',
      title,
      description,
      status,
      isClosable: true,
      duration: 2000,
    });
  };
  const handleCheckout = () => {
    if (order.items.length === 0) {
      handleToast(
        'Please add items before proceeding to checkout',
        '',
        'error'
      );
    } else {
      navigate('/CheckoutPage');
    }
  };
  const handleAddItems = () => {
    const newItems = [];
    prices.forEach((item, index) => {
      const quantity = quantityRefs.current[index];
      const washType = washTypeRefs.current[index];

      if (quantity > 0 && washType) {
        const pricePerItem = item.prices[washType] || 0;
        newItems.push({
          name: item.name,
          quantity,
          washType,
          pricePerItem,
        });
      }
    });
    if (newItems.length > 0) {
      updateItems(newItems);
      handleToast('Items added in the order.', '', 'success');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      handleToast(
        'Please fill quantity and wash type before adding any item.',
        '',
        'error'
      );
    }
  };

  return (
    <>
      <Center>
        <Text mt="6rem" fontWeight={600} fontSize="2rem">
          Select & Add Items
        </Text>
      </Center>
      <Flex
        flexDirection={{ base: 'column', '2xl': 'row' }}
        gap={{ base: '3rem', '2xl': '5rem' }}
        mt="2rem"
        pb={{ base: '5rem', '2xl': '0' }}
        justifyContent="center"
        alignItems="center"
      >
        <OrderItemsAccordion />
        <Grid
          templateColumns={{
            base: 'repeat(1, 1fr)',
            lg: 'repeat(2, 1fr)',
          }}
          gap={{ base: 4, lg: 6, xl: 8 }}
          px={{ base: '1rem', xl: 0 }}
        >
          {prices.map((element, index) => {
            return (
              <GridItem key={index}>
                <Flex
                  boxShadow="0px 4px 4px 0px rgba(0, 0, 0, 0.25)"
                  borderRadius="0.5rem"
                  py="1.5rem"
                  px={{ base: '2rem', xl: '2.5rem' }}
                  align="center"
                >
                  <Flex
                    align={{ base: 'top', md: 'center' }}
                    gap={{ base: '3rem', md: '4rem' }}
                  >
                    <Stack align="center" gap="1rem">
                      <Text fontWeight={600} fontSize="1.3rem" as="u">
                        {element.name}
                      </Text>
                      <Image
                        width={{ base: '6rem', lg: '5rem', xl: '6rem' }}
                        src={`/assets/${element.image}`}
                      />
                    </Stack>
                    <Stack gap={5}>
                      <Flex
                        direction={{ base: 'column', md: 'row' }}
                        gap={{ base: '1.5rem', md: '2rem' }}
                      >
                        <Box>
                          <FormControl isRequired>
                            <FormLabel fontWeight={600}>Quantity</FormLabel>
                            <NumberInput
                              isRequired
                              allowMouseWheel
                              min={0}
                              w={{ base: 'auto', md: '5rem' }}
                              defaultValue={0}
                              onChange={(value) => {
                                quantityRefs.current[index] =
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
                        </Box>
                        <Box>
                          <FormControl isRequired>
                            <FormLabel fontWeight={600}>Washing Type</FormLabel>
                            <Select
                              isRequired
                              placeholder="Select Wash Type"
                              border="2px solid #CE1567"
                              _hover={{ border: '2px solid #CE1567' }}
                              _focus={{ border: '2px solid #CE1567' }}
                              onChange={(e) => {
                                washTypeRefs.current[index] = e.target.value;
                              }}
                            >
                              <option value="simple_wash">Simple Wash</option>
                              <option value="power_clean">Power Clean</option>
                              <option value="dry_clean">Dry Clean</option>
                            </Select>
                          </FormControl>
                        </Box>
                      </Flex>
                      <Grid
                        templateColumns={{
                          base: 'repeat(1, 1fr)',
                          md: 'repeat(2, 1fr)',
                        }}
                        columnGap={4}
                        rowGap={2}
                        boxSize="fit-content"
                      >
                        <GridItem>
                          <Tag
                            w="fit-content"
                            bg="#FFFFFF"
                            color="#CE1567"
                            border="2px solid #CE1567"
                            variant="solid"
                            size="sm"
                            px={1}
                            borderRadius="full"
                          >
                            <TagLeftIcon
                              boxSize="1rem"
                              as={HiMiniCurrencyRupee}
                            />
                            <TagLabel>
                              {`${prices[index].prices.simple_wash} - Simple Wash`}
                            </TagLabel>
                          </Tag>
                        </GridItem>
                        <GridItem>
                          <Tag
                            w="fit-content"
                            bg="#FFFFFF"
                            color="#CE1567"
                            border="2px solid #CE1567"
                            variant="solid"
                            size="sm"
                            px={1}
                            borderRadius="full"
                          >
                            <TagLeftIcon
                              boxSize="1rem"
                              as={HiMiniCurrencyRupee}
                            />
                            <TagLabel>
                              {`${prices[index].prices.power_clean} - Power Clean`}
                            </TagLabel>
                          </Tag>
                        </GridItem>
                        <GridItem>
                          <Tag
                            w="fit-content"
                            bg="#FFFFFF"
                            color="#CE1567"
                            border="2px solid #CE1567"
                            variant="solid"
                            size="sm"
                            px={1}
                            borderRadius="full"
                          >
                            <TagLeftIcon
                              boxSize="1rem"
                              as={HiMiniCurrencyRupee}
                            />
                            <TagLabel>
                              {`${prices[index].prices.dry_clean} - Dry Clean`}
                            </TagLabel>
                          </Tag>
                        </GridItem>
                      </Grid>
                    </Stack>
                  </Flex>
                </Flex>
              </GridItem>
            );
          })}
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
        </Grid>
      </Flex>
    </>
  );
}

export default OrderCard;
