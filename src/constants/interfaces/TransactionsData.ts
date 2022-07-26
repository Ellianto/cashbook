import { TransactionItem } from "./TransactionItem";

export interface TransactionsData {
  date : string;
  total_credit: number;
  total_debit: number;
  transactions : TransactionItem[];
}