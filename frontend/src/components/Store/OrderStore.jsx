import moment from 'moment';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useOrderStore = create(
  persist(
    (set) => ({
      order: {
        items: [],
        orderTotal: 0,
        pickupDate: '',
        deliveryDate: '-- -- --',
        pickupTime: '',
        deliveryTime: '',
        pickupAddress: '',
        deliveryAddress: '',
        launderer: '',
      },

      // Action to add or update items, and if the item already exists, update the quantity
      updateItems: (newItems) => {
        set((state) => {
          const updatedItems = [...state.order.items];

          newItems.forEach((newItem) => {
            const existingItemIndex = updatedItems.findIndex(
              (item) =>
                item.name === newItem.name && item.washType === newItem.washType
            );

            if (existingItemIndex > -1) {
              updatedItems[existingItemIndex].quantity += newItem.quantity;
            } else {
              updatedItems.push(newItem);
            }
          });
          // Calculate the order total
          const updatedOrderTotal = updatedItems.reduce(
            (acc, item) => acc + item.quantity * item.pricePerItem,
            0
          );
          return {
            order: {
              ...state.order,
              items: updatedItems,
              orderTotal: updatedOrderTotal,
            },
          };
        });
      },

      clearItems: () => {
        set((state) => {
          return {
            order: {
              ...state.order,
              items: [],
              orderTotal: 0,
            },
          };
        });
      },

      // Action to update PickupDate and DeliveryDate
      setPickupDate: (value) => {
        set((state) => {
          let newPickupDate;
          let newDeliveryDate;

          if (value === '') {
            newPickupDate = '';
            newDeliveryDate = '-- -- --';
          } else if (value === moment().format('ddd, D MMM YYYY')) {
            newPickupDate = moment().format('ddd, D MMM YYYY');
            newDeliveryDate = moment().add(2, 'days').format('ddd, D MMM YYYY');
          } else if (
            value === moment().add(1, 'days').format('ddd, D MMM YYYY')
          ) {
            newPickupDate = moment().add(1, 'days').format('ddd, D MMM YYYY');
            newDeliveryDate = moment().add(3, 'days').format('ddd, D MMM YYYY');
          } else {
            newPickupDate = moment().add(2, 'days').format('ddd, D MMM YYYY');
            newDeliveryDate = moment().add(4, 'days').format('ddd, D MMM YYYY');
          }

          return {
            ...state,
            order: {
              ...state.order,
              pickupDate: String(newPickupDate),
              deliveryDate: String(newDeliveryDate),
            },
          };
        });
      },
      // Action to update PickupTime
      setPickupTime: (value) => {
        set((state) => {
          return {
            ...state,
            order: {
              ...state.order,
              pickupTime: value,
            },
          };
        });
      },

      // Action to update DeliveryTime
      setDeliveryTime: (value) => {
        set((state) => {
          return {
            ...state,
            order: {
              ...state.order,
              deliveryTime: value,
            },
          };
        });
      },

      // Action to update PickupAddress
      setPickupAddress: (value) => {
        set((state) => {
          return {
            ...state,
            order: {
              ...state.order,
              pickupAddress: value,
            },
          };
        });
      },

      // Action to update DeliveryAddress
      setDeliveryAddress: (value) => {
        set((state) => {
          return {
            ...state,
            order: {
              ...state.order,
              deliveryAddress: value,
            },
          };
        });
      },

      // Action to update Launderer
      setLaunderer: (value) => {
        set((state) => {
          return {
            ...state,
            order: {
              ...state.order,
              launderer: value,
            },
          };
        });
      },

      clearSchedule: () => {
        set((state) => {
          return {
            ...state,
            order: {
              ...state.order,
              pickupDate: '',
              deliveryDate: '-- -- --',
              pickupTime: '',
              deliveryTime: '',
              pickupAddress: '',
              deliveryAddress: '',
              launderer: '',
            },
          };
        });
      },
    }),
    {
      name: 'order-store',
      getStorage: () => sessionStorage,
    }
  )
);
export default useOrderStore;
