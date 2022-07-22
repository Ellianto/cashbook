import { CategoryTypeValues, TransactionTypeValues } from "../interfaces";

export interface TransactionPayload {
  transaction_date: string;
  transaction_type: TransactionTypeValues;
  amount: number;
  expense_type: CategoryTypeValues;
  expense_id: string;
  stock?: number; // Optional since this will only be there for PRODUCT transactions
}
