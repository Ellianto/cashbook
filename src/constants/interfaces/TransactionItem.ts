import { CategoryTypeValues } from "./CategoryTypes";
import { TransactionTypeValues } from "./TransactionTypes";

export interface TransactionItem {
  transaction_id: string
  transaction_type : TransactionTypeValues
  category_type : CategoryTypeValues
  category_id : string
  amount: number
  qty?: number
}