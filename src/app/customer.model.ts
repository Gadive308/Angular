export interface Customer {
  id: number;
  code: string;
  name: string;
  age: number;
  address: string;
}

export type CustomerPayload = Omit<Customer, 'id'>;

export interface CustomerPage {
  data: Customer[];
  total: number;
  pageIndex: number;
  pageSize: number;
}
