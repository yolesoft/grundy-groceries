// src/app/api/orders/route.ts

/**
 * Orders Management API Endpoint
 * 
 * Provides comprehensive order data access for the application.
 * Supports filtering by payment method and includes vendor payout
 * calculations for order analytics and reporting.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders } from '../../../services/orderTrackingService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentMethod = searchParams.get('paymentMethod');
    
    // Retrieve all orders from tracking system
    let orders = getAllOrders();
    
    /**
     * Filter orders by payment method if specified
     * 
     * Supports filtering for specific payment methods (prepay_now, 
     * bank_transfer_delivery, terminal_delivery) for specialized views.
     */
    if (paymentMethod) {
      orders = orders.filter(order => order.paymentMethod === paymentMethod);
    }
    
    return NextResponse.json({
      status: true,
      data: orders
    });
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}