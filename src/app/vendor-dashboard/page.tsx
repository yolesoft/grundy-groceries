'use client';
import { useState, useEffect } from 'react';
import { vendors } from '../../data/vendors';
import { calculateOrderSplit } from '../../services/vendorPayoutService';

// Interface for vendor earnings data structure
interface VendorEarnings {
  totalEarnings: number;
  pendingEarnings: number;
  orderCount: number;
  paidOrders: number;
  deliveredOrders: number;
}

// Sample cart items for demonstration (only used if no real orders exist)
const sampleCartItems = [
  {
    product: {
      id: '1',
      name: 'Fresh Apples',
      price: 1200,
      vendor: 'VENDOR_001',
      vendorName: 'Fresh Farms',
      category: 'Fruits',
      description: 'Crisp and sweet red apples',
      inventory: 50,
      image: 'https://images.unsplash.com/photo-1568702846914-96b305d2aaeb?w=300&h=200&fit=crop' // Added image
    },
    quantity: 2
  },
  {
    product: {
      id: '2', 
      name: 'Carrots',
      price: 800,
      vendor: 'VENDOR_002',
      vendorName: 'Vegetable King', 
      category: 'Vegetables',
      description: 'Fresh organic carrots',
      inventory: 30,
      image: 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?w=300&h=200&fit=crop' // Added image
    },
    quantity: 3
  },
  {
    product: {
      id: '3',
      name: 'Chicken Breast',
      price: 2500,
      vendor: 'VENDOR_003',
      vendorName: 'Meat Masters',
      category: 'Meat & Poultry',
      description: 'Boneless chicken breast',
      inventory: 20,
      image: 'https://images.unsplash.com/photo-1604503468506-a8da13d82791?w=300&h=200&fit=crop' // Added image
    },
    quantity: 1
  }
];

