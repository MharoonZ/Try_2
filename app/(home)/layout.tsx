import ConditionalLayout from 'components/conditional-layout';
import { getCart } from 'lib/shopify';
import { ReactNode } from 'react';

export default async function HomeLayout({
  children
}: {
  children: ReactNode;
}) {
  const cart = getCart();

  return (
    <ConditionalLayout cartPromise={cart} showNavbar={false}>
      {children}
    </ConditionalLayout>
  );
}
