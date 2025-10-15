export interface PaginatedCartResponse {
  data: {
    id: string;
    product: {
      id: string;
      name: string;
      image: string;
      price: number;
      subcategory: string;
      brand: string;
     /*  size: string; */
      volume: string;
      // dimension?: string; // Uncomment if dimension is needed
      isActive?: boolean;
    };
    quantity: number;
    subtotal: number;
  }[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  totalAmount: number;
}
