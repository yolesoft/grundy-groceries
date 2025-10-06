// src/app/api/terminal/collect-payment/route.ts

/**
 * Terminal Payment Collection API Endpoint
 * 
 * Simulates terminal payment collection process for demonstration purposes.
 * In production, this would integrate with Paystack Terminal API for
 * actual terminal payment processing and event management.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrderByReference, updateOrderPaymentStatus } from '../../../../services/orderTrackingService';

export async function POST(request: NextRequest) {
  try {
    const { order_id, terminal_id } = await request.json();

    // Validate required input parameters
    if (!order_id || !terminal_id) {
      return NextResponse.json(
        { error: 'Order ID and Terminal ID are required' },
        { status: 400 }
      );
    }

    // Find order in order tracking system
    const order = getOrderByReference(order_id);
    if (!order) {
      return NextResponse.json(
        { error: 'Order not found in tracking system' },
        { status: 404 }
      );
    }

    // Validate order is in pending payment state
    if (order.paymentStatus !== 'pending') {
      return NextResponse.json(
        { error: 'Order is not in pending payment state' },
        { status: 400 }
      );
    }

    /**
     * DEMO/TEST MODE: Simulate terminal payment process
     * 
     * In production, this would call Paystack Terminal API to initiate
     * actual payment collection on physical terminal devices.
     */
    console.log(`🧪 DEMO: Starting terminal payment process for order ${order_id} on terminal ${terminal_id}`);
    
    // Update order status to indicate payment collection started
    updateOrderPaymentStatus(order_id, 'pending'); // Still pending until payment confirmed

    // In a real scenario, we would call Paystack Terminal API here
    // For demo, we simulate the terminal response immediately
    const terminalData = {
      status: true,
      data: {
        id: `terminal_event_${Date.now()}`,
        reference: order_id,
        terminal_id: terminal_id,
        amount: order.amount,
        status: 'pending'
      }
    };

    /**
     * SIMULATE PAYMENT SUCCESS AFTER 2 SECONDS (for demo purposes)
     * 
     * Automatically simulates successful payment after delay to demonstrate
     * the complete terminal payment workflow.
     */
    setTimeout(async () => {
      console.log(`✅ DEMO: Simulating successful terminal payment for order ${order_id}`);
      
      // Update order status to paid in our tracking system via internal API
      await fetch(`${process.env.NEXTAUTH_URL}/api/orders/update-payment-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderReference: order_id,
          status: 'paid',
          paymentData: {
            reference: order_id,
            amount: order.amount * 100,
            channel: 'terminal',
            status: 'success',
            paid_at: new Date().toISOString(),
            metadata: {
              orderReference: order_id,
              terminal_id: terminal_id,
              test_mode: true,
              simulated_payment: true
            }
          }
        })
      });
      
      console.log(`📊 DEMO: Order ${order_id} status updated to PAID via terminal payment`);
    }, 2000);

    return NextResponse.json({
      status: true,
      message: 'Payment request sent to terminal (DEMO MODE - Payment will auto-confirm in 2 seconds)',
      data: {
        event_id: terminalData.data.id,
        order: order,
        terminal_response: terminalData,
        demo_note: 'In production, this would trigger actual terminal payment collection'
      }
    });

  } catch (error) {
    console.error('Collect payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}