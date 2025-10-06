// src/app/api/vendors/orders/route.ts

/**
 * Vendor Orders API Endpoint
 * 
 * Provides comprehensive order data with vendor payout calculations
 * for vendor dashboard and analytics. Aggregates order information
 * with vendor-specific payout data for performance tracking.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getAllOrders } from '../../../../services/orderTrackingService';

export async function GET() {
  try {
    const orders = getAllOrders();
    
    /**
     * Calculate vendor payouts from all orders
     * 
     * Aggregates order data to provide comprehensive vendor performance
     * metrics including total sales, payouts, and order counts.
     */
    const vendorPayouts = orders.reduce((acc: any, order) => {
      if (order.vendorPayouts) {
        order.vendorPayouts.forEach((payout: any) => {
          if (!acc[payout.vendorId]) {
            acc[payout.vendorId] = {
              vendorId: payout.vendorId,
              vendorName: payout.vendorName,
              totalSales: 0,
              totalPayouts: 0,
              ordersCount: 0
            };
          }
          acc[payout.vendorId].totalSales += payout.totalSales;
          acc[payout.vendorId].totalPayouts += payout.vendorPayout;
          acc[payout.vendorId].ordersCount += 1;
        });
      }
      return acc;
    }, {});

    return NextResponse.json({
      status: true,
      data: {
        orders: orders,
        vendorPayouts: Object.values(vendorPayouts)
      }
    });
  } catch (error) {
    console.error('Failed to fetch vendor orders:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}