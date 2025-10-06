// src/app/api/payment/verify/route.ts

/**
 * Payment Verification API Endpoint
 * 
 * Verifies payment status with Paystack and updates order status accordingly.
 * Provides comprehensive payment verification with automatic order status
 * updates for successful payments.
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateOrderPaymentStatus, getOrderByReference } from '../../../../services/orderTrackingService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reference = searchParams.get('reference');

    // Validate required reference parameter
    if (!reference) {
      return NextResponse.json(
        { error: 'Reference is required' },
        { status: 400 }
      );
    }

    /**
     * Verify payment status with Paystack API
     * 
     * Queries Paystack to confirm payment status and retrieve
     * comprehensive transaction details.
     */
    const paystackResponse = await fetch(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );

    const data = await paystackResponse.json();

    /**
     * CRITICAL: Update order status if payment is successful
     * 
     * Automatically updates order status to 'paid' when Paystack
     * confirms successful payment completion.
     */
    if (data.status && data.data.status === 'success') {
      console.log('✅ Payment verified as successful, updating order status...');
      
      // Update order status to paid with comprehensive payment data
      updateOrderPaymentStatus(reference, 'paid', data.data);
      
      console.log('💰 Order status updated to paid:', reference);
    }

    return NextResponse.json(data);

  } catch (error) {
    console.error('Payment verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}