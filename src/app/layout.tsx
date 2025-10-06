import { CartProvider } from '../providers/CartProvider';
import './globals.css';

export const metadata = {
  title: 'Grundy Groceries - Fresh Food Delivery',
  description: 'Your favorite grocery store with multiple vendors',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}