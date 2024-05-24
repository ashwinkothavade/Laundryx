import { create } from 'zustand';

const useAuthStore = create((set) => ({
  isAuth: !!sessionStorage.getItem('isAuth'), // userCredentials
  Phone: 0, // userCredentials
  userName: sessionStorage.getItem('username'), // userCredentials
  userEmail: '', // userCredentials
  userRole: sessionStorage.getItem('userrole'), // userCredentials

  addAuth: () => {
    set((state) => {
      return { ...state, isAuth: true };
    });
  },

  removeAuth: () => {
    set((state) => {
      return { ...state, isAuth: false };
    });
  },

  setUserPhone: (value) => {
    set((state) => {
      return { ...state, Phone: value };
    });
  },

  setUserName: (value) => {
    set((state) => {
      return { ...state, userName: value };
    });
  },

  setUserEmail: (value) => {
    set((state) => {
      return { ...state, userEmail: value };
    });
  },
  setUserRole: (value) => {
    set((state) => {
      return { ...state, userRole: value };
    });
  },
}));

export default useAuthStore;
