import {
  Accordion,
  AccordionButton,
  AccordionItem,
  AccordionPanel,
  Box,
  Divider,
  Flex,
  Image,
  Text,
} from '@chakra-ui/react';
import React from 'react';
import { MdOutlineLocationSearching } from 'react-icons/md';

function PastOrderCard() {
  return (
    <Accordion
      allowToggle
      border="2px solid lightgray"
      shadow="lg"
      borderRadius="1rem"
      w="75rem"
    >
      <AccordionItem border="none" w="75rem">
        <AccordionButton justifyContent="space-between" w="75rem">
          <Flex
            w="75rem"
            direction="column"
            align="start"
            pl="1rem"
            py="0.7rem"
          >
            <Text fontSize="1.5rem">
              Order #: <span style={{ color: '#CE1567' }}>{'<order_id>'}</span>
            </Text>
            <Text color="gray" fontSize="1.2rem">
              Mon, July 3rd
            </Text>
          </Flex>{' '}
          <Text fontWeight="bold" fontSize="1.5rem" mr="1rem">
            ₹120
          </Text>
        </AccordionButton>
        <AccordionPanel pb={4} w="75rem">
          <Divider borderColor="lightgray" w="73rem" />
          <Flex
            direction="column"
            w="40rem"
            pr="1rem"
            py="1rem"
            fontSize="1.2rem"
          >
            <Flex justify="space-between" w="40rem" pl="1rem" pr="3rem">
              <Box>
                <Text color="#584bac" fontWeight="semibold">
                  Wash and Iron
                </Text>
                <Text>Shirt: x</Text>
                <Text>Pant: x</Text>
              </Box>
              <Box>
                <Text color="#584bac" fontWeight="semibold">
                  Power Clean
                </Text>
                <Text>Shirt: x</Text>
                <Text>Pant: x</Text>
              </Box>
              <Box>
                <Text color="#584bac" fontWeight="semibold">
                  Dry Clean
                </Text>
                <Text>Shirt: x</Text>
                <Text>Pant: x</Text>
              </Box>
            </Flex>
            <Divider borderColor="lightgray" mt="1rem" w="73rem" />
            <Flex mt="1rem" w="60rem" pl="1rem">
              <Flex align="center" w="30rem">
                <Image
                  src="assets/Laundrix/Outline/Calendar-Add/24px.svg"
                  boxSize="2rem"
                />
                <Text color="#CE1567" fontWeight="medium">
                  Pickup Time:
                </Text>
                <Text ml="0.5rem">12:00 PM</Text>
              </Flex>
              <Flex align="center" w="30rem">
                <Image
                  src="assets/Laundrix (1)/Outline/Calendar-Check/24px.svg"
                  boxSize="2rem"
                />
                <Text color="#CE1567" fontWeight="medium">
                  Delivery Time:
                </Text>
                <Text ml="0.5rem">12:00 PM</Text>
              </Flex>
              <Flex align="center" w="30rem">
                <Image
                  src="assets/Laundrix (1)/Outline/Calendar-Check/24px.svg"
                  boxSize="2rem"
                />
                <Text color="#CE1567" fontWeight="medium">
                  Delivery Date:
                </Text>
                <Text ml="0.5rem">Mon, July 5th</Text>
              </Flex>
            </Flex>
            <Flex mt="1rem" w="36rem" pl="1rem" justify="space-between">
              <Flex>
                <MdOutlineLocationSearching color="#CE1567" size="1.6rem" />
                <Text color="#CE1567">Pickup Address:</Text>
                <Text ml="0.5rem">Panini B</Text>
              </Flex>
              <Flex>
                <MdOutlineLocationSearching color="#CE1567" size="1.6rem" />
                <Text color="#CE1567">Pickup Address:</Text>
                <Text ml="0.5rem">Panini B</Text>
              </Flex>
            </Flex>
          </Flex>
        </AccordionPanel>
      </AccordionItem>
    </Accordion>
  );
}
export default PastOrderCard;
