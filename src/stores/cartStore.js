import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Cart store: replaces CartContext (both the items and UI halves).
// Using `persist` gives us a real upgrade — the cart now survives a page
// refresh, which plain React Context didn't.
//
// totalItems / totalPrice are kept in state (recomputed on every mutation)
// so that components selecting them re-render exactly when they change.
export const useCartStore = create(
  persist(
    (set, get) => ({
      cartItems: [],
      restaurantId: null,
      isCartOpen: false,
      totalItems: 0,
      totalPrice: 0,

      recalc: (items) => ({
        totalItems: items.reduce((sum, i) => sum + i.quantity, 0),
        totalPrice: items.reduce((sum, i) => sum + i.price * i.quantity, 0),
      }),

      openCart: () => set({ isCartOpen: true }),
      closeCart: () => set({ isCartOpen: false }),
      toggleCart: () => set((s) => ({ isCartOpen: !s.isCartOpen })),

      addItem: (item, restId) => {
        const { restaurantId, cartItems } = get();

        // Prevent mixing items from different restaurants
        if (restaurantId && restaurantId !== restId) {
          const confirmed = window.confirm(
            'Your cart has items from another restaurant. Clear cart and add new item?'
          );
          if (!confirmed) return;
        }

        const existing = cartItems.find((i) => i.spoonacularId === item.spoonacularId);
        let nextItems;
        if (existing) {
          nextItems = cartItems.map((i) =>
            i.spoonacularId === item.spoonacularId ? { ...i, quantity: i.quantity + 1 } : i
          );
        } else {
          nextItems = [...cartItems, { ...item, quantity: 1 }];
        }

        const totals = get().recalc(nextItems);
        set({ cartItems: nextItems, restaurantId: restId, ...totals });
      },

      removeItem: (spoonacularId) => {
        set((s) => {
          const updated = s.cartItems
            .map((i) => (i.spoonacularId === spoonacularId ? { ...i, quantity: i.quantity - 1 } : i))
            .filter((i) => i.quantity > 0);
          const totals = get().recalc(updated);
          return {
            cartItems: updated,
            restaurantId: updated.length === 0 ? null : s.restaurantId,
            ...totals,
          };
        });
      },

      clearCart: () =>
        set({ cartItems: [], restaurantId: null, totalItems: 0, totalPrice: 0 }),
    }),
    {
      name: 'finest-cart',
    }
  )
);
