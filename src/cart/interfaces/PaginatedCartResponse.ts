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
      weight: string;
      length: string;
      width: string;
      height: string;
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
  totalWeight: number;
  totalLength: number;
  totalWidth: number;
  totalHeight: number;
}
