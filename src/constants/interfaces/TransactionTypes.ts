import { TRANSACTION_TYPES } from "../constants";

export type TransactionTypeKeys = keyof typeof TRANSACTION_TYPES;
export type TransactionTypeValues = typeof TRANSACTION_TYPES[TransactionTypeKeys]