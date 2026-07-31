import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
    apiKey: "AIzaSyCnOdUw-Ly-Ym8j-qpva5p76HSbbQkeSqQ",
    authDomain: "chronos-app-d149d.firebaseapp.com",
    projectId: "chronos-app-d149d",
    storageBucket: "chronos-app-d149d.firebasestorage.app",
    messagingSenderId: "447713659250",
    appId: "1:447713659250:web:e5a8efa55e0e7445fc75eb",
    measurementId: "G-8N6QRRG3HG"
};

// Firebase初期化
const app = initializeApp(firebaseConfig);

import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';

// 各サービスの初期化とエクスポート
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
// 🔑 IndexedDBオフラインキャッシュを完全無効化し、100%直接Firebaseクラウドサーバーと通信させる
export const db = initializeFirestore(app, {
    localCache: memoryLocalCache()
});

// ブラウザ環境のみアナリティクスを動かす
export const analytics = typeof window !== 'undefined' ? getAnalytics(app) : null;
