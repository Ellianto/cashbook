import { initializeApp } from '@firebase/app';
import { getAuth, setPersistence, browserSessionPersistence, connectAuthEmulator   } from '@firebase/auth';
import { getFunctions, httpsCallable, connectFunctionsEmulator  } from '@firebase/functions';   

import { config } from './constants'

// Initialize Firebase
export const firebaseApp = initializeApp(config.firebase);
export const firebaseAuth = getAuth(firebaseApp)
// connectAuthEmulator(firebaseAuth, "http://localhost:9099");
setPersistence(firebaseAuth, browserSessionPersistence)

export const firebaseFunctions = getFunctions(firebaseApp, 'asia-southeast2')
// 5001 is default for functions emulator
connectFunctionsEmulator(firebaseFunctions, 'localhost', 5001)

export const addProductMethod  = httpsCallable(firebaseFunctions, 'addProduct')