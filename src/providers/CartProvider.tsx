// src/providers/CartProvider.tsx
'use client';
import React, { createContext, useContext, useReducer, ReactNode } from 'react';
import { Product } from '../data/products';

/**
 * Shopping Cart Context and Provider
 * 
 * Manages global shopping cart state with comprehensive cart operations
 * including add, remove, update quantities, and inventory validation.
 * Provides cart data to all components in the application through React Context.
 */

/**
 * Cart Item Interface
 * 
 * Represents an item in the shopping cart with product details and quantity.
 * Used throughout the application for cart operations and display.
 */
export interface CartItem {
  product: Product;
  quantity: number;
}

/**
 * Cart State Interface
 * 
 * Defines the structure of the shopping cart state including
 * all items and the calculated total amount.
 */
interface CartState {
  items: CartItem[];
  total: number;
}

/**
 * Cart Action Types
 * 
 * Defines all possible actions that can be dispatched to modify
 * the shopping cart state.
 */
type CartAction = 
  | { type: 'ADD_ITEM'; product: Product }
  | { type: 'REMOVE_ITEM'; productId: string }
  | { type: 'UPDATE_QUANTITY'; productId: string; quantity: number }
  | { type: 'CLEAR_CART' };

/**
 * Cart Context Definition
 * 
 * Creates React Context for cart state management with proper TypeScript typing.
 * Provides state and dispatch function to consumer components.
 */
const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

/**
 * Cart Reducer Function
 * 
 * Handles all cart state updates based on dispatched actions.
 * Implements business logic for inventory validation and total calculation.
 * 
 * @param state - Current cart state
 * @param action - Dispatched action to modify cart
 * @returns Updated cart state
 */
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case 'ADD_ITEM': {
      const existingItem = state.items.find(item => item.product.id === action.product.id);
      
      // Check if item already exists in cart
      if (existingItem) {
        // Validate inventory limits before increasing quantity
        if (existingItem.quantity >= action.product.inventory) {
          return state; // Don't exceed available inventory
        }
        
        // Update existing item quantity
        const updatedItems = state.items.map(item =>
          item.product.id === action.product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
        
        // Recalculate total after quantity update
        return {
          ...state,
          items: updatedItems,
          total: updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
        };
      }
      
      // Add new item to cart
      const newItems = [...state.items, { product: action.product, quantity: 1 }];
      return {
        ...state,
        items: newItems,
        total: newItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
      };
    }
    
    case 'REMOVE_ITEM': {
      // Filter out the removed item
      const filteredItems = state.items.filter(item => item.product.id !== action.productId);
      return {
        ...state,
        items: filteredItems,
        total: filteredItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
      };
    }
    
    case 'UPDATE_QUANTITY': {
      // Remove item if quantity reaches zero
      if (action.quantity === 0) {
        return cartReducer(state, { type: 'REMOVE_ITEM', productId: action.productId });
      }
      
      // Find the product to validate inventory constraints
      const productItem = state.items.find(item => item.product.id === action.productId);
      if (productItem && action.quantity > productItem.product.inventory) {
        return state; // Prevent exceeding available inventory
      }
      
      // Update item quantity
      const updatedItems = state.items.map(item =>
        item.product.id === action.productId
          ? { ...item, quantity: action.quantity }
          : item
      );
      
      // Recalculate total after quantity update
      return {
        ...state,
        items: updatedItems,
        total: updatedItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0)
      };
    }
    
    case 'CLEAR_CART':
      // Reset cart to empty state
      return { items: [], total: 0 };
    
    default:
      return state;
  }
}

/**
 * Cart Provider Component
 * 
 * Wraps the application with cart context provider to make cart state
 * available to all child components.
 * 
 * @param children - React child components that need access to cart state
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [], total: 0 });

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

/**
 * Custom Hook for Cart Access
 * 
 * Provides easy access to cart state and dispatch function in components.
 * Includes error handling for proper context usage.
 * 
 * @returns Cart context with state and dispatch function
 * @throws Error if used outside CartProvider
 */
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}