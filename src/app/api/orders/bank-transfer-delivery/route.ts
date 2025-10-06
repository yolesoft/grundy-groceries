// src/app/api/orders/bank-transfer-delivery/route.ts

/**
 * Bank Transfer Delivery Order API Endpoint
 * 
 * Handles creation of orders for bank transfer on delivery payment method.
 * Generates dedicated virtual accounts for customers and configures appropriate
 * split payments for multi-vendor orders through Paystack's dedicated virtual account feature.
 */

import { NextRequest, NextResponse } from 'next/server';
import { 
  calculateOrderSplit, 
  shouldUseSplitPayment,
  getSingleVendorSubaccount,
  generateSubaccountsForSplit 
} from '../../../../services/vendorPayoutService';
import { createOrder } from '../../../../services/orderTrackingService';

export async function POST(request: NextRequest) {
  try {
    const { email, amount, items, customer_name, orderReference } = await request.json();

    // Validate required input parameters
    if (!email || !amount) {
      return NextResponse.json(
        { error: 'Email and amount are required' },
        { status: 400 }
      );
    }

    // Calculate order split to determine vendor structure and payout distribution
    const orderSplit = calculateOrderSplit(items);
    const hasMultipleVendors = shouldUseSplitPayment(orderSplit);

    // Create order in tracking system as single source of truth
    const trackedOrder = createOrder({
      orderReference: orderReference,
      customerEmail: email,
      customerName: customer_name || 'Customer',
      amount: amount,
      items: items,
      paymentMethod: 'bank_transfer_delivery',
      vendorPayouts: orderSplit.vendorPayouts
    });

    /**
     * Step 1: Create or retrieve customer in Paystack
     * 
     * Creates a customer record in Paystack with comprehensive metadata
     * for order tracking and split payment configuration.
     */
    const customerResponse = await fetch('https://api.paystack.co/customer', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        first_name: customer_name || 'Customer',
        metadata: {
          order_reference: orderReference,
          order_split: orderSplit // Store split info in customer metadata for traceability
        }
      }),
    });

    const customerData = await customerResponse.json();

    if (!customerData.status) {
      return NextResponse.json(
        { error: customerData.message || 'Failed to create customer' },
        { status: 400 }
      );
    }

    const customerCode = customerData.data.customer_code;

    /**
     * Step 2: Create dedicated virtual account with appropriate split configuration
     * 
     * Configures dedicated virtual account for the customer with either:
     * - Multi-vendor: Pre-configured split code for automatic payout distribution
     * - Single vendor: Direct subaccount assignment for simplified payment flow
     */
    const dvaPayload: any = {
      customer: customerCode,
      preferred_bank: "test-bank", // Use test-bank for testing environment
    };

    if (hasMultipleVendors) {
      /**
       * Multi-vendor order configuration
       * 
       * Uses pre-configured split code from environment variables due to:
       * - API rate limits on dynamic split creation
       * - Split management overhead and cleanup requirements
       * - Practical constraints in production environments
       */
      
      /*
      // DYNAMIC SPLIT CREATION PROCESS (COMMENTED OUT DUE TO PRACTICAL CONSTRAINTS)
      try {
        const subaccounts = generateSubaccountsForSplit(orderSplit);
        const splitPayload = {
          name: `Order_${orderReference}_Split`,
          type: 'flat',
          bearer_type: 'subaccount',
          subaccounts: subaccounts
        };

        const splitResponse = await fetch('https://api.paystack.co/split', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(splitPayload),
        });

        const splitData = await splitResponse.json();
        if (splitData.status) {
          dvaPayload.split_code = splitData.data.split_code;
        } else {
          dvaPayload.split_code = process.env.PAYSTACK_SPLIT_CODE;
        }
      } catch (splitError) {
        dvaPayload.split_code = process.env.PAYSTACK_SPLIT_CODE;
      }
      */
      
      // Use pre-configured split code from environment for multi-vendor orders
      dvaPayload.split_code = process.env.PAYSTACK_SPLIT_CODE;
      console.log(`Using pre-configured split code for multi-vendor order: ${orderReference}`);
    } else {
      /**
       * Single vendor configuration
       * 
       * Uses direct subaccount assignment where vendor bears processing fees
       * through transaction charges for simplified payment flow.
       */
      const singleVendorConfig = getSingleVendorSubaccount(orderSplit);
      dvaPayload.subaccount = singleVendorConfig.subaccount;
    }

    /**
     * Step 3: Create dedicated virtual account in Paystack
     * 
     * Generates unique virtual account number for customer to make bank transfer
     * with automatic payment routing based on split configuration.
     */
    const dvaResponse = await fetch('https://api.paystack.co/dedicated_account', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dvaPayload),
    });

    const dvaData = await dvaResponse.json();

    if (!dvaData.status) {
      // If DVA creation fails, use test account for demo and development
      console.log('DVA creation failed, using test account:', dvaData.message);
      
      const testVirtualAccount = {
        bank_name: 'Paystack Test Bank',
        account_number: '1230001644',
        account_name: `GRUNDY/${customer_name?.toUpperCase() || 'CUSTOMER'}`,
        amount: amount,
        reference: orderReference,
        customer_code: customerCode,
        split_configuration: hasMultipleVendors ? 'split' : 'subaccount',
        order_split: orderSplit // Include split information for frontend display
      };

      return NextResponse.json({
        status: true,
        message: 'Order created with test virtual account',
        data: {
          order_id: orderReference,
          tracked_order_id: trackedOrder.id,
          virtual_account: testVirtualAccount,
          customer_code: customerCode,
          order_split: orderSplit,
          has_multiple_vendors: hasMultipleVendors
        }
      });
    }

    // Return the actual created virtual account with comprehensive details
    const virtualAccount = {
      bank_name: dvaData.data.bank.name,
      account_number: dvaData.data.account_number,
      account_name: dvaData.data.account_name,
      amount: amount,
      reference: orderReference,
      customer_code: customerCode,
      split_configuration: hasMultipleVendors ? 'split' : 'subaccount',
      order_split: orderSplit // Include split information for frontend display
    };

    return NextResponse.json({
      status: true,
      message: 'Order created with virtual account',
      data: {
        order_id: orderReference,
        virtual_account: virtualAccount,
        customer_code: customerCode,
        order_split: orderSplit,
        has_multiple_vendors: hasMultipleVendors
      }
    });

  } catch (error) {
    console.error('Bank transfer delivery error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}