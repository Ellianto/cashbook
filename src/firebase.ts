import { initializeApp } from '@firebase/app';
import { getAuth, setPersistence, browserSessionPersistence } from '@firebase/auth';
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

export const getProductsMethod  = httpsCallable(firebaseFunctions, 'getProducts')
export const getOperationalsMethod  = httpsCallable(firebaseFunctions, 'getOperationals')
export const addProductMethod  = httpsCallable(firebaseFunctions, 'addProduct')
export const addOperationalMethod  = httpsCallable(firebaseFunctions, 'addOperationals')
export const editProductMethod = httpsCallable(firebaseFunctions, 'editProduct')
export const editOperationalMethod = httpsCallable(firebaseFunctions, 'editOperationals')
export const addTransactionMethod = httpsCallable(firebaseFunctions, 'addTransaction')
export const getTransactionsListMethod = httpsCallable(firebaseFunctions, 'getTransactions')
export const deleteTransactionMethod = httpsCallable(firebaseFunctions, 'deleteTransaction')
export const editTransactionMethod = httpsCallable(firebaseFunctions, 'editTransaction')

// export const deleteProductMethod = httpsCallable(firebaseFunctions, 'deleteProduct')
// export const deleteOperationalMethod = httpsCallable(firebaseFunctions, 'deleteOperational')