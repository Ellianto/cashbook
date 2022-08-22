import { initializeApp } from '@firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, connectAuthEmulator } from '@firebase/auth';
import { getFunctions, httpsCallable, connectFunctionsEmulator } from '@firebase/functions';   

import { config } from './constants'

// Initialize Firebase
export const firebaseApp = initializeApp(config.firebase);
export const firebaseAuth = getAuth(firebaseApp)
if (process.env.NODE_ENV !== 'production') {
  connectAuthEmulator(firebaseAuth, "http://localhost:9099", { disableWarnings : true });
}
setPersistence(firebaseAuth, browserLocalPersistence)

const functionsRegion = "asia-southeast2"
export const firebaseFunctions = getFunctions(firebaseApp, functionsRegion)
// 5001 is default for functions emulator
if (process.env.NODE_ENV !== 'production') {
  connectFunctionsEmulator(firebaseFunctions, 'localhost', 5001)
}

export const getProductsMethod  = httpsCallable(firebaseFunctions, 'getProducts')
export const getOperationalsMethod  = httpsCallable(firebaseFunctions, 'getOperationals')
export const getTransactionsListMethod = httpsCallable(firebaseFunctions, 'getTransactions')
export const addProductMethod  = httpsCallable(firebaseFunctions, 'addProduct')
export const addOperationalMethod  = httpsCallable(firebaseFunctions, 'addOperationals')
export const addTransactionMethod = httpsCallable(firebaseFunctions, 'addTransaction')
export const editProductMethod = httpsCallable(firebaseFunctions, 'editProduct')
export const editOperationalMethod = httpsCallable(firebaseFunctions, 'editOperationals')
export const editTransactionMethod = httpsCallable(firebaseFunctions, 'editTransaction')
export const deleteProductMethod = httpsCallable(firebaseFunctions, 'deleteProduct')
export const deleteOperationalMethod = httpsCallable(firebaseFunctions, 'deleteOperationals')
export const deleteTransactionMethod = httpsCallable(firebaseFunctions, 'deleteTransaction')
export const bulkDeleteTransactionMethod = httpsCallable(firebaseFunctions, 'bulkDeleteTransactionByDate')