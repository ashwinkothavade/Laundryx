import { create } from 'zustand';
import moment from 'moment';

// Create the Zustand store
const useGeneralOrderStore = create((set) => ({
  order: {
    items: [],
    orderTotal: 0,
    pickupDate: '',
    deliveryDate: '-- -- --',
    pickupTime: '',
    deliveryTime: '',
    pickupAddress: '',
    deliveryAddress: '',
  },
  updateItems: (newItems) => {
    set((state) => {
      return {
        order: {
          ...state.order,
          items: newItems,
        },
      };
    });
  },
  // Action to update OrderTotal
  updateOrderTotal: (newOrderTotal) => {
    set((state) => {
      return {
        order: {
          ...state.order,
          orderTotal: newOrderTotal,
        },
      };
    });
  },

  // Action to update PickupDate and DeliveryDate
  setPickupDate: (value) => {
    set((state) => {
      let newPickupDate;
      let newDeliveryDate;

      if (value === 'Today') {
        newPickupDate = moment().format('Do MMM YYYY');
        newDeliveryDate = moment().add(2, 'days').format('ddd, D MMM YYYY');
      } else if (value === 'Tomorrow') {
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
          pickupDate: newPickupDate,
          deliveryDate: newDeliveryDate,
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
}));
export default useGeneralOrderStore;
