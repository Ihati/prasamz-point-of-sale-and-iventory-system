
'use client';

import * as React from 'react';
import { Product } from '@/lib/placeholder-data';
import { useToast } from './use-toast';
import { initializeFirebase } from '@/firebase/config';
import { collection, onSnapshot, addDoc, doc, updateDoc, deleteDoc, runTransaction, serverTimestamp, writeBatch, query, orderBy, getDocs } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

type ProductContextType = {
  products: Product[];
  loading: boolean;
  addProduct: (newProduct: Omit<Product, 'id' | 'createdAt'>) => Promise<string | undefined>;
  updateProduct: (updatedProduct: Product) => Promise<void>;
  deleteProduct: (productId: string) => Promise<void>;
  deleteAllProducts: () => Promise<void>;
  updateProductQuantity: (productId: string, quantityChange: number) => Promise<void>;
  uploadProducts: (newProducts: Omit<Product, 'id' | 'createdAt'>[], onProgress: (progress: number) => void) => Promise<void>;
  searchTerm: string;
  setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
};

const ProductContext = React.createContext<ProductContextType | null>(null);

export function ProductProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = React.useState<Product[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { toast } = useToast();
  const { db } = initializeFirebase();


  React.useEffect(() => {
    if (!db) {
        setLoading(false);
        return;
    };

    setLoading(true);
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const productsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
        setProducts(productsData);
        setLoading(false);
    }, (error) => {
        if (error.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: 'products',
            operation: 'list',
          });
          errorEmitter.emit('permission-error', permissionError);
        } else {
          console.error("Error fetching products:", error);
          toast({ title: 'Error fetching products', description: 'Could not load product data.', variant: 'destructive' });
        }
        setLoading(false);
    });

    return () => unsubscribe();
  }, [toast, db]);


  const addProduct = async (newProduct: Omit<Product, 'id' | 'createdAt'>): Promise<string | undefined> => {
    if (!db) return undefined;
    const productWithTimestamp = { ...newProduct, createdAt: serverTimestamp() };
    
    try {
        const docRef = await addDoc(collection(db, "products"), productWithTimestamp)
          .catch(async (error) => {
            if (error.code === 'permission-denied') {
              const permissionError = new FirestorePermissionError({
                  path: 'products',
                  operation: 'create',
                  requestResourceData: productWithTimestamp,
              });
              errorEmitter.emit('permission-error', permissionError);
            }
            throw error;
          });
        return docRef.id;
    } catch (error: any) {
        if (error.name !== 'FirestorePermissionError') {
          toast({ title: 'Error adding product', description: 'Could not save the new product.', variant: 'destructive' });
        }
        // Do not re-throw, error is emitted
    }
    return undefined;
  };

  const updateProduct = async (updatedProduct: Product): Promise<void> => {
    if (!db) return;
    const { id, createdAt, ...productData } = updatedProduct; // Exclude createdAt from update
    const docRef = doc(db, "products", id);
    
    updateDoc(docRef, productData as any)
      .catch(async (error) => {
        if (error.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: productData,
          });
          errorEmitter.emit('permission-error', permissionError);
        } else {
          toast({ title: 'Error updating product', description: 'Could not save changes.', variant: 'destructive' });
        }
      });
  };

  const deleteProduct = async (productId: string) => {
    if (!db) return;
    const docRef = doc(db, "products", productId);
    deleteDoc(docRef)
      .catch(async (error) => {
        if (error.code === 'permission-denied') {
          const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'delete',
          });
          errorEmitter.emit('permission-error', permissionError);
        } else {
          toast({ title: 'Error deleting product', description: 'Could not remove the product.', variant: 'destructive' });
        }
      });
  };

  const deleteAllProducts = async () => {
    if (!db) return;
    const productsCollection = collection(db, 'products');
    try {
      const querySnapshot = await getDocs(productsCollection);
      const batch = writeBatch(db);
      querySnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
      await batch.commit()
        .catch(async (error) => {
          if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
              path: '/products',
              operation: 'delete',
              requestResourceData: {note: `Bulk delete of ${querySnapshot.size} items.`}
            });
            errorEmitter.emit('permission-error', permissionError);
          }
          throw error;
        });
    } catch (error: any) {
      if (error.name !== 'FirestorePermissionError') {
        toast({ title: 'Error Deleting All Products', description: 'Could not delete all products.', variant: 'destructive' });
      }
      // Do not re-throw, error is emitted
    }
  };


  const updateProductQuantity = async (productId: string, quantityChange: number) => {
    if (!db) return;
    const docRef = doc(db, "products", productId);
    
    runTransaction(db, async (transaction) => {
        const productDoc = await transaction.get(docRef);
        if (!productDoc.exists()) {
            throw new Error("Document does not exist!");
        }
        const newQuantity = (productDoc.data().quantity || 0) + quantityChange;
        const updatedData = { quantity: newQuantity < 0 ? 0 : newQuantity };
        transaction.update(docRef, updatedData);
    }).catch(async (error) => {
        if (String(error).includes('permission-denied') || (error && error.code === 'permission-denied')) {
          const permissionError = new FirestorePermissionError({
            path: docRef.path,
            operation: 'update',
            requestResourceData: { quantity: `(current stock) + ${quantityChange}` }
          });
          errorEmitter.emit('permission-error', permissionError);
        } else {
          toast({ title: 'Error updating quantity', description: 'Could not update product stock.', variant: 'destructive' });
        }
    });
  };

  const uploadProducts = async (newProducts: Omit<Product, 'id' | 'createdAt'>[], onProgress: (progress: number) => void) => {
    if (!db) {
      toast({ title: 'Database not connected', description: 'Cannot upload products.', variant: 'destructive' });
      return;
    };

    const batch = writeBatch(db);
    const productsWithTimestamps = newProducts.map(product => ({
      ...product,
      createdAt: serverTimestamp()
    }));
    
    productsWithTimestamps.forEach(product => {
      const docRef = doc(collection(db, "products"));
      batch.set(docRef, product);
    });

    try {
      await batch.commit()
        .catch(async (error) => {
          if (error.code === 'permission-denied') {
            const permissionError = new FirestorePermissionError({
              path: '/products',
              operation: 'create',
              requestResourceData: { note: `Bulk upload of ${newProducts.length} items.`, firstItem: productsWithTimestamps[0] }
            });
            errorEmitter.emit('permission-error', permissionError);
          }
          throw error;
        });
      onProgress(100);
    } catch (error: any) {
        if (error.name !== 'FirestorePermissionError') {
          toast({ title: 'Upload Failed', description: 'There was an error saving the products to the database.', variant: 'destructive' });
        }
        onProgress(0);
        // Do not re-throw, error is emitted
    }
  };

  const value = {
    products,
    loading,
    addProduct,
    updateProduct,
    deleteProduct,
    deleteAllProducts,
    updateProductQuantity,
    uploadProducts,
    searchTerm,
    setSearchTerm
  };

  return (
    <ProductContext.Provider value={value}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProducts() {
  const context = React.useContext(ProductContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
}
