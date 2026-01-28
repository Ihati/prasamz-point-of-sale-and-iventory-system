
'use client';

import * as React from 'react';
import { Sale } from '@/lib/placeholder-data';
import { useToast } from './use-toast';
import { initializeFirebase } from '@/firebase/config';
import {
  collection,
  onSnapshot,
  query,
  orderBy,
  doc,
  deleteDoc,
} from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';
import { useUser } from './use-user';

type SalesContextType = {
  sales: Sale[];
  loading: boolean;
  deleteSale: (saleId: string) => Promise<void>;
};

const SalesContext = React.createContext<SalesContextType | null>(null);

export function SalesProvider({ children }: { children: React.ReactNode }) {
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();
  const { db } = initializeFirebase();
  const { user, loading: userLoading } = useUser();

  React.useEffect(() => {
    if (userLoading) {
      setLoading(true);
      return;
    }

    if (!user) {
      setSales([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(collection(db, 'sales'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const salesData = querySnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as Sale)
        );
        setSales(salesData);
        setLoading(false);
      },
      (error) => {
        if (error.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: 'sales',
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
        } else {
          console.error('Error fetching sales: ', error);
          toast({
            title: 'Error Fetching Sales',
            description:
              'Could not load sales history. Please check your connection or permissions.',
            variant: 'destructive',
          });
        }
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast, db, user, userLoading]);

  const deleteSale = React.useCallback(
    async (saleId: string) => {
      if (!db) return;
      const docRef = doc(db, 'sales', saleId);
      deleteDoc(docRef).catch(async (error) => {
        if (error.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
          });
          errorEmitter.emit('permission-error', permissionError);
        } else {
          toast({
            title: 'Error deleting sale',
            description: 'Could not remove the sale record.',
            variant: 'destructive',
          });
        }
      });
    },
    [db, toast]
  );

  const value = React.useMemo(
    () => ({
      sales,
      loading,
      deleteSale,
    }),
    [sales, loading, deleteSale]
  );

  return (
    <SalesContext.Provider value={value}>{children}</SalesContext.Provider>
  );
}

export function useSales() {
  const context = React.useContext(SalesContext);
  if (!context) {
    throw new Error('useSales must be used within a SalesProvider');
  }
  return context;
}
