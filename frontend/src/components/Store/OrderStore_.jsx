import { create } from 'zustand';
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
  },

  updateWashList: (newWashList) =>
    set((state) => ({
      order: {
        ...state.order,
        washList: newWashList,
      },
    })),

  // Action to update PowerCleanList
  updatePowerCleanList: (newPowerCleanList) =>
    set((state) => ({
      order: {
        ...state.order,
        powerCleanList: newPowerCleanList,
      },
    })),

  // Action to update DryCleanList
  updateDryCleanList: (newDryCleanList) =>
    set((state) => ({
      order: {
        ...state.order,
        dryCleanList: newDryCleanList,
      },
    })),

  // Action to update WashListTotal
  updateWashListTotal: (newWashListTotal) =>
    set((state) => ({
      order: {
        ...state.order,
        washListTotal: newWashListTotal,
      },
    })),

  // Action to update PowerCleanListTotal
  updatePowerCleanListTotal: (newPowerCleanListTotal) =>
    set((state) => ({
      order: {
        ...state.order,
        powerCleanListTotal: newPowerCleanListTotal,
      },
    })),

  // Action to update DryCleanListTotal
  updateDryCleanListTotal: (newDryCleanListTotal) =>
    set((state) => ({
      order: {
        ...state.order,
        dryCleanListTotal: newDryCleanListTotal,
      },
    })),

  // Action to update OrderTotal
  updateOrderTotal: (newOrderTotal) =>
    set((state) => ({
      order: {
        ...state.order,
        orderTotal: newOrderTotal,
      },
    })),
}));
export default useGeneralOrderStore;
