import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useAuthStore = create(
  persist(
    (set) => ({
      isAuth: false, // userCredentials
      Phone: 0, // userCredentials
      userName: '', // userCredentials
      userEmail: '', // userCredentials
      userRole: '', // userCredentials
      userHostel: '', // userCredentials
      userRoomNumber: '', // userCredentials
      userRollNumber: '', // userCredentials

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
      setUserHostel: (value) => {
        set((state) => {
          return { ...state, userHostel: value };
        });
      },
      setUserRoomNumber: (value) => {
        set((state) => {
          return { ...state, userRoomNumber: value };
        });
      },
      setUserRollNumber: (value) => {
        set((state) => {
          return { ...state, userRollNumber: value };
        });
      },
    }),
    {
      name: 'auth-store',
      getStorage: () => sessionStorage,
    }
  )
);

export default useAuthStore;
