import { create } from "zustand";

interface ConnectionState {
  isConnected: boolean;
  setConnected: (isConnected: boolean) => void;
}

export const useConnectionStore = create<ConnectionState>((set) => ({
  isConnected: true,
  setConnected: (isConnected) => set({ isConnected }),
}));
