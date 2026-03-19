import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  phoneNumber: string;
  name: string | null;
  profilePic: string | null;
  status: string | null;
  about: string | null;
  lastSeen: string | null;
}

interface Device {
  id: string;
  deviceName: string;
  publicKey: string;
  lastActive: string | null;
  isActive: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  deviceId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  setDeviceId: (deviceId: string) => void;
  setLoading: (loading: boolean) => void;
  login: (user: User, token: string, deviceId: string) => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      deviceId: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user }),
      setToken: (token) => set({ token, isAuthenticated: !!token }),
      setDeviceId: (deviceId) => set({ deviceId }),
      setLoading: (isLoading) => set({ isLoading }),

      login: (user, token, deviceId) => set({
        user,
        token,
        deviceId,
        isAuthenticated: true,
        isLoading: false
      }),

      logout: () => set({
        user: null,
        token: null,
        deviceId: null,
        isAuthenticated: false,
        isLoading: false
      }),

      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null
      }))
    }),
    {
      name: 'whatsapp-auth',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        deviceId: state.deviceId,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
