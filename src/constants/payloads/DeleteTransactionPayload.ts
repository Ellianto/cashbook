import { CategoryTypeValues, TransactionTypeValues } from "../interfaces";

export interface DeleteTransactionPayload {
  transaction_id : string
  transaction_date : string
  transaction_type: TransactionTypeValues;
  expense_type: CategoryTypeValues;
}