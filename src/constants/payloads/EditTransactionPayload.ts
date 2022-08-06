import { CategoryTypeValues, TransactionTypeValues } from "../interfaces";

export interface EditTransactionPayload {
  transaction_id : string
  transaction_date : string
  transaction_type: TransactionTypeValues;
  expense_type: CategoryTypeValues;
  amount: number;
  qty?: number;
}