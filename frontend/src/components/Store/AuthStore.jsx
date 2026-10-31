import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

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
      userNotifications: [], // userCredentials
      unreadCount: 0, // userCredentials
      // One write for the whole identity. Login used to call seven separate
      // setters in a row, which meant seven store notifications and seven
      // re-render passes before the user saw anything.
      setUser: (user) => {
        set((state) => ({
          ...state,
          isAuth: true,
          userName: user.username ?? state.userName,
          userEmail: user.email ?? state.userEmail,
          Phone: user.phone_number ?? state.Phone,
          userRole: user.role ?? state.userRole,
          userHostel: user.hostel ?? state.userHostel,
          userRoomNumber: user.room_number ?? state.userRoomNumber,
          userRollNumber: user.roll_number ?? state.userRollNumber,
        }));
      },

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
      updateUserNotifications: (notifications) => {
        set((state) => {
          return { ...state, userNotifications: notifications };
        });
      },
      clearUserNotifications: () => {
        set((state) => {
          return {
            ...state,
            userNotifications: [],
          };
        });
      },
      removeUserNotification: (id) => {
        set((state) => {
          return {
            ...state,
            userNotifications: state.userNotifications.filter(
              (notification) => notification._id !== id
            ),
          };
        });
      },
      setUnreadCount: (value) => {
        set((state) => {
          return { ...state, unreadCount: value };
        });
      },
    }),
    {
      name: 'auth-store',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

export default useAuthStore;
