export interface AuthInfo {
  token: string;
  userId: number;
  name: string;
  email: string;
  role: string;
  businessId: number;
  businessName: string;
}

export interface Product {
  id: number;
  name: string;
  sku?: string | null;
  barcode?: string | null;
  category?: string | null;
  unit?: string | null;
  purchasePrice: number;
  sellingPrice: number;
  stockQty: number;
  lowStockThreshold: number;
}

export interface Party {
  id: number;
  name: string;
  phone?: string | null;
  address?: string | null;
  balance: number;
}

export interface Line {
  productId: number;
  productName: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

export interface Payment {
  id: number;
  amount: number;
  method: string;
  paidAt: string;
}

export interface Sale {
  id: number;
  invoiceNo: string;
  customerId: number | null;
  customerName: string | null;
  saleDate: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paid: number;
  due: number;
  note?: string | null;
  items: Line[];
  payments: Payment[];
}

export interface Purchase {
  id: number;
  billNo: string;
  supplierId: number | null;
  supplierName: string | null;
  purchaseDate: string;
  total: number;
  paid: number;
  due: number;
  note?: string | null;
  items: Line[];
  payments: Payment[];
}

export interface Expense {
  id: number;
  title: string;
  category?: string | null;
  amount: number;
  expenseDate: string;
  note?: string | null;
}

export interface Summary {
  from: string;
  to: string;
  totalSales: number;
  previousSales: number;
  salesChangePct: number | null;
  totalPurchases: number;
  totalExpenses: number;
  costOfGoodsSold: number;
  grossProfit: number;
  netProfit: number;
}

export interface TrendPoint {
  date: string;
  total: number;
  count: number;
}

export interface Dashboard {
  summary: Summary;
  stockValue: number;
  totalUnits: number;
  receivable: number;
  payable: number;
  lowStock: { id: number; name: string; stockQty: number; lowStockThreshold: number }[];
  salesTrend: TrendPoint[];
}

export interface StockReport {
  totalValue: number;
  totalUnits: number;
  rows: { id: number; name: string; sku?: string | null; stockQty: number; purchasePrice: number; value: number }[];
}

export interface CategoryTotal {
  category: string;
  total: number;
}
