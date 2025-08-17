'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';

// Types
export interface User {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  avatar?: string;
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  category: string;
}

export interface AppState {
  // Authentication
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Shopping Cart
  cart: CartItem[];
  cartTotal: number;
  cartItemCount: number;

  // UI State
  theme: 'light' | 'dark';
  language: 'en' | 'es' | 'fr';
  sidebarOpen: boolean;
  notifications: Notification[];

  // Preferences
  preferences: {
    autoSave: boolean;
    notifications: boolean;
    analytics: boolean;
  };
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: Date;
}

// Action Types
export type AppAction =
  | { type: 'SET_USER'; payload: User | null }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'REMOVE_FROM_CART'; payload: string }
  | { type: 'UPDATE_CART_ITEM'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_THEME'; payload: 'light' | 'dark' }
  | { type: 'SET_LANGUAGE'; payload: 'en' | 'es' | 'fr' }
  | { type: 'TOGGLE_SIDEBAR' }
  | { type: 'ADD_NOTIFICATION'; payload: Omit<Notification, 'id' | 'timestamp'> }
  | { type: 'REMOVE_NOTIFICATION'; payload: string }
  | { type: 'UPDATE_PREFERENCES'; payload: Partial<AppState['preferences']> }
  | { type: 'LOGOUT' };

// Initial State
const initialState: AppState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  cart: [],
  cartTotal: 0,
  cartItemCount: 0,
  theme: 'light',
  language: 'en',
  sidebarOpen: false,
  notifications: [],
  preferences: {
    autoSave: true,
    notifications: true,
    analytics: true,
  },
};

// Reducer
function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_USER':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: !!action.payload,
        isLoading: false,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'ADD_TO_CART': {
      const existingItem = state.cart.find(item => item.id === action.payload.id);
      let newCart: CartItem[];

      if (existingItem) {
        newCart = state.cart.map(item =>
          item.id === action.payload.id
            ? { ...item, quantity: item.quantity + action.payload.quantity }
            : item
        );
      } else {
        newCart = [...state.cart, action.payload];
      }

      const cartTotal = newCart.reduce((total, item) => total + (item.price * item.quantity), 0);
      const cartItemCount = newCart.reduce((count, item) => count + item.quantity, 0);

      return {
        ...state,
        cart: newCart,
        cartTotal,
        cartItemCount,
      };
    }

    case 'REMOVE_FROM_CART': {
      const newCart = state.cart.filter(item => item.id !== action.payload);
      const cartTotal = newCart.reduce((total, item) => total + (item.price * item.quantity), 0);
      const cartItemCount = newCart.reduce((count, item) => count + item.quantity, 0);

      return {
        ...state,
        cart: newCart,
        cartTotal,
        cartItemCount,
      };
    }

    case 'UPDATE_CART_ITEM': {
      const newCart = state.cart.map(item =>
        item.id === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
      const cartTotal = newCart.reduce((total, item) => total + (item.price * item.quantity), 0);
      const cartItemCount = newCart.reduce((count, item) => count + item.quantity, 0);

      return {
        ...state,
        cart: newCart,
        cartTotal,
        cartItemCount,
      };
    }

    case 'CLEAR_CART':
      return {
        ...state,
        cart: [],
        cartTotal: 0,
        cartItemCount: 0,
      };

    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload,
      };

    case 'SET_LANGUAGE':
      return {
        ...state,
        language: action.payload,
      };

    case 'TOGGLE_SIDEBAR':
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen,
      };

    case 'ADD_NOTIFICATION': {
      const notification: Notification = {
        ...action.payload,
        id: Date.now().toString(),
        timestamp: new Date(),
      };

      return {
        ...state,
        notifications: [...state.notifications, notification],
      };
    }

    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload),
      };

    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        preferences: {
          ...state.preferences,
          ...action.payload,
        },
      };

    case 'LOGOUT':
      return {
        ...initialState,
        isLoading: false,
        theme: state.theme,
        language: state.language,
        preferences: state.preferences,
      };

    default:
      return state;
  }
}

