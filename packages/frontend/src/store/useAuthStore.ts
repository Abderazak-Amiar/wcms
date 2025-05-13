import { create } from 'zustand';

interface AuthState {
  role: string | null;
  hasHydrated: boolean;
  setRole: (role: string) => void;
  loadRoleFromLocalStorage: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  role: null,
  hasHydrated: false,
  setRole: (role) => set({ role }),
  loadRoleFromLocalStorage: () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const { role } = JSON.parse(token);
        set({ role, hasHydrated: true });
      } catch (e) {
        set({ role: null, hasHydrated: true });
      }
    } else {
      set({ role: null, hasHydrated: true });
    }
  },
}));
