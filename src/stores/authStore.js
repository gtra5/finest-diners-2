import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '../services/api';

// Auth store: replaces AuthContext.
// Uses Zustand's `persist` middleware so the user + token are automatically
// saved to and restored from localStorage — no manual getItem/setItem calls.
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      loading: true,

      setUser: (user) => set({ user }),

      login: async (email, password) => {
        const { data } = await api.post('/auth/login', { email, password });
        localStorage.setItem('token', data.token);
        set({ user: data, loading: false });
        return data;
      },

      register: async (name, email, password) => {
        const { data } = await api.post('/auth/register', { name, email, password });
        localStorage.setItem('token', data.token);
        set({ user: data, loading: false });
        return data;
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null });
      },

      // Validate a restored session against the backend on app startup. If the
      // JWT stored in localStorage is stale (e.g. issued by a previous backend
      // with a different secret), clear it so the user isn't logged in while
      // every API call 401s and bounces them to /login mid-flow.
      bootstrap: async () => {
        const { user, logout } = get();
        if (!user) return null;
        try {
          const { data } = await api.get('/auth/me');
          set({ user: { ...user, ...data }, loading: false });
          return data;
        } catch (err) {
          logout();
          return null;
        }
      },
    }),
    {
      name: 'finest-auth',
      // Only persist the user object (the JWT lives separately in localStorage
      // so the api/lib interceptors can read it).
      partialize: (state) => ({ user: state.user }),
      // Mark loading as done once the persisted session finishes rehydrating.
      onRehydrateStorage: () => (state) => {
        if (state) state.loading = false;
      },
    }
  )
);

// Subscribe to the api interceptor's session-expired signal so the in-memory
// user is cleared the moment any protected endpoint returns 401 — even if the
// request didn't originate from a React component.
if (typeof window !== 'undefined') {
  window.addEventListener('finest:unauthorized', () => {
    useAuthStore.getState().logout();
  });
}
