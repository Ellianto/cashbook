import { ProductSummaryData } from './ProductSummaryData';
import { OperationalSummaryData } from './OperationalSummaryData';

export interface SummaryData {
  productsSummary: ProductSummaryData;
  opsSummary: OperationalSummaryData;
}
