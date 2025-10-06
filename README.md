# Grundy Groceries Platform

## Project Overview
**Grundy Groceries Platform** is a simulated **multi-vendor grocery ordering and payment system** built using **Next.js**, **Paystack APIs**, and **TypeScript**.  
It demonstrates how customers can purchase items from multiple vendors in a single order and pay through three different methods:
1. **Online Checkout**
2. **Bank Transfer on Delivery (Simulated)**
3. **Terminal on Delivery (Simulated)**

The project models real-world Paystack payment flows, transaction splits, vendor payouts, and webhook handling, within a controlled environment.

---

## Features Summary
- **Multi-Vendor Checkout**: Combine products from multiple vendors in one cart.  
- **Transaction Splits**: Automatically distribute payments between vendors and platform.  
- **Payment Methods**:
  - Paystack Online Checkout  
  - Bank Transfer on Delivery (simulated webhook)  
  - Terminal on Delivery (simulated terminal event)
- **Rider Workflow**: Riders manage deliveries and collect payment on-site.  
- **Vendor Dashboard**: Monitor orders and earnings.  
- **Order Tracking**: Track real-time payment and delivery status.  
- **Webhook Management**: Simulated and live webhook endpoints for Paystack events.

---

## System Architecture Overview
The platform follows a **monolithic Next.js architecture**, combining the frontend and backend in one codebase, but with clean separation of concerns .  
- **Frontend (Next.js App Router)**: Handles user experience and pages for customers, riders, and vendors.  
- **Backend (Next.js API Routes)**: Manages order lifecycle, payment verification, and simulated webhooks.  
- **Data Layer**: Static in-memory data (no database required).  
- **Payment Integration**:
  - Online checkout: `/api/payment/initialize`
  - Payment verification: `/api/payment/verify`
  - Simulated webhook: `/api/webhooks/paystack`
  - Manual webhook trigger for Bank Transfer & Terminal payments: `/api/orders/update-payment-status`

---

## Project Structure

### Frontend Pages (User-Facing)
```
src/app/
├── checkout/              # Checkout process
├── order-tracking/        # Order management dashboard  
├── payment-verification/  # Payment confirmation
├── rider/                 # Rider delivery app
├── vendor-dashboard/      # Vendor analytics
└── page.tsx               # Home page (product catalog)
```

### Backend API Routes
```
src/app/api/
├── orders/
│   ├── bank-transfer-delivery/  # Bank transfer orders
│   ├── terminal-delivery/       # Terminal delivery orders  
│   ├── update-payment-status/   # Status updates (used by simulated webhooks)
│   └── route.ts                 # Orders listing
├── payment/
│   ├── initialize/              # Payment initialization
│   └── verify/                  # Payment verification
├── rider/dispatch/              # Rider order assignment
├── terminal/collect-payment/    # Terminal payment collection trigger
├── vendors/orders/              # Vendor-specific orders
└── webhooks/paystack/           # Paystack webhook handler
```

### Supporting Architecture
```
src/
├── data/                 # Static data (products, vendors)
├── providers/            # React context (CartProvider)
├── services/             # Business logic
│   ├── orderTrackingService.ts
│   └── vendorPayoutService.ts
└── app/styles/           # Component-specific CSS modules
```

---

## Tech Stack
- **Frontend:** Next.js (App Router) + TypeScript + TailwindCSS  
- **Backend:** Next.js API Routes (Node.js)  
- **Payment Gateway:** Paystack API (Transactions, Split, Dedicated Accounts)  
- **Database:** Simulated in-memory data (no database for demo)  
- **Deployment:** Vercel (recommended)

---

## Environment Setup & Configuration

1. **Clone the Repository**
   ```bash
   git clone https://github.com/yourusername/grundy-groceries-platform.git
   cd grundy-groceries-platform
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Variables**
   Create a `.env.local` file in the root directory and add:
   ```bash
   PAYSTACK_SECRET_KEY=sk_test_xxxxxxxxxxxxx
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxx
   BASE_URL=http://localhost:3000
   ```

4. **Run Development Server**
   ```bash
   npm run dev
   ```

---

## API Overview

### `/api/payment/initialize`
Initializes Paystack transactions for online checkout and includes split parameters for vendor and platform shares.

### `/api/payment/verify`
Verifies completed Paystack transactions and updates order payment status.

### `/api/orders/update-payment-status`
Custom endpoint for simulating webhook updates (used in Bank Transfer and Terminal payment simulations).

---

## Testing & Demo Guide

### 1. Online Checkout (Paystack Live/Sandbox)
- Select “Online Checkout” as the payment method.  
- Proceed to Paystack-hosted checkout.  
- Upon success, Paystack redirects to `/payment-verification`, where the order status is confirmed using `/api/payment/verify`.

---

### 2. Bank Transfer on Delivery (Simulated Webhook)

Paystack’s **Dedicated Virtual Account (DVA)** feature is available only to live businesses, so this project uses a **simulation approach** to mimic Paystack’s webhook.

**How it works:**
- Customer chooses *Bank Transfer on Delivery*.
- When payment is made (simulated), the webhook event is manually triggered to mimic Paystack’s behavior.

Run the following code snippet in the browser console or via an HTTP client:

```js
fetch('/api/orders/update-payment-status', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    orderReference: 'ORDER_123456',
    status: 'paid',
    paymentData: {
      reference: 'ORDER_123456',
      amount: 500000,
      channel: 'bank_transfer',
      status: 'success',
      paid_at: new Date().toISOString()
    }
  })
}).then(r => r.json()).then(console.log);
```

Replace:
- `ORDER_123456` with the correct order reference.  
- `amount` with the actual amount (in kobo).

This call simulates a webhook notification that would normally be sent from Paystack’s server, allowing full end-to-end testing without live DVA access.

---

### 3. Terminal on Delivery (Simulated)

In a live Paystack Terminal integration:
1. The rider selects “Collect Payment” on their app.  
2. The platform backend sends a send event request to Paystack.  
3. Paystack pushes the transaction event to the assigned terminal.  
4. Once payment succeeds, Paystack sends a webhook (`charge.success`) to the merchant’s server.

**Since no physical terminal is available in this demo**, the process is simulated as follows:

- When the rider clicks **Collect Payment** on the app, it sends a request to a **custom webhook endpoint** on the platform.
- This endpoint internally triggers the `/api/orders/update-payment-status` route, marking the order as paid.
- The flow effectively mimics Paystack’s terminal webhook behavior.

Example simulated trigger:
```js
fetch('/api/orders/update-payment-status', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({
    orderReference: 'ORDER_789012',
    status: 'paid',
    paymentData: {
      reference: 'ORDER_789012',
      amount: 1000000,
      channel: 'terminal',
      status: 'success',
      paid_at: new Date().toISOString()
    }
  })
}).then(r => r.json()).then(console.log);
```

This allows end-to-end validation of the rider-triggered payment flow and webhook simulation.

---

## Debugging & Troubleshooting
- Ensure environment variables (`PAYSTACK_SECRET_KEY` and `PUBLIC_KEY`) are properly set.  
- Verify that your webhook simulation payloads use the correct order reference.  
- Use `console.log` in `/api/webhooks/paystack` to confirm Paystack event payloads are received.  
- When testing simulated flows, ensure your API routes are accessible from the client console.

---

## License
MIT License  
This project is for demonstration and educational purposes only.
