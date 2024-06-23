export interface IProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  count: number;
}

export type ProductInfo = Omit<IProduct, "id">;
