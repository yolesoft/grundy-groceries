// src/app/rider/page.tsx
'use client';
import { useState, useEffect } from 'react';
import styles from '../styles/rider.module.css';

interface Order {
  id: string;
  orderReference: string;
  customerEmail: string;
  customerName: string;
  amount: number;
  paymentMethod: 'prepay_now' | 'bank_transfer_delivery' | 'terminal_delivery';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'delivered';
  deliveryAddress?: string;
  items: any[];
  vendorPayouts?: any[];
  createdAt: string;
  paidAt?: string;
  deliveredAt?: string;
  riderId?: string;
  terminalId?: string;
}

/**
 * Rider Delivery App Component
 * 
 * Comprehensive rider interface for managing delivery orders across all payment methods.
 * Provides real-time order tracking, payment collection, and delivery completion workflows.
 * 
 * Features:
 * - Real-time order monitoring with auto-refresh
 * - Payment collection for terminal delivery orders
 * - Order dispatch and delivery completion
 * - Multi-tab interface for active/completed orders
 * - Detailed order information and vendor split tracking
 */
export default function RiderPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [terminalId, setTerminalId] = useState('TERMINAL_001');
  const [activeTab, setActiveTab] = useState<'active' | 'completed' | 'all'>('active');

  // Mock rider data for demonstration
  const rider = { id: 'RIDER_001', name: 'John Rider', terminal_id: 'TERMINAL_001' };

  /**
   * Fetches orders from the centralized orders API
   * Includes fallback to localStorage for demo purposes
   * @param quiet - Whether to show loading state (for background refreshes)
   */
  const fetchOrders = async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      
      // Fetch from our centralized orders API
      const response = await fetch('/api/orders');
      const data = await response.json();
      
      if (data.status) {
        setOrders(data.data);
      } else {
        // Fallback to localStorage for demo purposes
        const storedOrders = localStorage.getItem('grundy_orders');
        if (storedOrders) {
          setOrders(JSON.parse(storedOrders));
        }
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
      // Fallback to localStorage
      const storedOrders = localStorage.getItem('grundy_orders');
      if (storedOrders) {
        setOrders(JSON.parse(storedOrders));
      }
    } finally {
      if (!quiet) setLoading(false);
    }
  };

  // Initial data load on component mount
  useEffect(() => {
    fetchOrders();
  }, []);

  // Real-time updates with auto-refresh
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(true); // Quiet background refresh
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [activeTab]);

  /**
   * Dispatches an order to the current rider
   * Assigns rider to order for delivery responsibility
   * @param orderId - Unique identifier of the order to dispatch
   */
  const dispatchOrder = async (orderId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/rider/dispatch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, rider_id: rider.id })
      });

      const data = await response.json();

      if (data.status) {
        fetchOrders();
        alert('✅ Order dispatched successfully!');
      } else {
        alert(`❌ Failed to dispatch: ${data.error}`);
      }
    } catch (error) {
      console.error('Dispatch error:', error);
      alert('Failed to dispatch order');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Initiates payment collection for terminal delivery orders
   * Simulates terminal payment process with automatic confirmation
   * @param orderId - Unique identifier of the order to collect payment for
   */
  const collectPayment = async (orderId: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/terminal/collect-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order_id: orderId, terminal_id: terminalId })
      });

      const data = await response.json();
      
      if (data.status) {
        alert('💰 Payment request sent to terminal! (Demo: Will auto-confirm in 2 seconds)');
        
        // Refresh orders after a delay to see the payment status update
        setTimeout(() => {
          fetchOrders();
        }, 2500);
        
      } else {
        alert(`❌ Failed to collect payment: ${data.error}`);
      }
    } catch (error) {
      console.error('Payment collection error:', error);
      alert('Failed to collect payment');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Marks an order as delivered and completes the delivery workflow
   * Updates order status and triggers any post-delivery processes
   * @param orderId - Unique identifier of the order to complete
   */
  const completeDelivery = async (orderId: string) => {
    setLoading(true);
    try {
      // Update delivery status via API
      const response = await fetch('/api/orders/update-payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderReference: orderId,
          status: 'delivered',
          paymentData: {
            delivered_at: new Date().toISOString(),
            rider_id: rider.id
          }
        })
      });

      const data = await response.json();

      if (data.status) {
        fetchOrders();
        alert('🎉 Delivery completed successfully!');
      } else {
        alert(`❌ Failed to complete delivery: ${data.error}`);
      }
    } catch (error) {
      console.error('Delivery completion error:', error);
      alert('Failed to complete delivery');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Gets CSS class for status badges based on order payment status
   * @param status - Current payment status of the order
   * @returns CSS class name for styling
   */
  const getStatusClass = (status: string) => {
    switch (status) {
      case 'pending': return styles.statusPending;
      case 'paid': return styles.statusPaid;
      case 'delivered': return styles.statusDelivered;
      case 'failed': return styles.statusFailed;
      default: return styles.statusPending;
    }
  };

  /**
   * Gets icon representation for payment methods
   * @param method - Payment method used for the order
   * @returns Emoji icon representing the payment method
   */
  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'prepay_now': return '💳';
      case 'bank_transfer_delivery': return '🏦';
      case 'terminal_delivery': return '📱';
      default: return '🛒';
    }
  };

  // Filter orders based on active tab selection
  const filteredOrders = orders.filter(order => {
    if (activeTab === 'active') {
      return order.paymentStatus !== 'delivered';
    }
    if (activeTab === 'completed') {
      return order.paymentStatus === 'delivered';
    }
    return true; // 'all' tab - show all orders
  });

  // Count orders for each category for tab display
  const activeOrdersCount = orders.filter(o => o.paymentStatus !== 'delivered').length;
  const completedOrdersCount = orders.filter(o => o.paymentStatus === 'delivered').length;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>🚚 Rider Delivery App</h1>
          <p>Manage all delivery orders - Prepaid, Bank Transfer, and Terminal</p>
        </div>
        <div className={styles.headerActions}>
          <span className={styles.riderInfo}>Rider: {rider.name}</span>
          <select 
            value={terminalId}
            onChange={(e) => setTerminalId(e.target.value)}
            className={styles.terminalSelect}
          >
            <option value="TERMINAL_001">Terminal 001</option>
            <option value="TERMINAL_002">Terminal 002</option>
          </select>
          <button 
            onClick={() => fetchOrders()}
            className={styles.refreshButton}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className={styles.tabs}>
        <button
          onClick={() => setActiveTab('active')}
          className={`${styles.tab} ${activeTab === 'active' ? styles.tabActive : ''}`}
        >
          📋 Active Orders ({activeOrdersCount})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`${styles.tab} ${activeTab === 'completed' ? styles.tabActive : ''}`}
        >
          ✅ Completed Orders ({completedOrdersCount})
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`${styles.tab} ${activeTab === 'all' ? styles.tabActive : ''}`}
        >
          📊 All Orders ({orders.length})
        </button>
      </div>

      <div className={styles.dashboardLayout}>
        
        {/* Orders List Section */}
        <div className={styles.ordersList}>
          <h2>
            {activeTab === 'active' && 'Active Delivery Orders'}
            {activeTab === 'completed' && 'Completed Deliveries'}
            {activeTab === 'all' && 'All Orders'}
          </h2>
          
          {filteredOrders.length === 0 ? (
            <div className={styles.emptyState}>
              No orders found for this filter
            </div>
          ) : (
            filteredOrders.map(order => (
              <div key={order.id} className={`${styles.orderCard} ${
                selectedOrder?.id === order.id ? styles.orderCardSelected : ''
              }`}>
                <div className={styles.orderHeader}>
                  <div className={styles.orderInfo}>
                    <div className={styles.orderCustomer}>
                      <span>{getPaymentMethodIcon(order.paymentMethod)}</span>
                      <h4>{order.customerName}</h4>
                    </div>
                    <p className={styles.orderDetails}>📧 {order.customerEmail}</p>
                    {order.deliveryAddress && (
                      <p className={styles.orderDetails}>📍 {order.deliveryAddress}</p>
                    )}
                    <p className={styles.orderAmount}>₦{order.amount.toLocaleString()}</p>
                    <div className={styles.orderStatus}>
                      <span className={`${styles.statusBadge} ${getStatusClass(order.paymentStatus)}`}>
                        {order.paymentStatus.toUpperCase()}
                      </span>
                      <span className={styles.paymentMethod}>
                        {order.paymentMethod.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                  
                  <div className={styles.orderActions}>
                    {/* Accept Order Button - Show for any pending or paid order without a rider */}
                    {(order.paymentStatus === 'pending' || order.paymentStatus === 'paid') && !order.riderId && (
                      <button
                        onClick={() => dispatchOrder(order.orderReference)}
                        disabled={loading}
                        className={`${styles.actionButton} ${styles.acceptButton}`}
                      >
                        📦 Accept Order
                      </button>
                    )}
                    
                    {/* Collect Payment Button - Only for terminal delivery orders that are pending and assigned to this rider */}
                    {order.paymentStatus === 'pending' && order.riderId === rider.id && order.paymentMethod === 'terminal_delivery' && (
                      <button
                        onClick={() => collectPayment(order.orderReference)}
                        disabled={loading}
                        className={`${styles.actionButton} ${styles.collectButton}`}
                      >
                        💳 Collect Payment
                      </button>
                    )}
                    
                    {/* Complete Delivery Button - Show for ANY paid order assigned to this rider (including prepaid) */}
                    {order.paymentStatus === 'paid' && order.riderId === rider.id && (
                      <button
                        onClick={() => completeDelivery(order.orderReference)}
                        disabled={loading}
                        className={`${styles.actionButton} ${styles.completeButton}`}
                      >
                        ✅ Complete Delivery
                      </button>
                    )}
                    
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className={`${styles.actionButton} ${styles.detailsButton}`}
                    >
                      👁️ View Details
                    </button>
                  </div>
                </div>
                
                <div className={styles.orderMeta}>
                  <div><strong>Order Ref:</strong> {order.orderReference}</div>
                  {order.riderId && <div><strong>Assigned Rider:</strong> {order.riderId}</div>}
                  {order.terminalId && <div><strong>Terminal:</strong> {order.terminalId}</div>}
                  {order.vendorPayouts && (
                    <div><strong>Vendors:</strong> {order.vendorPayouts.length}</div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order Details Panel */}
        <div className={styles.orderDetailsPanel}>
          <h2>Order Details</h2>
          {selectedOrder ? (
            <div className={styles.detailsCard}>
              <h3>
                {getPaymentMethodIcon(selectedOrder.paymentMethod)} Order {selectedOrder.orderReference}
              </h3>
              
              <div className={styles.detailsSection}>
                <strong>Customer:</strong> {selectedOrder.customerName} ({selectedOrder.customerEmail})
              </div>
              
              {selectedOrder.deliveryAddress && (
                <div className={styles.detailsSection}>
                  <strong>Delivery Address:</strong> {selectedOrder.deliveryAddress}
                </div>
              )}
              
              <div className={styles.detailsSection}>
                <strong>Amount:</strong> ₦{selectedOrder.amount.toLocaleString()}
              </div>
              
              <div className={styles.detailsSection}>
                <strong>Payment Method:</strong> {selectedOrder.paymentMethod.replace(/_/g, ' ')}
              </div>
              
              <div className={styles.detailsSection}>
                <strong>Status:</strong> 
                <span className={`${styles.statusBadge} ${getStatusClass(selectedOrder.paymentStatus)}`}>
                  {selectedOrder.paymentStatus.toUpperCase()}
                </span>
              </div>
              
              {selectedOrder.riderId && (
                <div className={styles.detailsSection}>
                  <strong>Assigned Rider:</strong> {selectedOrder.riderId}
                </div>
              )}
              
              {selectedOrder.terminalId && (
                <div className={styles.detailsSection}>
                  <strong>Terminal:</strong> {selectedOrder.terminalId}
                </div>
              )}
              
              <div className={styles.detailsSection}>
                <strong>Items:</strong>
                <ul className={styles.itemsList}>
                  {selectedOrder.items.map((item: any, index: number) => (
                    <li key={index}>
                      {item.quantity}x {item.product?.name || item.name} - ₦{item.product?.price ? (item.product.price * item.quantity).toLocaleString() : '0'}
                      {item.product?.vendorName && ` (${item.product.vendorName})`}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Vendor Split Information */}
              {selectedOrder.vendorPayouts && (
                <div className={styles.vendorSplit}>
                  <strong>Vendor Split:</strong>
                  <div className={styles.vendorSplitDetails}>
                    {selectedOrder.vendorPayouts.map((payout: any, index: number) => (
                      <div key={index} className={styles.vendorSplitRow}>
                        {payout.vendorName}: ₦{payout.vendorPayout.toLocaleString()}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className={styles.timestamp}>
                <div><strong>Created:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</div>
                {selectedOrder.paidAt && (
                  <div><strong>Paid:</strong> {new Date(selectedOrder.paidAt).toLocaleString()}</div>
                )}
                {selectedOrder.deliveredAt && (
                  <div><strong>Delivered:</strong> {new Date(selectedOrder.deliveredAt).toLocaleString()}</div>
                )}
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              Select an order to view details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}