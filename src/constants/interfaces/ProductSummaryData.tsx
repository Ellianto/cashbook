import { ProductAggregateData } from './ProductAggregateData';

export interface ProductSummaryData {
  sumCredit: number;
  sumDebit: number;
  sumQtyIn: number;
  sumQtyOut: number;
  products: ProductAggregateData[];
}
