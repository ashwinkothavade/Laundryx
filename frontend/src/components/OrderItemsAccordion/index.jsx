import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
  Button,
  HStack,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import { LuIndianRupee } from 'react-icons/lu';
import useOrderStore from '../Store/OrderStore';

function OrderItemsAccordion() {
  const { order, clearItems } = useOrderStore();
  const toast = useToast();

  const handleClear = () => {
    clearItems();
    toast({
      position: 'top',
      title: 'Items have been removed from the order.',
      description: '',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
  };
  const segregateItemsByWashType = () => {
    return order.items.reduce((acc, item) => {
      if (!acc[item.washType]) {
        acc[item.washType] = [];
      }
      acc[item.washType].push(item);
      return acc;
    }, {});
  };
  const segregateItems = segregateItemsByWashType();

  return (
    <Stack align="center" gap={6}>
      <Text fontWeight={600} fontSize="1.5rem">
        Items Added
      </Text>
      <Stack
        px={{ base: '1rem', lg: '2rem' }}
        py="1rem"
        borderRadius="1rem"
        w={{ base: '22rem', lg: '25rem' }}
        border="2px solid gray"
        boxShadow="0px 0px 20px 0px rgba(0, 0, 0, 0.20)"
      >
        <Accordion allowToggle>
          {Object.keys(segregateItems).map((washType) => (
            <AccordionItem key={washType} border="none" my={5}>
              <AccordionButton
                justifyContent="space-between"
                color="#584BAC"
                fontSize="1.2rem"
                fontWeight={600}
                borderRadius={25}
                p={0}
                px={3}
                _expanded={{ bg: '#E6E6E6' }}
              >
                <span>
                  {washType
                    .split('_')
                    .map(
                      (word) =>
                        word.charAt(0).toUpperCase() +
                        word.slice(1).toLowerCase()
                    )
                    .join(' ')}
                </span>
                <AccordionIcon />
              </AccordionButton>
              <AccordionPanel>
                {segregateItems[washType].map((item, index) => (
                  <HStack key={index} mb={1} justify="space-between">
                    <Text>
                      <span style={{ fontWeight: '600' }}>
                        {item.quantity}x
                      </span>{' '}
                      {item.name}
                    </Text>
                    <HStack gap={0}>
                      <LuIndianRupee color="#CE1567" />
                      <Text color="#CE1567" fontWeight={600}>
                        {item.quantity * item.pricePerItem}
                      </Text>
                    </HStack>
                  </HStack>
                ))}
              </AccordionPanel>
            </AccordionItem>
          ))}
        </Accordion>
        <HStack justify="space-between" fontWeight={600} fontSize="1.2rem">
          <Text>Total:</Text>
          <HStack gap={0}>
            <LuIndianRupee color="#CE1567" />
            <Text color="#CE1567">{order.orderTotal}</Text>
          </HStack>
        </HStack>
      </Stack>
      <Button
        color="#FFFFFF"
        bg="#CE1567"
        _hover={{ bg: '#bf0055' }}
        onClick={handleClear}
      >
        Clear Items
      </Button>
    </Stack>
  );
}

export default OrderItemsAccordion;
