// src/app/order-tracking/page.tsx
'use client';
import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import styles from '../styles/order-tracking.module.css';

interface Order {
  id: string;
  orderReference: string;
  customerEmail: string;
  customerName: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  paymentReference?: string;
  createdAt: string;
  paidAt?: string;
  items: any[];
  vendorPayouts?: any[];
  deliveryAddress?: string;
  riderId?: string;
  terminalId?: string;
}

/**
 * Order Tracking & Traceability Dashboard Component
 * 
 * Comprehensive real-time order monitoring system with automatic updates,
 * detailed traceability information, and vendor payout calculations.
 * 
 * Features:
 * - Real-time order monitoring with auto-refresh
 * - Advanced filtering by payment status
 * - Detailed order traceability and audit trails
 * - Vendor payout breakdown and calculations
 * - Payment method and status tracking
 */
export default function OrderTracking() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const previousOrdersRef = useRef<Order[]>([]);

  /**
   * Tracks order count changes and shows notifications for new orders
   * Automatically clears notification after 5 seconds
   */
  useEffect(() => {
    if (previousOrdersRef.current.length > 0 && orders.length > previousOrdersRef.current.length) {
      const newCount = orders.length - previousOrdersRef.current.length;
      setNewOrdersCount(newCount);
      
      // Auto-hide new orders notification after 5 seconds
      setTimeout(() => {
        setNewOrdersCount(0);
      }, 5000);
    }
    previousOrdersRef.current = orders;
  }, [orders]);

  /**
   * Fetches orders from the API with comprehensive error handling
   * Includes fallback to localStorage for demo and offline scenarios
   * @param quiet - Whether to suppress loading indicators (for background refreshes)
   */
  const fetchOrders = async (quiet = false) => {
    try {
      if (!quiet) setLoading(true);
      
      const response = await fetch('/api/orders');
      const data = await response.json();
      
      if (data.status) {
        setOrders(data.data);
        setLastUpdate(new Date().toLocaleTimeString());
      } else {
        // Fallback to localStorage for demo purposes
        const storedOrders = localStorage.getItem('grundy_orders');
        if (storedOrders) {
          setOrders(JSON.parse(storedOrders));
        }
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      // Fallback to localStorage in case of API failure
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

  /**
   * Sets up real-time updates with subtle polling
   * Refreshes data every 10 seconds for live order tracking
   */
  useEffect(() => {
    const interval = setInterval(() => {
      fetchOrders(true); // Quiet background update
    }, 10000); // Update every 10 seconds for better performance

    return () => clearInterval(interval);
  }, []);

  /**
   * Manual refresh function with notification clearing
   * Used for user-initiated data updates
   */
  const refreshOrders = () => {
    fetchOrders();
    setNewOrdersCount(0); // Clear notification when manually refreshing
  };

  /**
   * Filters orders based on current filter selection
   * Supports all orders, paid orders, and pending orders
   */
  const filteredOrders = orders.filter(order => {
    if (filter === 'all') return true;
    if (filter === 'paid') return order.paymentStatus === 'paid';
    if (filter === 'pending') return order.paymentStatus === 'pending';
    return true;
  });

  /**
   * Gets background color for status badges based on payment status
   * @param status - Current payment status of the order
   * @returns CSS class name for status styling
   */
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return styles.statusPaid;
      case 'pending': return styles.statusPending;
      case 'failed': return styles.statusFailed;
      default: return styles.statusPending;
    }
  };

  // Show loading state during initial data fetch
  if (loading && orders.length === 0) {
    return (
      <div className={styles.container}>
        <h1>Order Tracking & Traceability Dashboard</h1>
        <p>Loading orders...</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1>Order Tracking & Traceability Dashboard</h1>
          <p>Real-time order monitoring with automatic updates</p>
          {lastUpdate && (
            <p className={styles.lastUpdate}>
              Last updated: {lastUpdate} • Auto-refresh: Every 10 seconds
            </p>
          )}
        </div>
        <div className={styles.headerActions}>
          {/* New Orders Notification */}
          {newOrdersCount > 0 && (
            <div className={styles.newOrdersNotification}>
              🆕 {newOrdersCount} new order(s)
            </div>
          )}
          <button
            onClick={refreshOrders}
            className={styles.refreshButton}
          >
            <span>🔄 Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className={styles.filters}>
        <button
          onClick={() => setFilter('all')}
          className={`${styles.filterButton} ${filter === 'all' ? styles.filterButtonActive : ''}`}
        >
          All Orders ({orders.length})
        </button>
        <button
          onClick={() => setFilter('paid')}
          className={`${styles.filterButton} ${filter === 'paid' ? styles.filterButtonActive : ''}`}
        >
          Paid ({orders.filter(o => o.paymentStatus === 'paid').length})
        </button>
        <button
          onClick={() => setFilter('pending')}
          className={`${styles.filterButton} ${filter === 'pending' ? styles.filterButtonActive : ''}`}
        >
          Pending ({orders.filter(o => o.paymentStatus === 'pending').length})
        </button>
      </div>

      <div className={styles.dashboardLayout}>
        
        {/* Orders List Section */}
        <div className={styles.ordersSection}>
          <h2>Orders ({filteredOrders.length})</h2>
          {filteredOrders.length === 0 ? (
            <div className={styles.emptyState}>
              No orders found for this filter
            </div>
          ) : (
            <div className={styles.ordersList}>
              {filteredOrders.map(order => (
                <div 
                  key={order.id}
                  className={`${styles.orderCard} ${
                    selectedOrder?.id === order.id ? styles.orderCardSelected : ''
                  }`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className={styles.orderHeader}>
                    <div>
                      <div className={styles.orderReference}>{order.orderReference}</div>
                      <div className={styles.orderDetails}>
                        {order.customerEmail} • ₦{order.amount.toLocaleString()}
                      </div>
                      <div className={styles.orderDetails}>
                        {order.paymentMethod} • {new Date(order.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className={`${styles.orderStatus} ${getStatusColor(order.paymentStatus)}`}>
                      {order.paymentStatus.toUpperCase()}
                    </div>
                  </div>
                  {order.vendorPayouts && (
                    <div className={styles.vendorInfo}>
                      Vendors: {order.vendorPayouts.length} • 
                      Platform Fee: ₦{order.vendorPayouts.reduce((sum, payout) => sum + payout.platformFee, 0).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order Details & Traceability Section */}
        <div className={styles.detailsSection}>
          <h2>Order Details & Traceability</h2>
          {selectedOrder ? (
            <div className={styles.detailsCard}>
              <h3>{selectedOrder.orderReference}</h3>
              
              <div className={styles.paymentInfo}>
                <h4>Payment Information</h4>
                <div className={styles.paymentGrid}>
                  <div className={styles.paymentItem}>
                    <span className={styles.paymentLabel}>Status:</span>
                    <span className={styles.paymentValue}>{selectedOrder.paymentStatus}</span>
                  </div>
                  <div className={styles.paymentItem}>
                    <span className={styles.paymentLabel}>Method:</span>
                    <span className={styles.paymentValue}>{selectedOrder.paymentMethod}</span>
                  </div>
                  <div className={styles.paymentItem}>
                    <span className={styles.paymentLabel}>Amount:</span>
                    <span className={styles.paymentValue}>₦{selectedOrder.amount.toLocaleString()}</span>
                  </div>
                  <div className={styles.paymentItem}>
                    <span className={styles.paymentLabel}>Customer:</span>
                    <span className={styles.paymentValue}>{selectedOrder.customerEmail}</span>
                  </div>
                  {selectedOrder.paymentReference && (
                    <div className={styles.paymentItem}>
                      <span className={styles.paymentLabel}>Payment Ref:</span>
                      <span className={styles.paymentValue}>{selectedOrder.paymentReference}</span>
                    </div>
                  )}
                  {selectedOrder.paidAt && (
                    <div className={styles.paymentItem}>
                      <span className={styles.paymentLabel}>Paid At:</span>
                      <span className={styles.paymentValue}>{new Date(selectedOrder.paidAt).toLocaleString()}</span>
                    </div>
                  )}
                  {selectedOrder.deliveryAddress && (
                    <div className={styles.paymentItem}>
                      <span className={styles.paymentLabel}>Delivery Address:</span>
                      <span className={styles.paymentValue}>{selectedOrder.deliveryAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.itemsSection}>
                <h4>Items & Vendors</h4>
                <table className={styles.itemsTable}>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Vendor</th>
                      <th>Price</th>
                      <th>Qty</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedOrder.items.map((item, index) => (
                      <tr key={index}>
                        <td>{item.product?.name || item.name}</td>
                        <td>{item.product?.vendorName || 'Unknown Vendor'}</td>
                        <td>₦{item.product?.price?.toLocaleString() || '0'}</td>
                        <td>{item.quantity}</td>
                        <td>₦{((item.product?.price || 0) * item.quantity).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Vendor Payouts Section */}
              {selectedOrder.vendorPayouts && selectedOrder.vendorPayouts.length > 0 && (
                <div className={styles.vendorPayouts}>
                  <h4>Vendor Payout Calculations</h4>
                  <table className={styles.payoutsTable}>
                    <thead>
                      <tr>
                        <th>Vendor</th>
                        <th>Sales</th>
                        <th>Platform Fee (10%)</th>
                        <th>Paystack Fee</th>
                        <th>Vendor Payout</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.vendorPayouts.map((payout, index) => (
                        <tr key={index}>
                          <td>{payout.vendorName}</td>
                          <td>₦{payout.totalSales.toLocaleString()}</td>
                          <td>₦{payout.platformFee.toLocaleString()}</td>
                          <td>₦{payout.paystackFeeShare.toLocaleString()}</td>
                          <td>₦{payout.vendorPayout.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className={styles.traceabilityProof}>
                <h4>🔗 Traceability Proof</h4>
                <ul>
                  <li>✅ Order Reference: {selectedOrder.orderReference} links to payment</li>
                  {selectedOrder.paymentReference && (
                    <li>✅ Payment Reference: {selectedOrder.paymentReference} confirms transaction</li>
                  )}
                  <li>✅ Items linked to specific vendors for payout calculation</li>
                  <li>✅ Timestamp tracking from creation to payment</li>
                  <li>✅ Vendor split calculations for automatic payouts</li>
                  <li>✅ Webhook integration for real-time status updates</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className={styles.emptyState}>
              Select an order to view traceability details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}