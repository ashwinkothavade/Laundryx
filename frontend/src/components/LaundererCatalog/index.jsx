import {
  Box,
  Button,
  Center,
  Flex,
  FormControl,
  FormLabel,
  Grid,
  GridItem,
  HStack,
  IconButton,
  Input,
  Spinner,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { MdDelete, MdEdit, MdCheck, MdClose } from 'react-icons/md';
import {
  addCatalogItem,
  deleteCatalogItem,
  getMyCatalog,
  updateCatalogItem,
} from '../../utils/apis';

const emptyForm = { clothingType: '', washType: '', price: '' };

function LaundererCatalog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(emptyForm);
  const toast = useToast();

  const notify = (title, status, description = '') =>
    toast({
      position: 'top',
      title,
      description,
      status,
      duration: 2500,
      isClosable: true,
    });

  const loadCatalog = async () => {
    try {
      const res = await getMyCatalog();
      setItems(res.data.items);
    } catch (err) {
      notify('Could not load your catalog', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    const price = Number(form.price);
    if (!form.clothingType.trim() || !form.washType.trim()) {
      notify('Clothing type and wash type are required', 'error');
      return;
    }
    if (Number.isNaN(price) || price < 0) {
      notify('Enter a valid price', 'error');
      return;
    }
    try {
      const res = await addCatalogItem({
        clothingType: form.clothingType.trim(),
        washType: form.washType.trim(),
        price,
      });
      setItems((prev) => [res.data.item, ...prev]);
      setForm(emptyForm);
      notify('Item added to your catalog', 'success');
    } catch (err) {
      notify('Could not add item', 'error', err.response?.data?.message || '');
    }
  };

  const startEdit = (item) => {
    setEditingId(item._id);
    setEditForm({
      clothingType: item.clothingType,
      washType: item.washType,
      price: String(item.price),
    });
  };

  const saveEdit = async (id) => {
    const price = Number(editForm.price);
    if (
      !editForm.clothingType.trim() ||
      !editForm.washType.trim() ||
      Number.isNaN(price) ||
      price < 0
    ) {
      notify('Enter valid values', 'error');
      return;
    }
    try {
      const res = await updateCatalogItem(id, {
        clothingType: editForm.clothingType.trim(),
        washType: editForm.washType.trim(),
        price,
      });
      setItems((prev) =>
        prev.map((it) => (it._id === id ? res.data.item : it))
      );
      setEditingId(null);
      notify('Item updated', 'success');
    } catch (err) {
      notify(
        'Could not update item',
        'error',
        err.response?.data?.message || ''
      );
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteCatalogItem(id);
      setItems((prev) => prev.filter((it) => it._id !== id));
      notify('Item removed', 'success');
    } catch (err) {
      notify('Could not delete item', 'error');
    }
  };

  if (loading) {
    return (
      <Center w="100%" py="4rem">
        <Spinner size="xl" color="#584BAC" />
      </Center>
    );
  }

  return (
    <Stack w="100%" maxW="60rem" gap={8} px={{ base: '0.5rem', md: '1rem' }}>
      <Text fontSize={{ base: '1.5rem', md: '2rem' }} fontWeight="bold">
        My Catalog
      </Text>

      {/* Add form */}
      <Box
        as="form"
        onSubmit={handleAdd}
        border="2px solid #584BAC"
        borderRadius="0.8rem"
        p={{ base: '1rem', md: '1.5rem' }}
      >
        <Text fontWeight={600} mb="1rem" color="#584BAC">
          Add a new item
        </Text>
        <Flex
          direction={{ base: 'column', md: 'row' }}
          gap="1rem"
          align={{ md: 'end' }}
        >
          <FormControl isRequired>
            <FormLabel>Clothing type</FormLabel>
            <Input
              placeholder="e.g. Shirt"
              focusBorderColor="#584BAC"
              value={form.clothingType}
              onChange={(e) =>
                setForm({ ...form, clothingType: e.target.value })
              }
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Wash type</FormLabel>
            <Input
              placeholder="e.g. Simple Wash"
              focusBorderColor="#584BAC"
              value={form.washType}
              onChange={(e) => setForm({ ...form, washType: e.target.value })}
            />
          </FormControl>
          <FormControl isRequired>
            <FormLabel>Price (₹)</FormLabel>
            <Input
              type="number"
              min={0}
              placeholder="0"
              focusBorderColor="#584BAC"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
            />
          </FormControl>
          <Button
            type="submit"
            bg="#CE1567"
            color="white"
            _hover={{ bg: '#bf0055' }}
            minW={{ base: '100%', md: '8rem' }}
          >
            Add Item
          </Button>
        </Flex>
      </Box>

      {/* Items list */}
      {items.length === 0 ? (
        <Text color="gray.500">
          No items yet. Add clothing types, wash types and prices above — these
          are what your customers will order from.
        </Text>
      ) : (
        <Stack gap={3}>
          {items.map((item) => (
            <Grid
              key={item._id}
              templateColumns={{ base: '1fr', md: '1fr 1fr 0.6fr auto' }}
              gap={3}
              alignItems="center"
              border="1px solid #e2e2e2"
              borderRadius="0.6rem"
              p="0.8rem 1rem"
              boxShadow="0px 2px 4px rgba(0,0,0,0.06)"
            >
              {editingId === item._id ? (
                <>
                  <Input
                    size="sm"
                    value={editForm.clothingType}
                    focusBorderColor="#584BAC"
                    onChange={(e) =>
                      setEditForm({ ...editForm, clothingType: e.target.value })
                    }
                  />
                  <Input
                    size="sm"
                    value={editForm.washType}
                    focusBorderColor="#584BAC"
                    onChange={(e) =>
                      setEditForm({ ...editForm, washType: e.target.value })
                    }
                  />
                  <Input
                    size="sm"
                    type="number"
                    min={0}
                    value={editForm.price}
                    focusBorderColor="#584BAC"
                    onChange={(e) =>
                      setEditForm({ ...editForm, price: e.target.value })
                    }
                  />
                  <HStack justify="end">
                    <IconButton
                      aria-label="Save"
                      size="sm"
                      colorScheme="green"
                      icon={<MdCheck />}
                      onClick={() => saveEdit(item._id)}
                    />
                    <IconButton
                      aria-label="Cancel"
                      size="sm"
                      variant="ghost"
                      icon={<MdClose />}
                      onClick={() => setEditingId(null)}
                    />
                  </HStack>
                </>
              ) : (
                <>
                  <GridItem fontWeight={600}>{item.clothingType}</GridItem>
                  <GridItem color="gray.600">{item.washType}</GridItem>
                  <GridItem color="#584BAC" fontWeight={600}>
                    ₹{item.price}
                  </GridItem>
                  <HStack justify="end">
                    <IconButton
                      aria-label="Edit"
                      size="sm"
                      variant="ghost"
                      color="#584BAC"
                      icon={<MdEdit size={20} />}
                      onClick={() => startEdit(item)}
                    />
                    <IconButton
                      aria-label="Delete"
                      size="sm"
                      colorScheme="red"
                      variant="ghost"
                      icon={<MdDelete size={20} />}
                      onClick={() => handleDelete(item._id)}
                    />
                  </HStack>
                </>
              )}
            </Grid>
          ))}
        </Stack>
      )}
    </Stack>
  );
}

export default LaundererCatalog;
