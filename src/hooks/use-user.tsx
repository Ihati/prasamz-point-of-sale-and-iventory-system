
'use client';

import * as React from 'react';
import type { User, Sale } from '@/lib/placeholder-data';
import { useRouter } from 'next/navigation';
import { initializeFirebase } from '@/firebase/config';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  type User as FirebaseUser,
  getIdTokenResult
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { useToast } from './use-toast';


type UserContextType = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  addSale: (newSale: Omit<Sale, 'id' | 'createdAt' | 'userId'>) => Promise<string | undefined>;
  sendPasswordReset: (email: string) => Promise<boolean>;
  isAdmin: boolean;
};

const UserContext = React.createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isAdmin, setIsAdmin] = React.useState(false);
  const router = useRouter();
  const { toast } = useToast();
  const { auth, db } = initializeFirebase();


  React.useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
      if (firebaseUser) {
        setLoading(true);
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        try {
          const userDoc = await getDoc(userDocRef).catch(error => {
             if (error.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                    path: userDocRef.path,
                    operation: 'get',
                });
                errorEmitter.emit('permission-error', permissionError);
            }
            throw error;
          });

          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<User, 'id'>;
            setUser({ id: firebaseUser.uid, ...userData } as User);
            setIsAdmin(userData.role === 'admin');
          } else {
            console.log("User document doesn't exist, creating one...");
            // Fallback for user creation if doc is missing
            const role = firebaseUser.email?.startsWith('admin') ? 'admin' : 'staff';
            const newUser: Omit<User, 'id'> = {
              name: role === 'admin' ? 'Admin User' : 'Staff User',
              email: firebaseUser.email!,
              role: role,
            };
            await setDoc(userDocRef, { ...newUser, createdAt: serverTimestamp() }).catch(error => {
              if (error.code === 'permission-denied') {
                  const permissionError = new FirestorePermissionError({
                      path: userDocRef.path,
                      operation: 'create',
                      requestResourceData: newUser,
                  });
                  errorEmitter.emit('permission-error', permissionError);
              }
              throw error;
            });
            setUser({ id: firebaseUser.uid, ...newUser } as User);
            setIsAdmin(newUser.role === 'admin');
          }
        } catch (error: any) {
          if (error.name !== 'FirestorePermissionError') {
             console.error('Error loading user:', error);
          }
          setUser(null);
        } finally {
          setLoading(false);
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [auth, db]);

  const login = async (email: string, password: string) => {
    try {
      // First, try to create the user. This will succeed for a first-time login.
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      const role = email.startsWith('admin') ? 'admin' : 'staff';
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      
      const newUser: Omit<User, 'id'> = {
        name: role === 'admin' ? 'Admin User' : 'Staff User',
        email: firebaseUser.email!,
        role: role,
      };
      
      // Create the user document in Firestore.
      await setDoc(userDocRef, { ...newUser, createdAt: serverTimestamp() });
      
      // After creation, the onAuthStateChanged listener will handle setting the user state and redirecting.
      toast({ title: 'Account Created', description: `Welcome! Your new ${role} account is ready.`});

    } catch (err: any) {
      // If user creation fails because the user already exists, sign them in instead.
      if (err.code === 'auth/email-already-in-use') {
        try {
          await signInWithEmailAndPassword(auth, email, password);
          // onAuthStateChanged will handle the redirect.
        } catch (signInError: any) {
           // Handle incorrect password on sign-in attempt.
           if (signInError.code === 'auth/invalid-credential' || signInError.code === 'auth/wrong-password') {
             toast({ title: 'Login Failed', description: 'Incorrect password. Please try again.', variant: 'destructive'});
           } else {
             console.error('Sign-in failed after create failed:', signInError);
             toast({ title: 'Login Failed', description: signInError.message || 'An unexpected error occurred.', variant: 'destructive'});
           }
        }
      } else if (err.code === 'auth/weak-password') {
          toast({ title: 'Sign-up Failed', description: 'Password is too weak. It should be at least 6 characters.', variant: 'destructive'});
      } else {
        // Handle other errors during creation.
        console.error('Login/Sign-up failed with an unexpected error:', err);
        toast({ title: 'An Error Occurred', description: err.message || 'An unexpected error occurred.', variant: 'destructive'});
      }
    }
  };

  const logout = async () => {
    await signOut(auth);
    setUser(null);
    setIsAdmin(false);
    router.push('/login');
  };

    const addSale = React.useCallback(
    async (
      newSaleData: Omit<Sale, 'id' | 'createdAt' | 'userId'>
    ): Promise<string | undefined> => {
      if (!db || !user) {
        toast({
          title: 'Not logged in',
          description: 'Cannot record sale. Please log in.',
          variant: 'destructive',
        });
        return undefined;
      }

      const saleWithTimestamp = {
        customerName: newSaleData.customerName,
        userId: user.id,
        createdAt: serverTimestamp(),
        items: newSaleData.items,
      };

      const salesCollectionRef = collection(db, 'sales');

      try {
        const docRef = await addDoc(salesCollectionRef, saleWithTimestamp)
          .catch(
            async (error) => {
              if (error.code === 'permission-denied') {
                const permissionError = new FirestorePermissionError({
                  path: 'sales',
                  operation: 'create',
                  requestResourceData: saleWithTimestamp,
                });
                errorEmitter.emit('permission-error', permissionError);
              }
              throw error;
            }
          );
        return docRef.id;
      } catch (error: any) {
        if (error.name !== 'FirestorePermissionError') {
          toast({
            title: 'Error adding sale',
            description: 'Could not save the sale.',
            variant: 'destructive',
          });
        }
        // No need to re-throw, error is emitted
      }
      return undefined;
    },
    [user, toast, db]
  );
  
  const sendPasswordReset = async (email: string): Promise<boolean> => {
    try {
      await sendPasswordResetEmail(auth, email);
      return true;
    } catch (error: any) {
      console.error("Error sending password reset email:", error);
      let description = "An unexpected error occurred. Please try again.";
      if (error.code === 'auth/user-not-found') {
        // Don't reveal if user exists, for security reasons. The success toast will handle this.
        return true;
      } else if (error.code === 'auth/invalid-email') {
        description = "The email address you entered is not valid.";
      }
       toast({ title: 'Password Reset Failed', description, variant: 'destructive' });
      return false;
    }
  };

  const value = React.useMemo(
    () => ({ user, loading, login, logout, addSale, sendPasswordReset, isAdmin }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user, loading, isAdmin, addSale]
  );

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = React.useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
