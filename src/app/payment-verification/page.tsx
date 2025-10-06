// src/app/payment-verification/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import styles from '../styles/payment-verification.module.css';

interface TransactionData {
  amount: number;
  reference: string;
  status: string;
  paid_at: string;
  gateway_response: string;
  channel: string;
  currency: string;
}

/**
 * Payment Verification Component
 * 
 * Handles the post-payment verification process for Paystack transactions.
 * Verifies payment status and displays appropriate confirmation or error messages.
 * 
 * Features:
 * - Automatic payment verification on page load
 * - Real-time transaction status checking
 * - Comprehensive payment details display
 * - User-friendly success and error states
 * - Support for multiple payment channels (card, bank transfer, etc.)
 */
export default function PaymentVerification() {
  const searchParams = useSearchParams();
  const [verificationStatus, setVerificationStatus] = useState<'verifying' | 'success' | 'failed'>('verifying');
  const [transactionData, setTransactionData] = useState<TransactionData | null>(null);

  /**
   * Verifies payment status with Paystack API using transaction reference
   * Updates component state based on verification results
   */
  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference');
      
      if (reference) {
        try {
          console.log('🔄 Verifying payment with reference:', reference);
          
          const response = await fetch(`/api/payment/verify?reference=${reference}`);
          const data = await response.json();
          
          if (data.status && data.data.status === 'success') {
            console.log('✅ Payment verification successful:', data.data);
            setVerificationStatus('success');
            setTransactionData(data.data);
            
            // Update order status in tracking system
            await updateOrderStatus(reference, 'paid', data.data);
          } else {
            console.warn('❌ Payment verification failed:', data.message);
            setVerificationStatus('failed');
          }
        } catch (error) {
          console.error('🚨 Payment verification error:', error);
          setVerificationStatus('failed');
        }
      } else {
        console.warn('⚠️ No payment reference provided in URL');
        setVerificationStatus('failed');
      }
    };

    verifyPayment();
  }, [searchParams]);

  /**
   * Updates order status in the tracking system after successful payment verification
   * @param reference - Transaction reference from Paystack
   * @param status - New payment status ('paid')
   * @param paymentData - Complete transaction data from Paystack
   */
  const updateOrderStatus = async (reference: string, status: string, paymentData: any) => {
    try {
      const response = await fetch('/api/orders/update-payment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderReference: reference,
          status: status,
          paymentData: paymentData
        })
      });

      const data = await response.json();
      
      if (data.status) {
        console.log('📦 Order status updated successfully:', reference);
      } else {
        console.error('❌ Failed to update order status:', data.error);
      }
    } catch (error) {
      console.error('🚨 Error updating order status:', error);
    }
  };

  return (
    <div className={styles.container}>
      {/* Payment Verification In Progress */}
      {verificationStatus === 'verifying' && (
        <div className={styles.verifyingState}>
          <div className={styles.verifyingIcon}>🔄</div>
          <h2>Verifying Payment...</h2>
          <p>Please wait while we confirm your payment with our payment processor.</p>
          <p>This usually takes just a few seconds.</p>
        </div>
      )}
      
      {/* Payment Verification Successful */}
      {verificationStatus === 'success' && transactionData && (
        <div className={styles.successState}>
          <div className={styles.successIcon}>🎉</div>
          <div className={styles.statusBadge}>Payment Successful</div>
          <h2>Payment Successful!</h2>
          <p>Thank you for your payment. Your order has been confirmed.</p>
          
          <div className={styles.paymentDetails}>
            <p>
              <span className={styles.detailLabel}>Amount:</span>{' '}
              <span className={styles.amount}>₦{(transactionData.amount / 100).toLocaleString()}</span>
            </p>
            <p>
              <span className={styles.detailLabel}>Reference:</span>{' '}
              <span className={styles.reference}>{transactionData.reference}</span>
            </p>
            <p>
              <span className={styles.detailLabel}>Status:</span>{' '}
              <span className={styles.detailValue}>{transactionData.gateway_response}</span>
            </p>
            <p>
              <span className={styles.detailLabel}>Payment Method:</span>{' '}
              <span className={styles.detailValue}>
                {transactionData.channel ? transactionData.channel.replace(/_/g, ' ').toUpperCase() : 'Card'}
              </span>
            </p>
            <p>
              <span className={styles.detailLabel}>Date & Time:</span>{' '}
              <span className={styles.detailValue}>
                {new Date(transactionData.paid_at).toLocaleString()}
              </span>
            </p>
          </div>

          <div className={styles.actions}>
            <Link href="/order-tracking" className={styles.primaryButton}>
              View Your Orders
            </Link>
            <Link href="/" className={styles.secondaryButton}>
              Continue Shopping
            </Link>
          </div>
        </div>
      )}
      
      {/* Payment Verification Failed */}
      {verificationStatus === 'failed' && (
        <div className={styles.failedState}>
          <div className={styles.failedIcon}>❌</div>
          <h2>Payment Verification Failed</h2>
          <p>We couldn't verify your payment. This could be due to:</p>
          <ul style={{ textAlign: 'left', margin: '1rem 0', paddingLeft: '1.5rem', color: '#64748b' }}>
            <li>Payment processing delay</li>
            <li>Network connectivity issues</li>
            <li>Transaction cancellation</li>
            <li>Insufficient funds</li>
          </ul>
          <p>Please try again or contact our support team if the issue persists.</p>

          <div className={styles.actions}>
            <Link href="/checkout" className={styles.primaryButton}>
              Try Payment Again
            </Link>
            <Link href="/" className={styles.secondaryButton}>
              Return to Store
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}