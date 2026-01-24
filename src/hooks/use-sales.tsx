
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
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { FirestorePermissionError } from '@/firebase/errors';
import { errorEmitter } from '@/firebase/error-emitter';

type SalesContextType = {
  sales: Sale[];
  loading: boolean;
  deleteSale: (saleId: string) => Promise<void>;
  backfillReceiptNumbers: () => Promise<void>;
};

const SalesContext = React.createContext<SalesContextType | null>(null);

export function SalesProvider({ children }: { children: React.ReactNode }) {
  const [sales, setSales] = React.useState<Sale[]>([]);
  const [loading, setLoading] = React.useState(true);
  const { toast } = useToast();
  const { db } = initializeFirebase();

  React.useEffect(() => {
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
  }, [toast, db]);

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

  const backfillReceiptNumbers = React.useCallback(async () => {
    if (!db) {
      toast({ title: 'Database not connected', variant: 'destructive' });
      return;
    }
    
    toast({ title: 'Starting renumbering...', description: 'Assigning consistent receipt numbers to all sales.' });

    const salesCollection = collection(db, 'sales');
    const q = query(salesCollection, orderBy('createdAt', 'asc'));

    try {
        const querySnapshot = await getDocs(q);
        const batch = writeBatch(db);
        
        querySnapshot.docs.forEach((document, index) => {
            const receiptNumber = (index + 1).toString().padStart(3, '0');
            batch.update(document.ref, { receiptNumber: receiptNumber });
        });

        await batch.commit().catch(async (error) => {
            if (error.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: '/sales',
                    operation: 'update',
                    requestResourceData: { note: `Bulk update of ${querySnapshot.size} items.` }
                });
                errorEmitter.emit('permission-error', permissionError);
            }
            throw error;
        });

        toast({ title: 'Renumbering Complete', description: `${querySnapshot.size} sales have been updated.` });
    } catch (error: any) {
        if (error.name !== 'FirestorePermissionError') {
            toast({ title: 'Renumbering Failed', description: 'Could not update past sales records.', variant: 'destructive' });
        }
    }
  }, [db, toast]);


  const value = React.useMemo(
    () => ({
      sales,
      loading,
      deleteSale,
      backfillReceiptNumbers,
    }),
    [sales, loading, deleteSale, backfillReceiptNumbers]
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
