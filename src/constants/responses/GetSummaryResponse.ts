interface ProductSummary {
  name: string
  id: string
  total_debit: number
  total_credit: number
  total_qty_in : number
  total_qty_out : number
}

interface OperationalsSummary {
  name : string
  id: string
  total_debit : string
  total_credit : string
}

export interface GetSummaryResponse {
  total_credit : number;
  total_debit : number;
  product_categories: ProductSummary[];
  operational_categories: OperationalsSummary[];
}