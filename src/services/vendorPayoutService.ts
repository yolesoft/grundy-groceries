// src/services/vendorPayoutService.ts

/**
 * Vendor Payout Service
 * 
 * Handles complex multi-vendor payout calculations and Paystack split configurations.
 * Manages platform fees, Paystack transaction fees, and vendor payouts for both
 * single and multi-vendor orders.
 */

import { vendors } from '../data/vendors';
import { CartItem } from '../providers/CartProvider';

/**
 * Payout Calculation Interface
 * 
 * Represents the detailed breakdown of a vendor's payout for an order.
 * Includes sales, fees, and net payout amounts for accurate financial tracking.
 */
export interface PayoutCalculation {
  vendorId: string;
  vendorName: string;
  totalSales: number;
  platformFee: number; // 10% of vendor's sales
  paystackFeeShare: number; // Vendor's portion of the total Paystack fee
  vendorPayout: number; // totalSales - platformFee - paystackFeeShare
  items: CartItem[];
}

/**
 * Order Split Interface
 * 
 * Represents the complete financial breakdown of an order across multiple vendors.
 * Includes total amounts, platform revenue, and individual vendor payouts.
 */
export interface OrderSplit {
  totalAmount: number;
  platformRevenue: number; // Grundy's 10% of total
  totalPaystackFee: number; // Total Paystack fee for the entire transaction (1.5% + ₦100)
  vendorPayouts: PayoutCalculation[];
}

/**
 * Calculates order split and vendor payouts for multi-vendor orders
 * 
 * Processes cart items to determine vendor sales, platform fees, and Paystack fee distribution.
 * Handles both single and multi-vendor order scenarios with accurate financial calculations.
 * 
 * @param cartItems - Array of items in the shopping cart
 * @returns Complete order split with vendor payouts and fee calculations
 */
export function calculateOrderSplit(cartItems: CartItem[]): OrderSplit {
  const vendorSales: { [vendorId: string]: { items: CartItem[], total: number } } = {};

  // Group items by vendor and calculate sales totals
  cartItems.forEach(item => {
    const vendorId = item.product.vendor;
    if (!vendorSales[vendorId]) {
      vendorSales[vendorId] = { items: [], total: 0 };
    }
    vendorSales[vendorId].items.push(item);
    vendorSales[vendorId].total += item.product.price * item.quantity;
  });

  const vendorPayouts: PayoutCalculation[] = [];
  let totalPlatformRevenue = 0;

  // Calculate total order amount
  const totalAmount = cartItems.reduce((sum, item) => 
    sum + (item.product.price * item.quantity), 0
  );

  // Calculate total Paystack fee (1.5% of total + ₦100)
  const totalPaystackFee = (totalAmount * 0.015) + 100;

  // Calculate individual vendor payouts
  Object.entries(vendorSales).forEach(([vendorId, sales]) => {
    const vendor = vendors.find(v => v.id === vendorId);
    if (!vendor) return;

    const totalSales = sales.total;
    const platformFee = totalSales * 0.10; // 10% platform fee
    
    // Calculate vendor's share of Paystack fee based on sales percentage
    const vendorShareOfTotal = totalSales / totalAmount;
    const paystackFeeShare = vendorShareOfTotal * totalPaystackFee;
    
    const vendorPayout = totalSales - platformFee - paystackFeeShare;

    vendorPayouts.push({
      vendorId,
      vendorName: vendor.name,
      totalSales,
      platformFee,
      paystackFeeShare,
      vendorPayout,
      items: sales.items
    });

    totalPlatformRevenue += platformFee;
  });

  return {
    totalAmount,
    platformRevenue: totalPlatformRevenue,
    totalPaystackFee,
    vendorPayouts
  };
}

/**
 * Generates Paystack subaccounts configuration for split payments
 * 
 * Creates the subaccounts array required by Paystack for multi-vendor split payments.
 * Calculates vendor shares after deducting platform fees and Paystack fees.
 * 
 * FEE STRUCTURE:
 * - Paystack charges 1.5% + ₦100 on the TOTAL transaction amount
 * - Platform (Grundy) earns 10% of each vendor's sales as platform fee
 * - Vendors bear the Paystack fees proportionally to their sales share
 * 
 * LOGIC:
 * 1. Calculate total Paystack fee (1.5% of total + ₦100)
 * 2. Calculate each vendor's share of Paystack fee based on their sales percentage
 * 3. Platform receives: 10% platform fee + vendors' Paystack fee shares
 * 4. Vendors receive: Their sales minus 10% platform fee minus their Paystack fee share
 * 5. Use bearer_type: "subaccount" with platform's subaccount as bearer to collect all fees
 * 
 * @param orderSplit - The calculated order split with vendor payouts
 * @returns Array of subaccount configurations for Paystack split payment
 */
