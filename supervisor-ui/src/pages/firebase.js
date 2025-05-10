import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// ✅ Paste your Firebase config below
const firebaseConfig = {
  apiKey: "AIzaSyBbJGknLdqNR68IWMAbsxHdMXJYHlcklO0",
  authDomain: "humanloopagent.firebaseapp.com",
  projectId: "humanloopagent",
  storageBucket: "humanloopagent.firebasestorage.app",
  messagingSenderId: "777829589713",
  appId: "1:777829589713:web:6b013a7663e75489e1dbf0"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
