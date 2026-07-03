import {
  Box,
  Button,
  Divider,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tr,
} from '@chakra-ui/react';
import React from 'react';
import PropTypes from 'prop-types';

const money = (n) => `₹${Number(n || 0).toFixed(2)}`;

// Build a standalone HTML receipt and print it in a clean popup window.
const printReceipt = (order) => {
  const rows = (order.items || [])
    .map(
      (i) =>
        `<tr><td>${i.name}</td><td>${i.washType}</td><td style="text-align:right">${i.quantity}</td><td style="text-align:right">${money(i.pricePerItem)}</td><td style="text-align:right">${money(i.quantity * i.pricePerItem)}</td></tr>`
    )
    .join('');
  const subtotal = order.subtotal ?? order.orderTotal ?? 0;
  const line = (label, value) =>
    `<div style="display:flex;justify-content:space-between"><span>${label}</span><span>${value}</span></div>`;
  const html = `<!doctype html><html><head><title>Receipt ${order._id}</title>
    <style>
      body{font-family:Arial,Helvetica,sans-serif;color:#222;padding:24px;max-width:640px;margin:auto}
      h1{color:#584BAC;margin:0}
      table{width:100%;border-collapse:collapse;margin:16px 0}
      th,td{border-bottom:1px solid #eee;padding:6px;text-align:left}
      .totals{margin-top:8px}
      .total{font-weight:700;font-size:1.1rem;border-top:2px solid #584BAC;padding-top:6px;margin-top:6px}
      .muted{color:#777;font-size:0.9rem}
    </style></head><body>
    <h1>LaundriX</h1>
    <p class="muted">Receipt · Order ${order._id}</p>
    <p class="muted">Launderer: ${order.launderer} · Handover: ${
      order.fulfilmentMode === 'self_dropoff' ? 'Self drop-off' : 'Home pickup'
    }</p>
    <table><thead><tr><th>Item</th><th>Wash</th><th style="text-align:right">Qty</th><th style="text-align:right">Price</th><th style="text-align:right">Total</th></tr></thead>
    <tbody>${rows}</tbody></table>
    <div class="totals">
      ${line('Subtotal', money(subtotal))}
      ${order.expressCharge ? line('Express', `+${money(order.expressCharge)}`) : ''}
      ${order.discount ? line(`Discount ${order.couponCode ? `(${order.couponCode})` : ''}`, `-${money(order.discount)}`) : ''}
      ${order.tax ? line('Tax', money(order.tax)) : ''}
      <div class="total" style="display:flex;justify-content:space-between"><span>Total</span><span>${money(order.orderTotal)}</span></div>
    </div>
    <p class="muted">Thank you for using LaundriX.</p>
    </body></html>`;
  const w = window.open('', '_blank', 'width=720,height=800');
  if (!w) return;
  w.document.write(html);
  w.document.close();
  w.focus();
  w.print();
};

function InvoiceModal({ isOpen, onClose, order }) {
  if (!order) return null;
  const subtotal = order.subtotal ?? order.orderTotal ?? 0;
  const row = (label, value, color) => (
    <Flex justify="space-between" color={color}>
      <Text>{label}</Text>
      <Text>{value}</Text>
    </Flex>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered scrollBehavior="inside">
      <ModalOverlay />
      <ModalContent maxWidth={{ base: '92vw', md: '560px' }}>
        <ModalHeader color="#584BAC">Receipt</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text fontSize="sm" color="gray.500">
            Order {order._id}
          </Text>
          <Text fontSize="sm" color="gray.500">
            Launderer: {order.launderer} ·{' '}
            {order.fulfilmentMode === 'self_dropoff'
              ? 'Self drop-off'
              : 'Home pickup'}
          </Text>
          <Box overflowX="auto" my={3}>
            <Table size="sm" variant="simple" minW="24rem">
              <Thead>
                <Tr>
                  <Th>Item</Th>
                  <Th>Wash</Th>
                  <Th isNumeric>Qty</Th>
                  <Th isNumeric>Total</Th>
                </Tr>
              </Thead>
              <Tbody>
                {(order.items || []).map((i, idx) => (
                  <Tr key={idx}>
                    <Td>{i.name}</Td>
                    <Td>{i.washType}</Td>
                    <Td isNumeric>{i.quantity}</Td>
                    <Td isNumeric>{money(i.quantity * i.pricePerItem)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
          <Divider mb={2} />
          {row('Subtotal', money(subtotal))}
          {order.expressCharge
            ? row('Express', `+${money(order.expressCharge)}`)
            : null}
          {order.discount
            ? row(
                `Discount ${order.couponCode ? `(${order.couponCode})` : ''}`,
                `-${money(order.discount)}`,
                'green.600'
              )
            : null}
          {order.tax ? row('Tax', money(order.tax)) : null}
          <Divider my={2} />
          <Flex justify="space-between" fontWeight={700} fontSize="1.1rem">
            <Text>Total</Text>
            <Text>{money(order.orderTotal)}</Text>
          </Flex>
        </ModalBody>
        <ModalFooter>
          <Button variant="ghost" mr={3} onClick={onClose}>
            Close
          </Button>
          <Button
            bg="#584BAC"
            color="white"
            _hover={{ bg: '#4c4196' }}
            onClick={() => printReceipt(order)}
          >
            Print / Save PDF
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}

InvoiceModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  order: PropTypes.shape({
    _id: PropTypes.string,
    launderer: PropTypes.string,
    fulfilmentMode: PropTypes.string,
    items: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        washType: PropTypes.string,
        quantity: PropTypes.number,
        pricePerItem: PropTypes.number,
      })
    ),
    subtotal: PropTypes.number,
    expressCharge: PropTypes.number,
    discount: PropTypes.number,
    couponCode: PropTypes.string,
    tax: PropTypes.number,
    orderTotal: PropTypes.number,
  }),
};

InvoiceModal.defaultProps = {
  order: null,
};

export default InvoiceModal;