export default function VendorDashboard() {
  const [selectedVendor, setSelectedVendor] = useState('');
  const [payoutCalculation, setPayoutCalculation] = useState<any>(null);
  const [vendorOrders, setVendorOrders] = useState<any[]>([]);
  const [vendorEarnings, setVendorEarnings] = useState<{[key: string]: VendorEarnings}>({});
  const [loading, setLoading] = useState(true);
  const [calculationSource, setCalculationSource] = useState<'live' | 'sample'>('sample');

  // Initialize component and fetch vendor data
  useEffect(() => {
    if (vendors.length > 0) {
      setSelectedVendor(vendors[0].id);
    }
    fetchVendorData();
    calculateSamplePayout(); // Start with sample data
  }, []);

  /**
   * Fetches vendor data including orders and earnings calculations
   * This function aggregates order data to calculate vendor performance metrics
   */
  const fetchVendorData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/orders');
      const data = await response.json();
      
      if (data.status) {
        const allOrders = data.data;
        const earnings: {[key: string]: VendorEarnings} = {};
        
        // Calculate earnings metrics for each vendor
        vendors.forEach(vendor => {
          // Filter orders that contain products from this vendor
          const vendorOrders = allOrders.filter((order: any) => 
            order.vendorPayouts?.some((payout: any) => payout.vendorId === vendor.id)
          );
          
          // Calculate total earnings from all orders
          const totalEarnings = vendorOrders.reduce((sum: number, order: any) => {
            const payout = order.vendorPayouts.find((p: any) => p.vendorId === vendor.id);
            return sum + (payout?.vendorPayout || 0);
          }, 0);
          
          // Calculate pending earnings from unpaid orders
          const pendingEarnings = vendorOrders
            .filter((order: any) => order.paymentStatus === 'pending')
            .reduce((sum: number, order: any) => {
              const payout = order.vendorPayouts.find((p: any) => p.vendorId === vendor.id);
              return sum + (payout?.vendorPayout || 0);
            }, 0);
          
          // Store comprehensive earnings data
          earnings[vendor.id] = {
            totalEarnings,
            pendingEarnings,
            orderCount: vendorOrders.length,
            paidOrders: vendorOrders.filter((o: any) => o.paymentStatus === 'paid').length,
            deliveredOrders: vendorOrders.filter((o: any) => o.paymentStatus === 'delivered').length
          };
        });
        
        setVendorEarnings(earnings);
        setVendorOrders(allOrders);

        // If we have real orders, calculate payout from the most recent one
        if (allOrders.length > 0) {
          calculateLivePayout(allOrders);
        }
      }
    } catch (error) {
      console.error('Failed to fetch vendor data:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Calculates payout using real order data from the system
   */
  const calculateLivePayout = (orders: any[]) => {
    try {
      // Use the most recent paid order for calculation
      const recentOrder = orders
        .filter(order => order.paymentStatus === 'paid')
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];

      if (recentOrder && recentOrder.items) {
        const calculation = calculateOrderSplit(recentOrder.items);
        setPayoutCalculation(calculation);
        setCalculationSource('live');
        console.log('💰 Live order payout calculation:', calculation);
      }
    } catch (error) {
      console.error('Error calculating live payout:', error);
      // Fall back to sample data
      calculateSamplePayout();
    }
  };

  /**
   * Calculates payout using sample data for demonstration
   */
  const calculateSamplePayout = () => {
    try {
      const calculation = calculateOrderSplit(sampleCartItems);
      setPayoutCalculation(calculation);
      setCalculationSource('sample');
      console.log('📊 Sample payout calculation:', calculation);
    } catch (error) {
      console.error('Error calculating sample payout:', error);
    }
  };

  const currentVendor = vendors.find(v => v.id === selectedVendor);
  const vendorPayout = payoutCalculation?.vendorPayouts?.find(
    (p: any) => p.vendorId === selectedVendor
  );

  // Show loading state during initial data fetch
  if (loading) {
    return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
        <h1>Vendor Management Dashboard</h1>
        <p>Loading vendor data...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <header style={{ marginBottom: '30px' }}>
        <h1>Vendor Management Dashboard</h1>
        <p style={{ color: '#666' }}>
          Comprehensive overview of vendor performance, earnings, and payout calculations
        </p>
        
        {/* Data Source Indicator */}
        <div style={{ 
          padding: '15px', 
          backgroundColor: calculationSource === 'live' ? '#e7f3ff' : '#fff3cd', 
          border: `1px solid ${calculationSource === 'live' ? '#007bff' : '#ffc107'}`,
          borderRadius: '8px',
          marginBottom: '20px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <strong>
                {calculationSource === 'live' ? '📊 Live Order Data' : '💡 Sample Calculation'}
              </strong>
              <p style={{ margin: '5px 0 0 0', fontSize: '14px' }}>
                {calculationSource === 'live' 
                  ? `Showing payout calculation from recent orders • ${vendorOrders.length} total orders in system`
                  : 'Demonstrating payout calculations with sample items'
                }
              </p>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={calculateSamplePayout}
                style={{
                  padding: '8px 16px',
                  backgroundColor: calculationSource === 'sample' ? '#007bff' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Show Sample
              </button>
              <button
                onClick={() => fetchVendorData()}
                style={{
                  padding: '8px 16px',
                  backgroundColor: calculationSource === 'live' ? '#007bff' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Use Live Data
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Vendor Performance Summary Section */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Vendor Performance Summary</h2>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
          gap: '20px',
          marginTop: '20px'
        }}>
          {vendors.map(vendor => {
            const earnings = vendorEarnings[vendor.id] || { 
              totalEarnings: 0, 
              pendingEarnings: 0, 
              orderCount: 0,
              paidOrders: 0,
              deliveredOrders: 0
            };
            
            // Calculate success rate for delivery performance
            const successRate = earnings.orderCount > 0 
              ? ((earnings.deliveredOrders / earnings.orderCount) * 100).toFixed(1) 
              : '0';
            
            return (
              <div 
                key={vendor.id} 
                style={{ 
                  border: '1px solid #ddd', 
                  borderRadius: '8px', 
                  padding: '20px',
                  backgroundColor: selectedVendor === vendor.id ? '#f0f8ff' : 'white',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  cursor: 'pointer'
                }}
                onClick={() => setSelectedVendor(vendor.id)}
              >
                <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>{vendor.name}</h3>
                
                <div style={{ display: 'grid', gap: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 'bold' }}>Total Earnings:</span>
                    <span style={{ color: '#28a745', fontWeight: 'bold' }}>
                      ₦{earnings.totalEarnings.toLocaleString()}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontWeight: 'bold' }}>Pending Payouts:</span>
                    <span style={{ color: '#ffc107', fontWeight: 'bold' }}>
                      ₦{earnings.pendingEarnings.toLocaleString()}
                    </span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Total Orders:</span>
                    <span>{earnings.orderCount}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Paid Orders:</span>
                    <span style={{ color: '#17a2b8' }}>{earnings.paidOrders}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>Delivered Orders:</span>
                    <span style={{ color: '#28a745' }}>{earnings.deliveredOrders}</span>
                  </div>
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px' }}>
                    <span>Success Rate:</span>
                    <span style={{ 
                      color: successRate === '100.0' ? '#28a745' : '#ffc107',
                      fontWeight: 'bold'
                    }}>
                      {successRate}%
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Vendor Details and Payout Calculation Section */}
      <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '40px' }}>
        
        {/* Vendor Information Panel */}
        <div>
          <h2>Vendor Information</h2>
          <select 
            value={selectedVendor}
            onChange={(e) => setSelectedVendor(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '12px', 
              marginBottom: '20px',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '16px'
            }}
          >
            {vendors.map(vendor => (
              <option key={vendor.id} value={vendor.id}>
                {vendor.name}
              </option>
            ))}
          </select>

          {currentVendor && (
            <div style={{ 
              border: '1px solid #007bff', 
              borderRadius: '8px', 
              padding: '20px',
              backgroundColor: '#f8f9fa'
            }}>
              <h3 style={{ color: '#007bff', marginBottom: '15px' }}>{currentVendor.name}</h3>
              
              <div style={{ display: 'grid', gap: '10px' }}>
                <div>
                  <strong>Contact Email:</strong>
                  <p style={{ margin: '5px 0' }}>{currentVendor.email}</p>
                </div>
                
                <div>
                  <strong>Bank Details:</strong>
                  <p style={{ margin: '5px 0' }}>
                    {currentVendor.bank_account_number} ({currentVendor.bank_code})
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '14px', color: '#666' }}>
                    {currentVendor.bank_account_name}
                  </p>
                </div>
                
                <div>
                  <strong>Settlement Balance:</strong>
                  <p style={{ 
                    margin: '5px 0', 
                    fontSize: '18px', 
                    fontWeight: 'bold',
                    color: '#28a745'
                  }}>
                    ₦{currentVendor.settlement_balance.toLocaleString()}
                  </p>
                </div>
                
                <div>
                  <strong>Paystack Subaccount:</strong>
                  <p style={{ 
                    margin: '5px 0', 
                    fontFamily: 'monospace',
                    fontSize: '14px',
                    backgroundColor: '#e9ecef',
                    padding: '5px',
                    borderRadius: '4px'
                  }}>
                    {currentVendor.subaccount_code}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payout Calculation Panel */}
        <div>
          <h2>Payout Calculation</h2>
          {payoutCalculation ? (
            <div style={{ 
              border: '1px solid #28a745', 
              borderRadius: '8px', 
              padding: '20px',
              backgroundColor: '#f8f9fa'
            }}>
              <h3 style={{ color: '#28a745', marginBottom: '15px' }}>
                {calculationSource === 'live' ? 'Live Order Breakdown' : 'Sample Calculation'}
              </h3>
              
              {/* Show current items being calculated */}
              <div style={{ marginBottom: '15px', padding: '10px', backgroundColor: '#e9ecef', borderRadius: '4px' }}>
                <strong>Items in Calculation:</strong>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', fontSize: '14px' }}>
                  {(calculationSource === 'live' ? payoutCalculation.vendorPayouts?.flatMap((p: any) => p.items) : sampleCartItems).map((item: any, index: number) => (
                    <li key={index}>
                      {item.quantity}x {item.product.name} - ₦{(item.product.price * item.quantity).toLocaleString()}
                      <span style={{ color: '#666', fontSize: '12px', marginLeft: '8px' }}>
                        ({item.product.vendorName})
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div style={{ marginBottom: '20px' }}>
                <h4>Order Summary</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <strong>Total Order Value:</strong>
                    <p>₦{payoutCalculation.totalAmount.toLocaleString()}</p>
                  </div>
                  <div>
                    <strong>Platform Revenue (10%):</strong>
                    <p>₦{payoutCalculation.platformRevenue.toLocaleString()}</p>
                  </div>
                  <div>
                    <strong>Total Paystack Fees:</strong>
                    <p>₦{payoutCalculation.totalPaystackFee.toLocaleString()}</p>
                  </div>
                  <div>
                    <strong>Number of Vendors:</strong>
                    <p>{payoutCalculation.vendorPayouts.length}</p>
                  </div>
                </div>
              </div>

              {vendorPayout && (
                <div style={{ 
                  backgroundColor: '#e7f3ff', 
                  padding: '15px', 
                  borderRadius: '4px',
                  border: '1px solid #007bff',
                  marginBottom: '15px'
                }}>
                  <h4 style={{ color: '#007bff', marginBottom: '10px' }}>
                    {currentVendor?.name} - Payout Details
                  </h4>
                  
                  <div style={{ display: 'grid', gap: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Total Sales:</span>
                      <span>₦{vendorPayout.totalSales.toLocaleString()}</span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Platform Fee (10%):</span>
                      <span style={{ color: '#dc3545' }}>-₦{vendorPayout.platformFee.toLocaleString()}</span>
                    </div>
                    
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Paystack Fee Share (1.5% + ₦100):</span>
                      <span style={{ color: '#dc3545' }}>-₦{vendorPayout.paystackFeeShare.toLocaleString()}</span>
                    </div>
                    
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between',
                      borderTop: '1px solid #007bff',
                      paddingTop: '8px',
                      marginTop: '8px'
                    }}>
                      <strong>Vendor Payout:</strong>
                      <span style={{ 
                        color: '#28a745', 
                        fontWeight: 'bold', 
                        fontSize: '18px'
                      }}>
                        ₦{vendorPayout.vendorPayout.toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  {vendorPayout.items.length > 0 && (
                    <div style={{ marginTop: '15px' }}>
                      <h5 style={{ marginBottom: '8px' }}>Items from this vendor:</h5>
                      <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '14px' }}>
                        {vendorPayout.items.map((item: any, index: number) => (
                          <li key={index} style={{ marginBottom: '4px' }}>
                            {item.quantity}x {item.product.name} - 
                            ₦{(item.product.price * item.quantity).toLocaleString()}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              <div style={{ marginTop: '20px' }}>
                <h4>All Vendor Payouts</h4>
                {payoutCalculation.vendorPayouts.map((payout: any) => (
                  <div 
                    key={payout.vendorId} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      padding: '10px',
                      borderBottom: '1px solid #eee',
                      backgroundColor: payout.vendorId === selectedVendor ? '#f0f8ff' : 'transparent'
                    }}
                  >
                    <span>{payout.vendorName}</span>
                    <span style={{ fontWeight: 'bold' }}>
                      ₦{payout.vendorPayout.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ 
              border: '2px dashed #ddd', 
              borderRadius: '8px', 
              padding: '40px', 
              textAlign: 'center',
              color: '#666'
            }}>
              <p>Loading payout calculations...</p>
            </div>
          )}
        </div>
      </section>

      {/* Vendor Performance Analytics Table */}
      <section style={{ marginTop: '40px' }}>
        <h2>Vendor Performance Analytics</h2>
        <div style={{ 
          overflowX: 'auto',
          border: '1px solid #ddd',
          borderRadius: '8px',
          marginTop: '20px'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', border: '1px solid #ddd', fontWeight: 'bold' }}>
                  Vendor
                </th>
                <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd', fontWeight: 'bold' }}>
                  Total Earnings
                </th>
                <th style={{ padding: '12px', textAlign: 'right', border: '1px solid #ddd', fontWeight: 'bold' }}>
                  Pending Payouts
                </th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd', fontWeight: 'bold' }}>
                  Total Orders
                </th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd', fontWeight: 'bold' }}>
                  Paid Orders
                </th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd', fontWeight: 'bold' }}>
                  Delivered Orders
                </th>
                <th style={{ padding: '12px', textAlign: 'center', border: '1px solid #ddd', fontWeight: 'bold' }}>
                  Success Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {vendors.map(vendor => {
                const earnings = vendorEarnings[vendor.id] || { 
                  totalEarnings: 0, 
                  pendingEarnings: 0, 
                  orderCount: 0,
                  paidOrders: 0,
                  deliveredOrders: 0
                };
                const successRate = earnings.orderCount > 0 
                  ? ((earnings.deliveredOrders / earnings.orderCount) * 100).toFixed(1) 
                  : '0';
                
                return (
                  <tr 
                    key={vendor.id}
                    style={{ 
                      backgroundColor: vendor.id === selectedVendor ? '#f0f8ff' : 'white',
                      cursor: 'pointer'
                    }}
                    onClick={() => setSelectedVendor(vendor.id)}
                  >
                    <td style={{ padding: '12px', border: '1px solid #ddd' }}>
                      <strong>{vendor.name}</strong>
                      <br />
                      <small style={{ color: '#666' }}>{vendor.email}</small>
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right', fontWeight: 'bold' }}>
                      ₦{earnings.totalEarnings.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'right', color: '#ffc107' }}>
                      ₦{earnings.pendingEarnings.toLocaleString()}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center' }}>
                      {earnings.orderCount}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', color: '#17a2b8' }}>
                      {earnings.paidOrders}
                    </td>
                    <td style={{ padding: '12px', border: '1px solid #ddd', textAlign: 'center', color: '#28a745' }}>
                      {earnings.deliveredOrders}
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      border: '1px solid #ddd', 
                      textAlign: 'center',
                      fontWeight: 'bold',
                      color: successRate === '100.0' ? '#28a745' : '#ffc107'
                    }}>
                      {successRate}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* Dashboard Footer */}
      <footer style={{ 
        marginTop: '40px', 
        padding: '20px', 
        backgroundColor: '#f8f9fa', 
        borderRadius: '8px',
        textAlign: 'center',
        border: '1px solid #ddd'
      }}>
        <p style={{ margin: 0, color: '#666' }}>
          <strong>Last Updated:</strong> {new Date().toLocaleString()} | 
          <strong> Total Vendors:</strong> {vendors.length} | 
          <strong> Active Orders:</strong> {vendorOrders.filter((o: any) => o.paymentStatus === 'pending').length}
        </p>
      </footer>
    </div>
  );
}