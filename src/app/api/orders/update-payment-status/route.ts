// src/app/api/orders/update-payment-status/route.ts

/**
 * Order Payment Status Update API Endpoint
 * 
 * Provides centralized endpoint for updating order payment status across the application.
 * Used by webhooks, payment verification, and internal processes to maintain
 * consistent order status tracking and payment state management.
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateOrderPaymentStatus, getOrderByReference } from '../../../../services/orderTrackingService';

export async function POST(request: NextRequest) {
  try {
    const { orderReference, status, paymentData } = await request.json();

    // Validate required input parameters
    if (!orderReference || !status) {
      return NextResponse.json(
        { error: 'Order reference and status are required' },
        { status: 400 }
      );
    }

    /**
     * Update order status in tracking system
     * 
     * Updates payment status and stores comprehensive payment data
     * for audit trails and vendor payout processing.
     */
    updateOrderPaymentStatus(orderReference, status, paymentData);

    // Retrieve updated order for response verification
    const updatedOrder = getOrderByReference(orderReference);

    return NextResponse.json({
      status: true,
      message: `Order ${orderReference} updated to ${status}`,
      data: updatedOrder
    });

  } catch (error) {
    console.error('Payment status update error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}