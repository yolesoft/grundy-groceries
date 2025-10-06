// src/app/api/rider/dispatch/route.ts

/**
 * Rider Dispatch API Endpoint
 * 
 * Handles order dispatch to riders for delivery management.
 * Assigns riders to orders and updates delivery status for
 * comprehensive order tracking and rider management.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getOrderByReference, updateOrderDeliveryStatus } from '../../../../services/orderTrackingService';

// Mock rider data for demonstration purposes
const riders = [
  { id: 'RIDER_001', name: 'John Rider', terminal_id: 'TERMINAL_001', status: 'available' },
  { id: 'RIDER_002', name: 'Jane Rider', terminal_id: 'TERMINAL_002', status: 'available' }
];

export async function POST(request: NextRequest) {
  try {
    const { order_id, rider_id } = await request.json();

    // Validate required input parameters
    if (!order_id || !rider_id) {
      return NextResponse.json(
        { error: 'Order ID and Rider ID are required' },
        { status: 400 }
      );
    }

    // Find rider and their terminal assignment
    const rider = riders.find(r => r.id === rider_id);
    if (!rider) {
      return NextResponse.json(
        { error: 'Rider not found' },
        { status: 404 }
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

    /**
     * Update order with rider and terminal assignment
     * 
     * Assigns rider to order and links terminal for payment collection
     * in terminal delivery scenarios.
     */
    updateOrderDeliveryStatus(order_id, rider.id, rider.terminal_id);

    // Retrieve updated order for response verification
    const updatedOrder = getOrderByReference(order_id);

    return NextResponse.json({
      status: true,
      message: 'Order dispatched to rider',
      data: {
        order: updatedOrder,
        rider: rider
      }
    });

  } catch (error) {
    console.error('Dispatch error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}