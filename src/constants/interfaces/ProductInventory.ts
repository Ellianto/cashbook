export interface ProductInventory {
  id: string;
  name: string;
  stock: number;
  total_cost? : number;
  total_gain? : number;
}