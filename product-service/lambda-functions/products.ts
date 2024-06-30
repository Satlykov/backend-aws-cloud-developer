import { v4 } from "uuid";

export interface IProduct {
  id: string;
  title: string;
  description: string;
  price: number;
  count: number;
}

export type ProductInfo = Omit<IProduct, "id">;

export const products: IProduct[] = [
  {
    id: v4(),
    title: "Product 1",
    description: "Product 1 description",
    price: 99.79,
    count: 20,
  },
  {
    id: v4(),
    title: "Product 2",
    description: "Product 2 description",
    price: 120.89,
    count: 1,
  },
  {
    id: v4(),
    title: "Product 3",
    description: "Product 3 description",
    price: 250.99,
    count: 3,
  },
  {
    id: v4(),
    title: "Product 4",
    description: "Product 4 description",
    price: 99.79,
    count: 11,
  },
  {
    id: v4(),
    title: "Product 5",
    description: "Product 5 description",
    price: 120.89,
    count: 7,
  },
  {
    id: v4(),
    title: "Product 6",
    description: "Product 6 description",
    price: 250.99,
    count: 9,
  },
];
