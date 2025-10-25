
import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { type FirebaseOptions } from 'firebase/app';

export const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

type FirebaseInstances = {
  app: FirebaseApp;
  db: Firestore;
  auth: Auth;
};

// Idempotent Firebase initialization
function initializeFirebase(): FirebaseInstances {
  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const db = getFirestore(app);
  const auth = getAuth(app);
  return { app, db, auth };
}

const { app: firebaseApp, db, auth } = initializeFirebase();

export { firebaseApp, db, auth, initializeFirebase };
