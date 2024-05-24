import { create } from 'zustand';
import moment from 'moment';
import WashList from '../../TempData/WashList';
import PowerCleanList from '../../TempData/PowerCleanList';
import DryCleanList from '../../TempData/DryCleanList';

const initialState = {
  washList: WashList,
  powerCleanList: PowerCleanList,
  dryCleanList: DryCleanList,
  washListTotal: 0,
  powerCleanListTotal: 0,
  dryCleanListTotal: 0,
};

// Create the Zustand store
const useGeneralOrderStore = create((set) => ({
  order: {
    washList: initialState.washList,
    powerCleanList: initialState.powerCleanList,
    dryCleanList: initialState.dryCleanList,
    washListTotal: initialState.washListTotal,
    powerCleanListTotal: initialState.powerCleanListTotal,
    dryCleanListTotal: initialState.dryCleanListTotal,
    orderTotal: 0,
    pickupDate: '',
    deliveryDate: '-- -- --',
    pickupTime: '',
    deliveryTime: '',
    pickupAddress: '',
    dropAddress: '',
  },

  updateWashList: (newWashList) => {
    set((state) => {
      return {
        order: {
          ...state.order,
          washList: newWashList,
        },
      };
    });
  },

  // Action to update PowerCleanList
  updatePowerCleanList: (newPowerCleanList) => {
    set((state) => {
      return {
        ...state,
        order: {
          ...state.order,
          powerCleanList: newPowerCleanList,
        },
      };
    });
  },

  // Action to update DryCleanList
  updateDryCleanList: (newDryCleanList) => {
    set((state) => {
      return {
        ...state,
        order: {
          ...state.order,
          dryCleanList: newDryCleanList,
        },
      };
    });
  },

  // Action to update WashListTotal
  updateWashListTotal: (newWashListTotal) => {
    set((state) => {
      return {
        ...state,
        order: {
          ...state.order,
          washListTotal: newWashListTotal,
        },
      };
    });
  },

  // Action to update PowerCleanListTotal
  updatePowerCleanListTotal: (newPowerCleanListTotal) => {
    set((state) => {
      return {
        ...state,
        order: {
          ...state.order,
          powerCleanListTotal: newPowerCleanListTotal,
        },
      };
    });
  },

  // Action to update DryCleanListTotal
  updateDryCleanListTotal: (newDryCleanListTotal) => {
    set((state) => {
      return {
        order: {
          ...state.order,
          dryCleanListTotal: newDryCleanListTotal,
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

  // Action to update DropAddress
  setDropAddress: (value) => {
    set((state) => {
      return {
        ...state,
        order: {
          ...state.order,
          dropAddress: value,
        },
      };
    });
  },
  incrementQuantity: (itemName, listName) => {
    set((state) => {
      const updatedList = state.order[listName].map((item) => {
        if (item.item === itemName) {
          return {
            ...item,
            quantity: item.quantity + 1,
          };
        }
        return item;
      });

      return {
        ...state,
        order: {
          ...state.order,
          [listName]: updatedList,
        },
      };
    });
  },

  decrementQuantity: (itemName, listName) => {
    set((state) => {
      const updatedList = state.order[listName].map((item) => {
        if (item.item === itemName) {
          return {
            ...item,
            quantity: item.quantity - 1,
          };
        }
        return item;
      });

      return {
        ...state,
        order: {
          ...state.order,
          [listName]: updatedList,
        },
      };
    });
  },
}));
export default useGeneralOrderStore;
