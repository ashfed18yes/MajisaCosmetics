import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import CartDrawer from '@/components/cart/CartDrawer';
import { CartProvider } from '@/context/CartContext';
import Toast from '@/components/ui/Toast';

export const metadata: Metadata = {
  title: 'Majisa Cosmetics | Luxury Botanical Formulations',
  description:
    'Experience clean luxury beauty, botanical lipsticks, cellular hydration skincare, and fine fragrances curated by Majisa Cosmetics.',
  keywords: [
    'cosmetics',
    'luxury beauty',
    'skincare',
    'lipstick',
    'face makeup',
    'Majisa Cosmetics',
    'clean beauty',
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,600&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-[#E7F0EF] text-[#102F32] min-h-screen flex flex-col font-sans selection:bg-[#DDF3F2] selection:text-[#0B4145]">
        <CartProvider>
          <Navbar />
          <main className="flex-1">{children}</main>
          <Footer />
          <CartDrawer />
          <Toast />
        </CartProvider>
      </body>
    </html>
  );
}
