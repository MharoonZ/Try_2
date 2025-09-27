'use client';

import { CartProvider } from 'components/cart/cart-context';
import { Navbar } from 'components/layout/navbar';
import { WelcomeToast } from 'components/welcome-toast';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { Toaster } from 'sonner';

interface ConditionalLayoutProps {
  children: ReactNode;
  cartPromise: Promise<any>;
}

export default function ConditionalLayout({ children, cartPromise }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isHomepage = pathname === '/';

  return (
    <CartProvider cartPromise={cartPromise}>
      {!isHomepage && <Navbar />}
      <main>
        {children}
        <Toaster closeButton />
        <WelcomeToast />
      </main>
    </CartProvider>
  );
}
