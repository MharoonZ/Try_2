import { CartProvider } from 'components/cart/cart-context';
import { Navbar } from 'components/layout/navbar';
import { WelcomeToast } from 'components/welcome-toast';
import { ReactNode } from 'react';
import { Toaster } from 'sonner';

interface ConditionalLayoutProps {
  children: ReactNode;
  cartPromise: Promise<any>;
  showNavbar: boolean;
}

export default function ConditionalLayout({ children, cartPromise, showNavbar }: ConditionalLayoutProps) {
  return (
    <CartProvider cartPromise={cartPromise}>
      {showNavbar && <Navbar />}
      <main>
        {children}
        <Toaster closeButton />
        <WelcomeToast />
      </main>
    </CartProvider>
  );
}
