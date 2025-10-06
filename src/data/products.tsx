// src/data/products.tsx

/**
 * Product Data Interface and Configuration
 * 
 * Defines the product data structure and provides sample product catalog
 * for the multi-vendor grocery platform. Each product is linked to a specific
 * vendor for accurate inventory management and payout calculations.
 */

export interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  vendor: string; // Vendor ID for payout calculations
  vendorName: string; // Vendor name for display purposes
  category: string;
  description: string;
  inventory: number;
}

/**
 * Product Catalog Configuration
 * 
 * Sample product data representing the grocery items available in the platform.
 * Each product includes comprehensive details for display, inventory management,
 * and vendor association for automated split payment calculations.
 * 
 * Features:
 * - Vendor association for multi-vendor payout splits
 * - Inventory tracking for stock management
 * - Category-based organization for filtering
 * - High-quality product images for better user experience
 */
export const products: Product[] = [
  {
    id: '1',
    name: 'Fresh Apples',
    price: 1200,
    image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=300&h=200&fit=crop',
    vendor: 'VENDOR_001',
    vendorName: 'Fresh Farms',
    category: 'Fruits',
    description: 'Crisp and sweet red apples',
    inventory: 50
  },
  {
    id: '2',
    name: 'Carrots',
    price: 800,
    image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=300&h=200&fit=crop',
    vendor: 'VENDOR_002',
    vendorName: 'Vegetable King',
    category: 'Vegetables',
    description: 'Fresh organic carrots',
    inventory: 30
  },
  {
    id: '3',
    name: 'Chicken Breast',
    price: 2500,
    image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&h=200&fit=crop',
    vendor: 'VENDOR_003',
    vendorName: 'Meat Masters',
    category: 'Meat & Poultry',
    description: 'Boneless chicken breast',
    inventory: 20
  },
  {
    id: '4',
    name: 'Milk',
    price: 1500,
    image: 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300&h=200&fit=crop',
    vendor: 'VENDOR_004',
    vendorName: 'Dairy Delight',
    category: 'Dairy',
    description: 'Fresh whole milk 1L',
    inventory: 40
  },
  {
    id: '5',
    name: 'Bread',
    price: 700,
    image: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?w=300&h=200&fit=crop',
    vendor: 'VENDOR_005',
    vendorName: 'Bakery Corner',
    category: 'Bakery',
    description: 'Fresh whole wheat bread',
    inventory: 25
  },
  {
    id: '6',
    name: 'Rice',
    price: 3000,
    image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=300&h=200&fit=crop',
    vendor: 'VENDOR_006',
    vendorName: 'Grains Galore',
    category: 'Grains',
    description: 'Premium long grain rice 5kg',
    inventory: 15
  },
  {
    id: '7',
    name: 'Oranges',
    price: 900,
    image: 'https://images.unsplash.com/photo-1547514701-42782101795e?w=300&h=200&fit=crop',
    vendor: 'VENDOR_001',
    vendorName: 'Fresh Farms',
    category: 'Fruits',
    description: 'Sweet and juicy oranges',
    inventory: 35
  },
  {
    id: '8',
    name: 'Spinach',
    price: 600,
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?w=300&h=200&fit=crop',
    vendor: 'VENDOR_002',
    vendorName: 'Vegetable King',
    category: 'Vegetables',
    description: 'Fresh leafy spinach',
    inventory: 25
  }
];