// src/app/api/orders/terminal-delivery/route.ts

/**
 * Terminal Delivery Order API Endpoint
 * 
 * Handles creation of orders for terminal on delivery payment method.
 * Creates orders with comprehensive tracking for terminal payment collection
 * and includes vendor payout calculations for multi-vendor scenarios.
 */

import { NextRequest, NextResponse } from 'next/server';
import { calculateOrderSplit } from '../../../../services/vendorPayoutService';
import { createOrder } from '../../../../services/orderTrackingService';

export async function POST(request: NextRequest) {
  try {
    const { email, amount, items, customer_name, delivery_address, orderReference } = await request.json();

    console.log('Received terminal delivery request:', {
      email, amount, items, customer_name, delivery_address, orderReference
    });

    // Validate required input parameters
    if (!email || !amount) {
      return NextResponse.json(
        { error: 'Email and amount are required' },
        { status: 400 }
      );
    }

    // Calculate order split for vendor payouts and platform revenue
    const orderSplit = calculateOrderSplit(items);
    
    // Generate unique order reference if not provided for traceability
    const finalOrderReference = orderReference || `ORDER_${Date.now()}`;
    
    /**
     * Create order in tracking system with comprehensive details
     * 
     * Stores order information with vendor payout calculations for
     * automated payment distribution when terminal payment is collected.
     */
    const trackedOrder = createOrder({
      orderReference: finalOrderReference,
      customerEmail: email,
      customerName: customer_name || email.split('@')[0],
      deliveryAddress: delivery_address || 'Lagos, Nigeria',
      amount: amount,
      items: items,
      paymentMethod: 'terminal_delivery',
      vendorPayouts: orderSplit.vendorPayouts
    });

    console.log('Created tracked order:', trackedOrder);

    // Prepare response data with comprehensive order information
    const responseData = {
      ...trackedOrder,
      order_split: orderSplit
    };

    console.log('Sending response:', responseData);

    return NextResponse.json({
      status: true,
      message: 'Terminal delivery order created successfully',
      data: responseData
    });

  } catch (error) {
    console.error('Terminal delivery error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}