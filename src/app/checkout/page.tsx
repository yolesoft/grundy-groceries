// src/app/checkout/page.tsx
'use client';
import { useState } from 'react';
import { useCart } from '../../providers/CartProvider';
import Link from 'next/link';
import styles from '../styles/checkout.module.css';

type PaymentMethod = 'prepay_now' | 'bank_transfer_delivery' | 'terminal_delivery';

/**
 * Checkout Page Component - Complete Order Processing
 * 
 * Handles the complete checkout flow with three payment methods:
 * 1. Pre-pay Now: Instant card payments via Paystack
 * 2. Bank Transfer on Delivery: Virtual accounts for payment upon delivery
 * 3. Terminal on Delivery: Card payments collected via mobile terminal
 * 
 * Features:
 * - Dynamic payment method selection
 * - Real-time order summary with quantity management
 * - Virtual account generation for bank transfers
 * - Terminal payment simulation for demo purposes
 * - Comprehensive order confirmation views
 */
export default function CheckoutPage() {
  const { state, dispatch } = useCart();
  const [email, setEmail] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('prepay_now');
  const [virtualAccount, setVirtualAccount] = useState<any>(null);
  const [terminalOrder, setTerminalOrder] = useState<any>(null);
  const [orderCreated, setOrderCreated] = useState(false);

  /**
   * Updates product quantity in the shopping cart
   * @param productId - Unique identifier for the product
   * @param quantity - New quantity value (removes item if zero)
   */
  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', productId, quantity });
  };

  /**
   * Removes item from the shopping cart completely
   * @param productId - Unique identifier for the product to remove
   */
  const removeItem = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', productId });
  };

  /**
   * Initializes Pre-pay Now payment flow
   * Creates order reference and redirects to Paystack checkout
   * @param e - Form event to prevent default submission
   */
  const initializePrepayNow = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate unique order reference for transaction tracking
      const orderReference = `ORDER_${Date.now()}`;

      console.log('Initializing prepay_now payment with order reference:', orderReference);

      const response = await fetch('/api/payment/initialize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: state.total,
          cartItems: state.items,
          orderReference: orderReference, // Critical for order tracking and reconciliation
        }),
      });

      const data = await response.json();

      if (data.status) {
        console.log('Payment initialized successfully, redirecting to Paystack');
        // Redirect user to Paystack payment page
        window.location.href = data.data.authorization_url;
      } else {
        console.error('Payment initialization failed:', data.error);
        alert(data.error || 'Payment initialization failed');
      }
    } catch (error) {
      console.error('Payment processing error:', error);
      alert('An error occurred while processing your payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sets up Bank Transfer on Delivery order
   * Creates order with virtual account for payment upon delivery
   * @param e - Form event to prevent default submission
   */
  const setupBankTransferDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate unique order reference for bank transfer tracking
      const orderReference = `ORDER_${Date.now()}`;

      console.log('Setting up bank transfer delivery with order reference:', orderReference);

      const response = await fetch('/api/orders/bank-transfer-delivery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: state.total,
          items: state.items,
          customer_name: email.split('@')[0],
          orderReference: orderReference, // Links virtual account to order
        }),
      });

      const data = await response.json();

      if (data.status) {
        console.log('Bank transfer order created successfully');
        setVirtualAccount(data.data.virtual_account);
        setOrderCreated(true);
        // Clear cart after successful order creation
        dispatch({ type: 'CLEAR_CART' });
      } else {
        console.error('Bank transfer order creation failed:', data.error);
        alert(data.error || 'Failed to create bank transfer order');
      }
    } catch (error) {
      console.error('Bank transfer order processing error:', error);
      alert('An error occurred while creating your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Sets up Terminal on Delivery order
   * Creates order for payment collection via mobile terminal upon delivery
   * @param e - Form event to prevent default submission
   */
  const setupTerminalDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Generate unique order reference for terminal payment tracking
      const orderReference = `ORDER_${Date.now()}`;

      console.log('Setting up terminal delivery with order reference:', orderReference);

      const response = await fetch('/api/orders/terminal-delivery', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          amount: state.total,
          items: state.items,
          customer_name: email.split('@')[0],
          delivery_address: deliveryAddress,
          orderReference: orderReference, // Critical for terminal payment matching
        }),
      });

      const data = await response.json();

      if (data.status) {
        console.log('Terminal delivery order created successfully');
        setTerminalOrder(data.data);
        setOrderCreated(true);
        dispatch({ type: 'CLEAR_CART' });
      } else {
        console.error('Terminal delivery order creation failed:', data.error);
        alert(data.error || 'Failed to create terminal delivery order');
      }
    } catch (error) {
      console.error('Terminal delivery order processing error:', error);
      alert('An error occurred while creating your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles form submission based on selected payment method
   * Routes to appropriate payment initialization function
   * @param e - Form event to prevent default submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    if (paymentMethod === 'prepay_now') {
      initializePrepayNow(e);
    } else if (paymentMethod === 'bank_transfer_delivery') {
      setupBankTransferDelivery(e);
    } else {
      setupTerminalDelivery(e);
    }
  };

  // Display empty cart state
  if (state.items.length === 0 && !orderCreated) {
    return (
      <div className={styles.emptyCart}>
        <h2>Your cart is empty</h2>
        <p>Add some items to your cart first!</p>
        <Link href="/" className={styles.continueShopping}>
          Continue Shopping
        </Link>
      </div>
    );
  }

  // Bank Transfer Order Confirmation View
  if (orderCreated && virtualAccount) {
    return (
      <div className={styles.container}>
        <div className={styles.orderConfirmed}>
          <h1>✅ Order Confirmed!</h1>
          <p>Your order has been placed successfully. Pay via bank transfer when your delivery arrives.</p>
        </div>

        <div className={styles.instructionsPanel}>
          <h3>Bank Transfer Instructions for Delivery</h3>
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Bank Name:</span>
              <p className={styles.detailValue}>{virtualAccount.bank_name}</p>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Account Number:</span>
              <p className={styles.accountNumber}>{virtualAccount.account_number}</p>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Account Name:</span>
              <p className={styles.detailValue}>{virtualAccount.account_name}</p>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Amount to Pay:</span>
              <p className={styles.amount}>₦{virtualAccount.amount.toLocaleString()}</p>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Order Reference:</span>
              <p className={styles.detailValue}>{virtualAccount.reference}</p>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Split Configuration:</span>
              <p className={styles.detailValue}>
                {virtualAccount.split_configuration === 'split' ? 'Multi-Vendor Split' : 'Single Vendor'}
              </p>
            </div>
          </div>
          
          {/* Vendor split information display */}
          {virtualAccount.order_split && (
            <div className={styles.vendorInfo}>
              <h4>Vendor Split Information:</h4>
              <p>
                This order contains items from {virtualAccount.order_split.vendorPayouts.length} vendor(s).
                Platform fee: ₦{virtualAccount.order_split.platformRevenue.toLocaleString()}
              </p>
            </div>
          )}
          
          {/* Demo instructions for testing */}
          <div className={styles.demoInstructions}>
            <h4>Demo Instructions:</h4>
            <p>
              Use Paystack's <strong>Demo Bank App</strong> to test this payment:
            </p>
            <ul>
              <li>Visit: <a href="https://demobank.paystackintegrations.com" target="_blank" rel="noopener noreferrer">Paystack Demo Bank</a></li>
              <li>Login with account: <strong>123 000 164 4</strong> and PIN: <strong>0000</strong></li>
              <li>Transfer the exact amount to the account number above</li>
            </ul>
          </div>

          <p>
            💡 <strong>How it works:</strong> When our delivery agent arrives, they will show you this virtual account number. 
            Transfer the exact amount using your bank app, and we'll automatically confirm your payment instantly.
          </p>
        </div>

        <div className={styles.textCenter}>
          <Link href="/" className={styles.continueShopping}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // Terminal Delivery Order Confirmation View
  if (orderCreated && terminalOrder) {
    // Normalize terminal order data for consistent display
    const safeTerminalOrder = {
      ...terminalOrder,
      paymentStatus: terminalOrder.paymentStatus || terminalOrder.status || 'pending',
      order_reference: terminalOrder.order_reference || terminalOrder.orderReference || 'N/A',
      delivery_address: terminalOrder.delivery_address || terminalOrder.deliveryAddress || 'N/A',
      amount: terminalOrder.amount || 0
    };

    return (
      <div className={styles.container}>
        <div className={styles.orderConfirmed}>
          <h1>✅ Order Confirmed!</h1>
          <p>Your order has been placed successfully. Pay with card or contactless when your delivery arrives.</p>
        </div>

        <div className={styles.instructionsPanel}>
          <h3>Terminal on Delivery Order Details</h3>
          
          <div className={styles.detailsGrid}>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Order Reference:</span>
              <p className={styles.accountNumber}>{safeTerminalOrder.order_reference}</p>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Amount to Pay:</span>
              <p className={styles.amount}>₦{safeTerminalOrder.amount.toLocaleString()}</p>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Delivery Address:</span>
              <p className={styles.detailValue}>{safeTerminalOrder.delivery_address}</p>
            </div>
            
            {/* Order Status Display */}
            <div className={styles.detailItem}>
              <span className={styles.detailLabel}>Order Status:</span>
              <p className={styles.detailValue}>
                ⏳ {safeTerminalOrder.paymentStatus.toUpperCase()}
              </p>
            </div>
          </div>
          
          {/* Vendor Split Information */}
          {safeTerminalOrder.order_split && (
            <div className={styles.vendorInfo}>
              <h5>Vendor Split:</h5>
              <p>
                Items from {safeTerminalOrder.order_split.vendorPayouts.length} vendor(s). 
                Platform fee: ₦{safeTerminalOrder.order_split.platformRevenue.toLocaleString()}
              </p>
            </div>
          )}
          
          {/* Terminal Payment Experience Mockup */}
          <div className={styles.terminalMockup}>
            <h4>📱 Terminal Payment Experience</h4>
            <div className={styles.terminalScreen}>
              <div className={styles.terminalHeader}>
                <div className={styles.terminalBank}>PAYSTACK TERMINAL</div>
                <div className={styles.terminalStore}>GRUNDY GROCERIES</div>
              </div>
              
              <div className={styles.terminalAmount}>
                <div className={styles.terminalAmountLabel}>AMOUNT</div>
                <div className={styles.terminalAmountValue}>₦{safeTerminalOrder.amount.toLocaleString()}</div>
              </div>
              
              <div className={styles.terminalReference}>
                <div className={styles.terminalReferenceLabel}>REFERENCE</div>
                <div className={styles.terminalReferenceValue}>{safeTerminalOrder.order_reference}</div>
              </div>

              <div className={styles.terminalStatus}>
                <div className={styles.terminalStatusLabel}>STATUS</div>
                <div className={styles.terminalStatusValue}>
                  {safeTerminalOrder.paymentStatus.toUpperCase().replace('_', ' ')}
                </div>
              </div>
              
              <div className={styles.tapButton}>
                TAP / SWIPE / INSERT CARD
              </div>
              
              <div className={styles.terminalFooter}>
                CONTACTLESS • CHIP • SWIPE
              </div>
            </div>
            <p>
              <strong>API Powering This:</strong> Terminal Event API (type: transaction, action: process)
            </p>
          </div>

          {/* Terminal Delivery Process Explanation */}
          <div className={styles.processExplanation}>
            <h4>How Terminal on Delivery Works:</h4>
            <ol>
              <li>We dispatch a rider with a Paystack Terminal to your location</li>
              <li>When the rider arrives, they trigger payment collection</li>
              <li>Our system sends the payment request to the terminal</li>
              <li>You pay with card or contactless on the terminal</li>
              <li>Payment is automatically confirmed and tied to your order</li>
              <li>Rider completes the delivery</li>
            </ol>
          </div>

          {/* Traceability Features */}
          <div className={styles.traceabilityFeatures}>
            <h5>🔗 Traceability Features:</h5>
            <ul>
              <li><strong>Order Reference:</strong> {safeTerminalOrder.order_reference} - Links payment to order</li>
              <li><strong>Webhook Integration:</strong> Automatic payment confirmation</li>
              <li><strong>Metadata:</strong> Order details included in transaction</li>
              <li><strong>Vendor Tracking:</strong> Each item linked to specific vendor for payout</li>
            </ul>
          </div>
        </div>

        <div className={styles.textCenter}>
          <Link href="/" className={styles.continueShopping}>
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  // Main Checkout Form View
  return (
    <div className={styles.container}>
      <h1>Checkout</h1>
      
      {/* Order Summary Section */}
      <div className={styles.orderSummary}>
        <h2>Order Summary</h2>
        {state.items.map(item => (
          <div key={item.product.id} className={styles.orderItem}>
            <div className={styles.orderItemInfo}>
              <h4>{item.product.name}</h4>
              <p className={styles.orderItemPrice}>₦{item.product.price.toLocaleString()} each</p>
              <p className={styles.orderItemVendor}>Vendor: {item.product.vendorName}</p>
            </div>
            
            <div className={styles.quantityControls}>
              <button
                onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                className={`${styles.quantityButton} ${styles.quantityMinus}`}
              >
                -
              </button>
              
              <span className={styles.quantityDisplay}>{item.quantity}</span>
              
              <button
                onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                className={`${styles.quantityButton} ${styles.quantityPlus}`}
              >
                +
              </button>
              
              <button
                onClick={() => removeItem(item.product.id)}
                className={styles.removeButton}
              >
                Remove
              </button>
            </div>
            
            <div>
              <strong>₦{(item.product.price * item.quantity).toLocaleString()}</strong>
            </div>
          </div>
        ))}
        
        <div className={styles.orderTotal}>
          <h3>Total: ₦{state.total.toLocaleString()}</h3>
        </div>
      </div>

      {/* Payment Form Section */}
      <form onSubmit={handleSubmit} className={styles.paymentForm}>
        <div className={styles.formGroup}>
          <label className={styles.formLabel}>
            Email Address:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className={styles.formInput}
            placeholder="Enter your email for order confirmation"
          />
        </div>

        {/* Delivery Address Input (Terminal Delivery Only) */}
        {paymentMethod === 'terminal_delivery' && (
          <div className={styles.formGroup}>
            <label className={styles.formLabel}>Delivery Address:</label>
            <input
              type="text"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              required
              className={styles.formInput}
              placeholder="Enter your delivery address"
            />
          </div>
        )}

        {/* Payment Method Selection */}
        <div className={styles.paymentMethods}>
          <label className={styles.formLabel}>
            Payment Method:
          </label>
          
          {/* Pre-pay Now Option */}
          <label className={styles.paymentOption}>
            <input
              type="radio"
              value="prepay_now"
              checked={paymentMethod === 'prepay_now'}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            />
            <div className={styles.paymentOptionContent}>
              <strong>💳 Pre-pay Now</strong>
              <p>
                Pay instantly with your card. Your order will be processed immediately.
              </p>
            </div>
          </label>
          
          {/* Bank Transfer on Delivery Option */}
          <label className={styles.paymentOption}>
            <input
              type="radio"
              value="bank_transfer_delivery"
              checked={paymentMethod === 'bank_transfer_delivery'}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            />
            <div className={styles.paymentOptionContent}>
              <strong>🏦 Bank Transfer on Delivery</strong>
              <p>
                Pay via bank transfer when your delivery arrives. We'll provide a virtual account number.
              </p>
            </div>
          </label>

          {/* Terminal on Delivery Option */}
          <label className={styles.paymentOption}>
            <input
              type="radio"
              value="terminal_delivery"
              checked={paymentMethod === 'terminal_delivery'}
              onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
            />
            <div className={styles.paymentOptionContent}>
              <strong>💳 Terminal on Delivery</strong>
              <p>
                Pay with card/contactless when rider arrives with terminal
              </p>
            </div>
          </label>
        </div>
        
        {/* Action Buttons */}
        <div className={styles.actionButtons}>
          <Link href="/" className={styles.continueShopping}>
            Continue Shopping
          </Link>
          
          <button 
            type="submit" 
            disabled={loading || state.total === 0}
            className={styles.submitButton}
          >
            {loading ? 'Processing...' : 
             paymentMethod === 'bank_transfer_delivery' ? `Place Order (Pay on Delivery)` :
             paymentMethod === 'terminal_delivery' ? `Place Order (Pay with Terminal)` :
             `Pay Now ₦${state.total.toLocaleString()}`
            }
          </button>
        </div>
      </form>
    </div>
  );
}