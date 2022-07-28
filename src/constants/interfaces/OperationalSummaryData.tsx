import { OperationalAggregateData } from './OperationalAggregateData';

export interface OperationalSummaryData {
  sumCredit: number;
  sumDebit: number;
  operationals: OperationalAggregateData[];
}
