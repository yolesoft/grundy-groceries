// src/data/vendors.ts

/**
 * Vendor Data Interface and Configuration
 * 
 * Defines the vendor data structure and provides sample vendor data
 * for the multi-vendor e-commerce platform. Each vendor includes
 * complete banking and Paystack integration details for seamless
 * split payments and automated payouts.
 */

export interface Vendor {
  id: string;
  name: string;
  email: string;
  bank_code: string;
  bank_account_number: string;
  bank_account_name: string;
  subaccount_code: string; // Paystack subaccount for split payments
  settlement_balance: number;
}

/**
 * Vendor Data Configuration
 * 
 * Sample vendor data representing various grocery suppliers in the platform.
 * Each vendor is configured with their unique Paystack subaccount for
 * automated split payments and payout calculations.
 * 
 * In production, this data would typically be stored in a database
 * and managed through a vendor onboarding system.
 */
export const vendors: Vendor[] = [
  {
    id: 'VENDOR_001',
    name: 'Fresh Farms',
    email: 'freshfarms@example.com',
    bank_code: '058', // GTBank
    bank_account_number: '0123456789',
    bank_account_name: 'Fresh Farms Ltd',
    subaccount_code: process.env.PAYSTACK_FRESH_FARMS_SUBACCOUNT || 'ACCT_xxx1',
    settlement_balance: 0
  },
  {
    id: 'VENDOR_002',
    name: 'Vegetable King',
    email: 'vegeking@example.com',
    bank_code: '058',
    bank_account_number: '0123456780',
    bank_account_name: 'Vegetable King Ltd',
    subaccount_code: process.env.PAYSTACK_VEGETABLE_KING_SUBACCOUNT || 'ACCT_xxx2',
    settlement_balance: 0
  },
  {
    id: 'VENDOR_003',
    name: 'Meat Masters',
    email: 'meatmasters@example.com',
    bank_code: '058',
    bank_account_number: '0123456781',
    bank_account_name: 'Meat Masters Ltd',
    subaccount_code: process.env.PAYSTACK_MEAT_MASTERS_SUBACCOUNT || 'ACCT_xxx3',
    settlement_balance: 0
  },
  {
    id: 'VENDOR_004',
    name: 'Dairy Delight',
    email: 'dairydelight@example.com',
    bank_code: '058',
    bank_account_number: '0123456782',
    bank_account_name: 'Dairy Delight Ltd',
    subaccount_code: process.env.PAYSTACK_DAIRY_DELIGHT_SUBACCOUNT || 'ACCT_xxx4',
    settlement_balance: 0
  },
  {
    id: 'VENDOR_005',
    name: 'Bakery Corner',
    email: 'bakerycorner@example.com',
    bank_code: '058',
    bank_account_number: '0123456783',
    bank_account_name: 'Bakery Corner Ltd',
    subaccount_code: process.env.PAYSTACK_BAKERY_CORNER_SUBACCOUNT || 'ACCT_xxx5',
    settlement_balance: 0
  },
  {
    id: 'VENDOR_006',
    name: 'Grains Galore',
    email: 'grainsgalore@example.com',
    bank_code: '058',
    bank_account_number: '0123456784',
    bank_account_name: 'Grains Galore Ltd',
    subaccount_code: process.env.PAYSTACK_GRAINS_GALORE_SUBACCOUNT || 'ACCT_xxx6',
    settlement_balance: 0
  }
];