export function generateSubaccountsForSplit(orderSplit: OrderSplit) {
  const subaccounts = orderSplit.vendorPayouts.map(payout => {
    const vendor = vendors.find(v => v.id === payout.vendorId);
    if (!vendor) {
      throw new Error(`Vendor not found: ${payout.vendorId}`);
    }
    
    // Vendor receives: totalSales - platformFee - their share of Paystack fee
    const vendorShare = payout.vendorPayout;
    
    return {
      subaccount: vendor.subaccount_code,
      share: Math.round(vendorShare * 100) // Vendor share in kobo
    };
  });

  // Platform (Grundy) receives: 
  // - 10% platform fee from all vendors
  // - PLUS all vendors' Paystack fee shares (which will be used to pay the total Paystack fee)
  const platformTotalShare = orderSplit.platformRevenue + orderSplit.totalPaystackFee;
  
  subaccounts.push({
    subaccount: process.env.PAYSTACK_GRUNDY_SUBACCOUNT!,
    share: Math.round(platformTotalShare * 100) // Platform share in kobo
  });

  return subaccounts;
}

/**
 * Determines if split payment should be used for an order
 * 
 * Checks if an order contains items from multiple vendors, requiring
 * Paystack split payment configuration instead of single vendor subaccount.
 * 
 * @param orderSplit - The calculated order split with vendor payouts
 * @returns True if order has multiple vendors, false for single vendor
 */
export function shouldUseSplitPayment(orderSplit: OrderSplit): boolean {
  return orderSplit.vendorPayouts.length > 1;
}

/**
 * Gets single vendor subaccount configuration
 * 
 * For single vendor orders, the vendor bears their own Paystack fees directly
 * through transaction charges, simplifying the payment flow.
 * 
 * @param orderSplit - The calculated order split (must have exactly one vendor)
 * @returns Single vendor subaccount configuration with transaction charge
 * @throws Error if order split contains multiple vendors
 */
export function getSingleVendorSubaccount(orderSplit: OrderSplit): { 
  subaccount: string; 
  transaction_charge: number;
} {
  if (orderSplit.vendorPayouts.length !== 1) {
    throw new Error('Expected exactly one vendor for single subaccount payment');
  }
  
  const vendor = vendors.find(v => v.id === orderSplit.vendorPayouts[0].vendorId);
  if (!vendor) {
    throw new Error('Vendor not found');
  }
  
  // For single vendor: platform fee only, vendor bears Paystack fee separately
  return {
    subaccount: vendor.subaccount_code,
    transaction_charge: Math.round(orderSplit.platformRevenue * 100) // Platform fee in kobo
  };
}

/**
 * Processes vendor payouts via Paystack Transfer API
 * 
 * Initiates bank transfers to vendors for their calculated payouts.
 * Includes comprehensive error handling and logging for transfer operations.
 * 
 * @param payouts - Array of vendor payout calculations
 * @param orderReference - Unique order reference for tracking
 * @returns Array of payout results with success status and transfer details
 */
export async function processVendorPayouts(payouts: PayoutCalculation[], orderReference: string) {
  const payoutResults = [];

  for (const payout of payouts) {
    try {
      const vendor = vendors.find(v => v.id === payout.vendorId);
      if (!vendor) continue;

      // In production, you'd use Paystack Transfer API
      // For demo, we'll simulate the transfer
      const transferResponse = await fetch('https://api.paystack.co/transfer', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          source: 'balance',
          amount: Math.round(payout.vendorPayout * 100), // Convert to kobo
          recipient: vendor.bank_account_number, // In production, use recipient code
          reason: `Payout for order ${orderReference}`,
          reference: `PAYOUT_${orderReference}_${vendor.id}`
        }),
      });

      const transferData = await transferResponse.json();
      
      payoutResults.push({
        vendorId: payout.vendorId,
        vendorName: payout.vendorName,
        amount: payout.vendorPayout,
        success: transferData.status === true,
        transferReference: transferData.data?.reference,
        message: transferData.message
      });

      // Simulate processing delay
      await new Promise(resolve => setTimeout(resolve, 1000));

    } catch (error) {
      console.error(`Payout failed for vendor ${payout.vendorId}:`, error);
      payoutResults.push({
        vendorId: payout.vendorId,
        vendorName: payout.vendorName,
        amount: payout.vendorPayout,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  return payoutResults;
}