// Context
interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  // Auth Actions
  login: (user: User) => void;
  logout: () => void;
  // Cart Actions
  addToCart: (item: Omit<CartItem, 'quantity'>) => void;
  removeFromCart: (id: string) => void;
  updateCartItem: (id: string, quantity: number) => void;
  clearCart: () => void;
  // UI Actions
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (language: 'en' | 'es' | 'fr') => void;
  toggleSidebar: () => void;
  // Notification Actions
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp'>) => void;
  removeNotification: (id: string) => void;
  // Preference Actions
  updatePreferences: (preferences: Partial<AppState['preferences']>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Provider Component
interface AppProviderProps {
  children: ReactNode;
}

export function AppProvider({ children }: AppProviderProps) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load initial state from localStorage
  useEffect(() => {
    try {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
      const savedLanguage = localStorage.getItem('language') as 'en' | 'es' | 'fr';
      const savedCart = localStorage.getItem('cart');
      const savedUser = localStorage.getItem('user');
      const savedPreferences = localStorage.getItem('preferences');

      if (savedTheme) dispatch({ type: 'SET_THEME', payload: savedTheme });
      if (savedLanguage) dispatch({ type: 'SET_LANGUAGE', payload: savedLanguage });
      if (savedCart) {
        const cart = JSON.parse(savedCart);
        cart.forEach((item: CartItem) => {
          dispatch({ type: 'ADD_TO_CART', payload: item });
        });
      }
      if (savedUser) {
        const user = JSON.parse(savedUser);
        dispatch({ type: 'SET_USER', payload: user });
      }
      if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
      }
    } catch (error) {
      console.error('Error loading state from localStorage:', error);
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  // Save state to localStorage when it changes
  useEffect(() => {
    localStorage.setItem('theme', state.theme);
    localStorage.setItem('language', state.language);
    localStorage.setItem('cart', JSON.stringify(state.cart));
    if (state.user) {
      localStorage.setItem('user', JSON.stringify(state.user));
    }
    localStorage.setItem('preferences', JSON.stringify(state.preferences));
  }, [state.theme, state.language, state.cart, state.user, state.preferences]);

  // Auto-remove notifications after duration
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    state.notifications.forEach(notification => {
      if (notification.duration) {
        const timer = setTimeout(() => {
          dispatch({ type: 'REMOVE_NOTIFICATION', payload: notification.id });
        }, notification.duration);
        timers.push(timer);
      }
    });

    return () => {
      timers.forEach(timer => clearTimeout(timer));
    };
  }, [state.notifications]);

  // Action creators
  const login = (user: User) => {
    dispatch({ type: 'SET_USER', payload: user });
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        type: 'success',
        title: 'Welcome back!',
        message: `Hello, ${user.name}!`,
        duration: 3000,
      },
    });
  };

  const logout = () => {
    dispatch({ type: 'LOGOUT' });
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        type: 'info',
        title: 'Logged out',
        message: 'You have been successfully logged out.',
        duration: 3000,
      },
    });
  };

  const addToCart = (item: Omit<CartItem, 'quantity'>) => {
    dispatch({ type: 'ADD_TO_CART', payload: { ...item, quantity: 1 } });
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        type: 'success',
        title: 'Added to cart',
        message: `${item.name} has been added to your cart.`,
        duration: 2000,
      },
    });
  };

  const removeFromCart = (id: string) => {
    const item = state.cart.find(cartItem => cartItem.id === id);
    dispatch({ type: 'REMOVE_FROM_CART', payload: id });
    if (item) {
      dispatch({
        type: 'ADD_NOTIFICATION',
        payload: {
          type: 'info',
          title: 'Removed from cart',
          message: `${item.name} has been removed from your cart.`,
          duration: 2000,
        },
      });
    }
  };

  const updateCartItem = (id: string, quantity: number) => {
    dispatch({ type: 'UPDATE_CART_ITEM', payload: { id, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
    dispatch({
      type: 'ADD_NOTIFICATION',
      payload: {
        type: 'info',
        title: 'Cart cleared',
        message: 'Your cart has been cleared.',
        duration: 2000,
      },
    });
  };

  const setTheme = (theme: 'light' | 'dark') => {
    dispatch({ type: 'SET_THEME', payload: theme });
  };

  const setLanguage = (language: 'en' | 'es' | 'fr') => {
    dispatch({ type: 'SET_LANGUAGE', payload: language });
  };

  const toggleSidebar = () => {
    dispatch({ type: 'TOGGLE_SIDEBAR' });
  };

  const addNotification = (notification: Omit<Notification, 'id' | 'timestamp'>) => {
    dispatch({ type: 'ADD_NOTIFICATION', payload: notification });
  };

  const removeNotification = (id: string) => {
    dispatch({ type: 'REMOVE_NOTIFICATION', payload: id });
  };

  const updatePreferences = (preferences: Partial<AppState['preferences']>) => {
    dispatch({ type: 'UPDATE_PREFERENCES', payload: preferences });
  };

  const value: AppContextType = {
    state,
    dispatch,
    login,
    logout,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
    setTheme,
    setLanguage,
    toggleSidebar,
    addNotification,
    removeNotification,
    updatePreferences,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// Hook to use the context
export function useAppContext() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
}

// Custom hooks for specific state slices
export function useAuth() {
  const { state, login, logout } = useAppContext();
  return {
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    login,
    logout,
  };
}

export function useCart() {
  const { state, addToCart, removeFromCart, updateCartItem, clearCart } = useAppContext();
  return {
    cart: state.cart,
    cartTotal: state.cartTotal,
    cartItemCount: state.cartItemCount,
    addToCart,
    removeFromCart,
    updateCartItem,
    clearCart,
  };
}

export function useUI() {
  const { state, setTheme, setLanguage, toggleSidebar } = useAppContext();
  return {
    theme: state.theme,
    language: state.language,
    sidebarOpen: state.sidebarOpen,
    setTheme,
    setLanguage,
    toggleSidebar,
  };
}

export function useNotifications() {
  const { state, addNotification, removeNotification } = useAppContext();
  return {
    notifications: state.notifications,
    addNotification,
    removeNotification,
  };
}

export function usePreferences() {
  const { state, updatePreferences } = useAppContext();
  return {
    preferences: state.preferences,
    updatePreferences,
  };
}
