import { createContext, useContext, useState, useCallback, useMemo } from 'react';

// Two separate contexts so cart *data* changes (adding/removing items) and
// cart *UI* state (drawer open/closed) don't force the same components to
// re-render. A component that only reads cart items no longer re-renders when
// the drawer is opened/closed, and vice-versa.

const CartItemsContext = createContext(null);
const CartUIContext = createContext(null);

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState([]);
  const [restaurantId, setRestaurantId] = useState(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const openCart = useCallback(() => setIsCartOpen(true), []);
  const closeCart = useCallback(() => setIsCartOpen(false), []);
  const toggleCart = useCallback(() => setIsCartOpen((prev) => !prev), []);

  const addItem = useCallback((item, restId) => {
    // Prevent mixing items from different restaurants
    if (restaurantId && restaurantId !== restId) {
      const confirmed = window.confirm(
        'Your cart has items from another restaurant. Clear cart and add new item?'
      );
      if (!confirmed) return;
      setCartItems([]);
    }

    setRestaurantId(restId);
    setCartItems((prev) => {
      const existing = prev.find((i) => i.spoonacularId === item.spoonacularId);
      if (existing) {
        return prev.map((i) =>
          i.spoonacularId === item.spoonacularId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, [restaurantId]);

  const removeItem = useCallback((spoonacularId) => {
    setCartItems((prev) => {
      const updated = prev
        .map((i) => (i.spoonacularId === spoonacularId ? { ...i, quantity: i.quantity - 1 } : i))
        .filter((i) => i.quantity > 0);
      if (updated.length === 0) setRestaurantId(null);
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    setRestaurantId(null);
  }, []);

  const totalItems = useMemo(
    () => cartItems.reduce((sum, i) => sum + i.quantity, 0),
    [cartItems]
  );
  const totalPrice = useMemo(
    () => cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [cartItems]
  );

  const itemsValue = useMemo(
    () => ({
      cartItems,
      restaurantId,
      addItem,
      removeItem,
      clearCart,
      totalItems,
      totalPrice,
    }),
    [cartItems, restaurantId, addItem, removeItem, clearCart, totalItems, totalPrice]
  );

  const uiValue = useMemo(
    () => ({ isCartOpen, openCart, closeCart, toggleCart }),
    [isCartOpen, openCart, closeCart, toggleCart]
  );

  return (
    <CartItemsContext.Provider value={itemsValue}>
      <CartUIContext.Provider value={uiValue}>{children}</CartUIContext.Provider>
    </CartItemsContext.Provider>
  );
};

// Cart data (items, totals, mutations)
export const useCart = () => useContext(CartItemsContext);
// Cart drawer UI state (open/close)
export const useCartUI = () => useContext(CartUIContext);
