// ═══════════════════════════════════════════════════════
// Firebase Configuration — SpendSmart Daily Tracker
// Reuses the same Firebase project as GoalForge (goalforage)
// ═══════════════════════════════════════════════════════
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
    initializeAuth,
    getAuth,
    indexedDBLocalPersistence,
    browserLocalPersistence,
    browserPopupRedirectResolver,
} from 'firebase/auth';
import {
    initializeFirestore,
    persistentLocalCache,
    persistentMultipleTabManager,
    persistentSingleTabManager,
    getFirestore,
} from 'firebase/firestore';

// ── Config reads from .env.local (VITE_ prefix required by Vite) ──
const firebaseConfig = {
    apiKey:            import.meta.env.VITE_FIREBASE_API_KEY             ?? 'AIzaSyD59ewUm8tQYj4Vg_a-vPEmJ3Rd5khVwtY',
    authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN         ?? 'goalforage.firebaseapp.com',
    projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID          ?? 'goalforage',
    storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET      ?? 'goalforage.firebasestorage.app',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '47005570215',
    appId:             import.meta.env.VITE_FIREBASE_APP_ID              ?? '1:47005570215:web:43050232fd7075dee27782',
};

// Initialize Firebase App (guard against HMR double-init)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// ── Auth: IndexedDB persistence so session survives page reloads ──
let authInstance;
try {
    authInstance = initializeAuth(app, {
        persistence: [indexedDBLocalPersistence, browserLocalPersistence],
        popupRedirectResolver: browserPopupRedirectResolver,
    });
} catch {
    // Already initialized (Vite HMR) — get existing instance
    authInstance = getAuth(app);
}
export const auth = authInstance;

// ── Firestore: persistent cache ──
let dbInstance;
try {
    const isMobile = typeof window !== 'undefined' && (
        !!window.Capacitor ||
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    );
    dbInstance = initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: isMobile ? persistentSingleTabManager() : persistentMultipleTabManager(),
        }),
    });
} catch {
    try {
        dbInstance = getFirestore(app);
    } catch (fallbackErr) {
        console.error('[Firestore] Critical initialization failure:', fallbackErr);
        throw fallbackErr;
    }
}

export const db = dbInstance;
export default app;
