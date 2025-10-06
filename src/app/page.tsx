'use client';
import { useState } from 'react';
import { products } from '../data/products';
import { useCart } from '../providers/CartProvider';
import Link from 'next/link';
import styles from './styles/home.module.css';

/**
 * Home Page Component - Main Product Catalog
 * 
 * Displays the product catalog with category filtering, shopping cart management,
 * and navigation to other sections of the application.
 * 
 * Features:
 * - Category-based product filtering
 * - Real-time cart management with quantity controls
 * - Responsive grid layout for product display
 * - Inventory management with stock validation
 * - Quick navigation to vendor, rider, and order tracking dashboards
 */
export default function Home() {
  const { state, dispatch } = useCart();
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Generate unique categories from products data for filter buttons
  const categories = ['All', ...new Set(products.map(product => product.category))];
  
  // Filter products based on selected category
  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(product => product.category === selectedCategory);

  /**
   * Adds a product to the shopping cart
   * @param product - The product object to add to cart
   */
  const addToCart = (product: any) => {
    dispatch({ type: 'ADD_ITEM', product });
  };

  /**
   * Updates the quantity of a product in the shopping cart
   * Removes the item if quantity reaches zero
   * @param productId - Unique identifier of the product
   * @param quantity - New quantity value
   */
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity === 0) {
      dispatch({ type: 'REMOVE_ITEM', productId });
    } else {
      dispatch({ type: 'UPDATE_QUANTITY', productId, quantity });
    }
  };

  /**
   * Retrieves the current quantity of a product in the cart
   * @param productId - Unique identifier of the product
   * @returns Current quantity in cart, or 0 if not present
   */
  const getProductQuantity = (productId: string) => {
    const item = state.items.find(item => item.product.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <div className={styles.container}>
      {/* Main Header with Navigation and Cart Summary */}
      <header className={styles.header}>
        <h1 className={styles.title}>Grundy Groceries 🛒</h1>
        <div className={styles.headerActions}>
          {/* Dashboard Navigation Links */}
          <Link href="/vendor-dashboard" className={`${styles.actionButton} ${styles.successButton}`}>
            Vendor Dashboard
          </Link>
          <Link href="/rider" className={`${styles.actionButton} ${styles.warningButton}`}>
            🚚 Rider App
          </Link>
          <Link href="/order-tracking" className={`${styles.actionButton} ${styles.infoButton}`}>
            Order Tracking
          </Link>
          
          {/* Real-time Cart Summary */}
          <div className={styles.cartInfo}>
            Cart: {state.items.reduce((sum, item) => sum + item.quantity, 0)} items
            <br />
            <span className={styles.cartTotal}>Total: ₦{state.total.toLocaleString()}</span>
          </div>
          
          {/* Checkout Call-to-Action */}
          <Link href="/checkout" className={`${styles.actionButton} ${styles.actionButton}`}>
            Checkout
          </Link>
        </div>
      </header>

      {/* Category Filter Section */}
      <section className={styles.categoriesSection}>
        <h3 className={styles.categoriesTitle}>Browse Categories</h3>
        <div className={styles.categoriesGrid}>
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`${styles.categoryButton} ${
                selectedCategory === category ? styles.categoryButtonActive : ''
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* Product Grid Display */}
      <div className={styles.productsGrid}>
        {filteredProducts.map(product => {
          const quantity = getProductQuantity(product.id);
          const maxQuantity = product.inventory;
          
          return (
            <div key={product.id} className={styles.productCard}>
              {/* Product Image */}
              <img 
                src={product.image} 
                alt={product.name}
                className={styles.productImage}
              />
              
              {/* Product Information */}
              <h3 className={styles.productName}>{product.name}</h3>
              <p className={styles.productVendor}>
                by {product.vendorName}
              </p>
              <p className={styles.productPrice}>
                ₦{product.price.toLocaleString()}
              </p>
              <p className={styles.productInventory}>
                In stock: {maxQuantity}
              </p>

              {/* Add to Cart / Quantity Controls */}
              {quantity === 0 ? (
                <button
                  onClick={() => addToCart(product)}
                  disabled={maxQuantity === 0}
                  className={styles.addToCartButton}
                >
                  {maxQuantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                </button>
              ) : (
                <div className={styles.quantityControls}>
                  <button
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    className={`${styles.quantityButton} ${styles.quantityButtonMinus}`}
                  >
                    -
                  </button>
                  
                  <span className={styles.quantityDisplay}>
                    {quantity}
                  </span>
                  
                  <button
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    disabled={quantity >= maxQuantity}
                    className={`${styles.quantityButton} ${styles.quantityButtonPlus}`}
                  >
                    +
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}