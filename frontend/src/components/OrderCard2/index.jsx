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
import useGeneralOrderStore from '../Store/OrderStore_';

function OrderCard2() {
  const { order, updateItems } = useGeneralOrderStore((state) => ({
    order: state.order,
    updateItems: state.updateItems,
  }));
  const quantityRefs = useRef(prices.map(() => 0));
  const washTypeRefs = useRef(prices.map(() => ''));
  const navigate = useNavigate();
  const toast = useToast();
  // eslint-disable-next-line no-unused-vars

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
        flexDirection={{ base: 'column', xl: 'row' }}
        gap={{ base: '3rem', xl: '6rem' }}
        mt="2rem"
        justifyContent="center"
        alignItems="center"
      >
        <OrderItemsAccordion />
        <Stack>
          <Grid templateColumns="repeat(2, 1fr)" gap={8}>
            {prices.map((element, index) => {
              return (
                <GridItem key={index}>
                  <Flex
                    boxShadow="0px 4px 4px 0px rgba(0, 0, 0, 0.25)"
                    borderRadius="0.5rem"
                    py="1.5rem"
                    px="2.5rem"
                    alignItems="center"
                  >
                    <Flex align="center" gap="4rem">
                      <Stack align="center" gap="1rem">
                        <Text fontWeight={600} fontSize="1.3rem" as="u">
                          {element.name}
                        </Text>
                        <Image
                          width={{
                            base: '2.5rem',
                            xs: '3rem',
                            sm: '4rem',
                            md: '5rem',
                          }}
                          src={`/assets/${element.image}`}
                        />
                      </Stack>
                      <Stack gap={5}>
                        <Flex gap="2rem">
                          <Box>
                            <FormControl isRequired>
                              <FormLabel fontWeight={600}>Quantity</FormLabel>
                              <NumberInput
                                isRequired
                                allowMouseWheel
                                min={0}
                                w="5rem"
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
                              <FormLabel fontWeight={600}>
                                Washing Type
                              </FormLabel>
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
                          templateColumns="repeat(2, 1fr)"
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
            <Flex align="end" justify="end" gap={5}>
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
                onClick={() => navigate('/CheckoutPage')}
              >
                Proceed
              </Button>
            </Flex>
          </Grid>
        </Stack>
      </Flex>
    </>
  );
}

export default OrderCard2;
