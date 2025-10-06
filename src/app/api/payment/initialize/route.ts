// src/app/api/payment/initialize/route.ts

/**
 * Payment Initialization API Endpoint
 * 
 * Handles the initialization of payment transactions with Paystack.
 * Creates orders immediately for prepayment scenarios and configures appropriate
 * split payments for multi-vendor orders with comprehensive fee structures.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  calculateOrderSplit, 
  generateSubaccountsForSplit, 
  shouldUseSplitPayment,
  getSingleVendorSubaccount 
} from '../../../../services/vendorPayoutService';
import { createOrder } from '../../../../services/orderTrackingService';

export async function POST(request: NextRequest) {
  try {
    const { email, amount, cartItems, orderReference } = await request.json();

    // Validate required input parameters
    if (!email || !amount || !cartItems) {
      return NextResponse.json(
        { error: 'Email, amount, and cartItems are required' },
        { status: 400 }
      );
    }

    // Calculate vendor payout distribution for the order
    const orderSplit = calculateOrderSplit(cartItems);
    const hasMultipleVendors = shouldUseSplitPayment(orderSplit);
    
    /**
     * Create order immediately in tracking system for prepayment scenarios
     * This ensures order exists before payment completion and provides traceability
     */
    const trackedOrder = createOrder({
      orderReference: orderReference,
      customerEmail: email,
      customerName: email.split('@')[0],
      amount: amount,
      items: cartItems,
      paymentMethod: 'prepay_now',
      vendorPayouts: orderSplit.vendorPayouts,
    });

    console.log('📦 Prepayment order created in tracking system:', {
      orderReference: trackedOrder.orderReference,
      amount: trackedOrder.amount,
      vendorCount: orderSplit.vendorPayouts.length
    });

    /**
     * Prepare transaction data for Paystack initialization
     * Includes comprehensive metadata for order reconstruction if needed
     */
    const transactionData: any = {
      email,
      amount: amount * 100, // Convert to kobo (Paystack requirement)
      reference: orderReference, // Use our internal order reference for traceability
      callback_url: `${process.env.NEXTAUTH_URL}/payment-verification`,
      metadata: {
        orderReference: orderReference, // Critical for webhook order matching
        paymentMethod: 'prepay_now', // Explicit payment method identification
        cartItems: cartItems.map((item: any) => ({
          productId: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          vendor: item.product.vendor,
          vendorName: item.product.vendorName // Enhanced vendor information
        })),
        orderSplit: {
          totalAmount: orderSplit.totalAmount,
          platformRevenue: orderSplit.platformRevenue,
          totalPaystackFee: orderSplit.totalPaystackFee,
          vendorCount: orderSplit.vendorPayouts.length,
          hasMultipleVendors,
          vendorPayouts: orderSplit.vendorPayouts // Complete payout data for reconstruction
        }
      }
    };

    /**
     * Configure payment splitting for multi-vendor orders
     * Platform acts as fee bearer while ensuring fair vendor payouts
     */
    if (hasMultipleVendors) {
      const subaccounts = generateSubaccountsForSplit(orderSplit);
      
      transactionData.split = {
        type: 'flat',
        bearer_type: 'subaccount',
        bearer_subaccount: process.env.PAYSTACK_GRUNDY_SUBACCOUNT,
        subaccounts: subaccounts
      };

      // Log comprehensive split configuration for audit and debugging
      console.log('💰 Multi-vendor split payment configuration:', {
        totalOrderValue: orderSplit.totalAmount,
        platformRevenue: orderSplit.platformRevenue,
        totalProcessingFees: orderSplit.totalPaystackFee,
        participatingVendors: orderSplit.vendorPayouts.length,
        feeBearer: 'platform_subaccount',
        note: 'Vendors contribute proportionally to processing fees via platform collection'
      });

      // Detailed vendor payout breakdown for transparency
      console.log('📊 Vendor payout breakdown:');
      orderSplit.vendorPayouts.forEach(payout => {
        console.log(`   🏪 ${payout.vendorName}:`, {
          grossSales: `₦${payout.totalSales.toLocaleString()}`,
          platformFee: `₦${payout.platformFee.toLocaleString()}`,
          processingFeeShare: `₦${payout.paystackFeeShare.toLocaleString()}`,
          netPayout: `₦${payout.vendorPayout.toLocaleString()}`
        });
      });

    } else {
      /**
       * Single vendor configuration - vendor bears processing fees directly
       * More straightforward fee structure for single-vendor orders
       */
      const singleVendorConfig = getSingleVendorSubaccount(orderSplit);
      transactionData.subaccount = singleVendorConfig.subaccount;
      transactionData.transaction_charge = singleVendorConfig.transaction_charge;
      transactionData.bearer = 'subaccount';

      console.log('💰 Single vendor payment configuration:', {
        totalOrderValue: orderSplit.totalAmount,
        platformRevenue: orderSplit.platformRevenue,
        processingFees: orderSplit.totalPaystackFee,
        vendorSubaccount: singleVendorConfig.subaccount,
        feeStructure: 'vendor_bears_fees_directly',
        note: 'Vendor responsible for processing fees via direct transaction charge'
      });
    }

    /**
     * Initialize payment transaction with Paystack
     * This creates a payment session and returns authorization details
     */
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transactionData),
    });

    const paystackData = await paystackResponse.json();

    if (!paystackData.status) {
      console.error('❌ Paystack initialization failed:', paystackData);
      return NextResponse.json(
        { error: paystackData.message || 'Payment initialization failed' },
        { status: 400 }
      );
    }

    /**
     * Return successful initialization response
     * Includes both Paystack data and our internal order metadata
     */
    return NextResponse.json({
      ...paystackData,
      metadata: {
        orderSplit,
        hasMultipleVendors,
        orderReference,
        trackedOrderId: trackedOrder.id, // Internal tracking reference
        paymentConfig: hasMultipleVendors ? 'multi_vendor_split_payment' : 'single_vendor_direct_payment'
      }
    });

  } catch (error) {
    console.error('❌ Payment initialization error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}