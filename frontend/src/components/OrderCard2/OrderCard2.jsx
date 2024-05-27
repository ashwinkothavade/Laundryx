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
} from '@chakra-ui/react';
import { DotLottiePlayer } from '@dotlottie/react-player';
import '@dotlottie/react-player/dist/index.css';
import React, { useRef } from 'react';
import { HiArrowLongRight, HiMiniCurrencyRupee } from 'react-icons/hi2';
import prices from '../../TempData/prices.json';
import useGeneralOrderStore from '../Store/OrderStore_';

function OrderCard2() {
  console.log('order card rendered');
  const { order, updateItems } = useGeneralOrderStore();
  const quantityRefs = useRef(prices.map(() => 0));
  const washTypeRefs = useRef(prices.map(() => ''));

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
      console.log('items: ', order.items);
    }
  };

  return (
    <>
      <Center>
        <Text mt="5rem" fontWeight={600} fontSize="2.2rem">
          Select & Add Items
        </Text>
      </Center>
      <Flex
        flexDirection={{ base: 'column', xl: 'row' }}
        gap={{ base: '3rem', xl: '5rem' }}
        mt="2rem"
        justifyContent="center"
        alignItems="center"
      >
        <DotLottiePlayer
          src="Child.lottie"
          style={{ height: '40rem', width: '40rem' }}
          autoplay
          loop
          playMode="bounce"
        />
        <Stack>
          {/* <Alert status="info" variant="left-accent">
            <AlertIcon />
            Select wash type to view price per item.
          </Alert> */}
          <Grid templateColumns="repeat(2, 1fr)" rowGap={8} columnGap={6}>
            {prices.map((element, index) => {
              return (
                <GridItem key={index}>
                  <Flex
                    boxShadow="0px 4px 4px 0px rgba(0, 0, 0, 0.25)"
                    borderRadius="0.5rem"
                    py="1.5rem"
                    px="2rem"
                    alignItems="center"
                  >
                    <Flex align="center" gap="3rem">
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
                      <Stack gap={4}>
                        <Flex gap="2rem">
                          <Box>
                            <FormControl isRequired>
                              <FormLabel fontWeight={600}>Quantity</FormLabel>
                              <NumberInput
                                isRequired
                                allowMouseWheel
                                min={0}
                                defaultValue={0}
                                onChange={(value) => {
                                  quantityRefs.current[index] =
                                    parseInt(value, 10) || 0;
                                }}
                              >
                                <NumberInputField
                                  w="6rem"
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
                          rowGap={2}
                          columnGap={1}
                        >
                          <Tag
                            w="fit-content"
                            color="#CE1567"
                            border="2px solid #CE1567"
                            borderRadius="full"
                          >
                            <TagLeftIcon
                              boxSize="1.2rem"
                              as={HiMiniCurrencyRupee}
                            />
                            <TagLabel>
                              {`${prices[index].prices.simple_wash} - Simple Wash`}
                            </TagLabel>
                          </Tag>
                          <Tag
                            w="fit-content"
                            color="#CE1567"
                            border="2px solid #CE1567"
                            borderRadius="full"
                          >
                            <TagLeftIcon
                              boxSize="1.2rem"
                              as={HiMiniCurrencyRupee}
                            />
                            <TagLabel>
                              {`${prices[index].prices.power_clean} - Power Clean`}
                            </TagLabel>
                          </Tag>
                          <Tag
                            w="fit-content"
                            color="#CE1567"
                            border="2px solid #CE1567"
                            borderRadius="full"
                          >
                            <TagLeftIcon
                              boxSize="1.2rem"
                              as={HiMiniCurrencyRupee}
                            />
                            <TagLabel>
                              {`${prices[index].prices.dry_clean} - Dry Clean`}
                            </TagLabel>
                          </Tag>
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
                fontSize="1.2rem"
                p="1.5rem"
                _hover={{ bg: '#bf0055' }}
                onClick={handleAddItems}
              >
                Add Items
              </Button>
              <Button
                bg="#CE1567"
                color="#FFFFFF"
                fontSize="1.2rem"
                p="1.5rem"
                _hover={{ bg: '#bf0055' }}
                rightIcon={<HiArrowLongRight size={32} />}
              >
                Proceed
              </Button>
            </Flex>
          </Grid>
        </Stack>
      </Flex>
      {/* <TableContainer>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Item Name</Th>
              <Th>Quantity</Th>
              <Th>Wash Type</Th>
              <Th>Price</Th>
            </Tr>
          </Thead>
          <Tbody>
            {order.items.map((item, index) => (
              <Tr key={index}>
                <Td>{item.name}</Td>
                <Td>{item.quantity}</Td>
                <Td>{item.washType}</Td>
                <Td>{item.pricePerItem}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </TableContainer> */}
    </>
  );
}

export default OrderCard2;
