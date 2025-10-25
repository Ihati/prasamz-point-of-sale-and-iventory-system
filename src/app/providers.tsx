
'use client';

import { UserProvider } from '@/hooks/use-user';
import { ProductProvider } from '@/hooks/use-products';
import { SalesProvider } from '@/hooks/use-sales';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <ProductProvider>
        <SalesProvider>
          {children}
          <FirebaseErrorListener />
        </SalesProvider>
      </ProductProvider>
    </UserProvider>
  );
}
