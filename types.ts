// Enum Definitions
export enum UnitType {
  CAI = 'Cái',
  MET = 'Mét',
  KG = 'Kg',
  BO = 'Bộ',
  CHAI = 'Chai',
  HOP = 'Hộp',
  LIT = 'Lít'
}

export enum ProductStatus {
  ACTIVE = 'Đang bán',
  INACTIVE = 'Ngừng bán'
}

export enum OrderStatus {
  NEW = 'Mới tạo',
  PROCESSING = 'Đang xử lý',
  SHIPPED = 'Đã giao',
  DONE = 'Đã hoàn thành',
  CANCELLED = 'Đã hủy'
}

export enum TransactionType {
  INCOME = 'Thu',
  EXPENSE = 'Chi'
}

export enum TransactionSource {
  ORDER = 'Đơn hàng',
  IMPORT = 'Nhập kho',
  OTHER = 'Khác'
}

// Interfaces
export interface Material {
  id: string;
  name: string;
  stock: number;
  unit: string;
}

export interface ProductMaterial {
  materialId: string;
  quantity: number; // Quantity required per 1 unit of product
}

export interface Product {
  id: string;
  code: string;
  name: string;
  price: number;
  unit: string;
  status: ProductStatus;
  materials: ProductMaterial[]; // Recipe/BOM
}

export interface OrderItem {
  productId: string;
  productName: string; // Cache name to avoid lookup issues if product deleted
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  code: string;
  createdAt: string; // ISO Date string
  customerName?: string;
  customerPhone?: string;
  shippingAddress?: string;
  shippingCarrier?: string;
  items: OrderItem[];
  shippingFee: number;
  note?: string;
  status: OrderStatus;
  totalAmount: number;
}

export interface Transaction {
  id: string;
  date: string; // ISO Date string
  type: TransactionType;
  amount: number;
  source: TransactionSource;
  orderId?: string; // Link to order if applicable
  note?: string;
}

// Context Type
export interface DataContextType {
  materials: Material[];
  products: Product[];
  orders: Order[];
  transactions: Transaction[];
  
  // Actions
  addMaterial: (m: Omit<Material, 'id'>) => void;
  updateMaterial: (id: string, m: Partial<Material>) => void;
  deleteMaterial: (id: string) => void;
  importMaterialStock: (id: string, qty: number, cost: number) => void;

  addProduct: (p: Omit<Product, 'id'>) => void;
  updateProduct: (id: string, p: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  addOrder: (o: Omit<Order, 'id' | 'totalAmount'>) => boolean; // Returns success/fail
  updateOrder: (id: string, o: Omit<Order, 'id' | 'totalAmount' | 'status' | 'createdAt'>) => boolean; // Returns success/fail
  updateOrderStatus: (id: string, status: OrderStatus) => void;
  deleteOrder: (id: string) => void;

  addTransaction: (t: Omit<Transaction, 'id'>) => void;
  deleteTransaction: (id: string) => void;
}