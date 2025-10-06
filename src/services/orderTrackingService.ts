// src/services/orderTrackingService.ts

/**
 * Order Tracking Service
 * 
 * Comprehensive order management system for tracking orders across all payment methods.
 * Provides in-memory storage for demo purposes with full CRUD operations.
 * In production, this would be replaced with database persistence.
 */

/**
 * Order Interface
 * 
 * Defines the complete structure of an order in the system including
 * payment details, delivery information, and vendor payout data.
 */
export interface Order {
  id: string;
  orderReference: string;
  customerEmail: string;
  customerName: string;
  deliveryAddress?: string;
  amount: number;
  items: any[];
  paymentMethod: 'prepay_now' | 'bank_transfer_delivery' | 'terminal_delivery';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded' | 'delivered';
  paymentReference?: string;
  paymentDetails?: any;
  vendorPayouts?: any[];
  createdAt: string;
  paidAt?: string;
  deliveredAt?: string;
  riderId?: string;
  terminalId?: string;
}

/**
 * In-memory Order Storage
 * 
 * Temporary storage for orders during demo and development.
 * In production, this would be replaced with database integration.
 */
let orders: Order[] = [];

/**
 * Creates a new order in the tracking system
 * 
 * Generates unique order ID and timestamp, then stores the order
 * in the tracking system with initial 'pending' payment status.
 * 
 * @param orderData - Complete order information excluding auto-generated fields
 * @returns The newly created order with system-generated fields
 */
export function createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'paymentStatus'>): Order {
  const order: Order = {
    id: `order_${Date.now()}`,
    paymentStatus: 'pending',
    createdAt: new Date().toISOString(),
    ...orderData
  };
  
  orders.push(order);
  
  console.log('📦 Order created:', {
    reference: order.orderReference,
    method: order.paymentMethod,
    amount: order.amount,
    items: order.items.length,
    status: order.paymentStatus
  });
  
  // Debug logging for order tracking
  console.log('📊 Current orders in system:', orders.map(o => ({
    reference: o.orderReference,
    method: o.paymentMethod, 
    status: o.paymentStatus
  })));
  
  return order;
}

/**
 * Updates the payment status of an existing order
 * 
 * Handles payment status transitions and updates relevant timestamps.
 * Includes comprehensive logging for audit trails and debugging.
 * 
 * @param orderReference - Unique identifier for the order
 * @param paymentStatus - New payment status to set
 * @param paymentData - Optional payment details and metadata
 */
export function updateOrderPaymentStatus(orderReference: string, paymentStatus: Order['paymentStatus'], paymentData?: any) {
  console.log('🔄 updateOrderPaymentStatus called:', { orderReference, paymentStatus });
  
  const order = orders.find(o => o.orderReference === orderReference);
  
  if (order) {
    console.log('📝 Before update:', {
      orderReference: order.orderReference,
      currentStatus: order.paymentStatus,
      hasPaymentReference: !!order.paymentReference
    });
    
    // Update order payment information
    order.paymentStatus = paymentStatus;
    order.paymentReference = paymentData?.reference || order.paymentReference;
    order.paymentDetails = paymentData;
    
    // Set paid timestamp if payment is successful
    if (paymentStatus === 'paid') {
      order.paidAt = new Date().toISOString();
    }
    
    console.log('📝 After update:', {
      orderReference: order.orderReference,
      newStatus: order.paymentStatus,
      paymentReference: order.paymentReference,
      paidAt: order.paidAt
    });
    
    console.log('💰 Order payment updated:', orderReference, paymentStatus);
  } else {
    console.error('❌ Order not found for update:', orderReference);
    console.log('📊 Available orders:', orders.map(o => o.orderReference));
  }
}

/**
 * Updates delivery-related information for an order
 * 
 * Assigns rider and terminal information to orders for delivery tracking
 * and terminal payment processing.
 * 
 * @param orderReference - Unique identifier for the order
 * @param riderId - Optional rider identifier assigned to delivery
 * @param terminalId - Optional terminal identifier used for payment
 */
export function updateOrderDeliveryStatus(orderReference: string, riderId?: string, terminalId?: string) {
  const order = orders.find(o => o.orderReference === orderReference);
  
  if (order) {
    order.riderId = riderId;
    order.terminalId = terminalId;
    console.log('🚚 Order delivery updated:', orderReference, riderId, terminalId);
  }
}

/**
 * Marks an order as delivered and updates completion timestamp
 * 
 * Finalizes the delivery process by updating status and recording
 * delivery completion time.
 * 
 * @param orderReference - Unique identifier for the order to mark as delivered
 */
export function completeOrderDelivery(orderReference: string) {
  const order = orders.find(o => o.orderReference === orderReference);
  
  if (order) {
    order.deliveredAt = new Date().toISOString();
    order.paymentStatus = 'delivered';
    console.log('✅ Order delivered:', orderReference);
  }
}

/**
 * Retrieves an order by its reference number
 * 
 * Provides order lookup functionality with comprehensive logging
 * for debugging and audit purposes.
 * 
 * @param orderReference - Unique identifier for the order
 * @returns The order object if found, undefined otherwise
 */
export function getOrderByReference(orderReference: string): Order | undefined {
  const order = orders.find(o => o.orderReference === orderReference);
  
  if (order) {
    console.log('🔍 Order lookup SUCCESS:', { 
      reference: orderReference, 
      method: order.paymentMethod,
      status: order.paymentStatus,
      paymentReference: order.paymentReference
    });
  } else {
    console.log('🔍 Order lookup FAILED:', { 
      reference: orderReference,
      availableOrders: orders.map(o => o.orderReference)
    });
  }
  
  return order;
}

/**
 * Retrieves all orders in the system
 * 
 * Provides access to all orders regardless of status or payment method.
 * Useful for administrative dashboards and reporting.
 * 
 * @returns Array of all orders in chronological order (newest first)
 */
export function getAllOrders(): Order[] {
  return orders;
}

/**
 * Filters orders by their current payment status
 * 
 * Enables status-based order filtering for different views and reports.
 * 
 * @param status - Payment status to filter by
 * @returns Array of orders matching the specified payment status
 */
export function getOrdersByStatus(status: Order['paymentStatus']): Order[] {
  return orders.filter(o => o.paymentStatus === status);
}

/**
 * Filters orders by their payment method type
 * 
 * Supports filtering by payment method for analytics and reporting.
 * 
 * @param paymentMethod - Payment method to filter by
 * @returns Array of orders using the specified payment method
 */
export function getOrdersByPaymentMethod(paymentMethod: string): Order[] {
  return orders.filter(o => o.paymentMethod === paymentMethod);
}