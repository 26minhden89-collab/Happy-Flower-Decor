import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  DataContextType, 
  Material, 
  Product, 
  Order, 
  Transaction, 
  OrderStatus, 
  TransactionType, 
  TransactionSource,
  UnitType,
  ProductStatus
} from '../types';
import { generateId } from '../utils';

const DataContext = createContext<DataContextType | undefined>(undefined);

// Initial Mock Data
const MOCK_MATERIALS: Material[] = [
  { id: 'm1', name: 'Vải Cotton', stock: 100, unit: UnitType.MET },
  { id: 'm2', name: 'Chỉ may', stock: 50, unit: UnitType.HOP },
];

const MOCK_PRODUCTS: Product[] = [
  { 
    id: 'p1', 
    code: 'AO01', 
    name: 'Áo thun trắng', 
    price: 150000, 
    unit: UnitType.CAI, 
    status: ProductStatus.ACTIVE,
    materials: [{ materialId: 'm1', quantity: 1.2 }, { materialId: 'm2', quantity: 0.1 }]
  }
];

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- STATE ---
  const [materials, setMaterials] = useState<Material[]>(() => {
    const saved = localStorage.getItem('materials');
    return saved ? JSON.parse(saved) : MOCK_MATERIALS;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('products');
    return saved ? JSON.parse(saved) : MOCK_PRODUCTS;
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    const saved = localStorage.getItem('orders');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : [];
  });

  // --- PERSISTENCE ---
  useEffect(() => localStorage.setItem('materials', JSON.stringify(materials)), [materials]);
  useEffect(() => localStorage.setItem('products', JSON.stringify(products)), [products]);
  useEffect(() => localStorage.setItem('orders', JSON.stringify(orders)), [orders]);
  useEffect(() => localStorage.setItem('transactions', JSON.stringify(transactions)), [transactions]);

  // --- LOGIC: MATERIALS ---

  const addMaterial = (m: Omit<Material, 'id'>) => {
    setMaterials(prev => [...prev, { ...m, id: generateId() }]);
  };

  const updateMaterial = (id: string, m: Partial<Material>) => {
    setMaterials(prev => prev.map(item => item.id === id ? { ...item, ...m } : item));
  };

  const deleteMaterial = (id: string) => {
    // Check if used in products
    const isUsed = products.some(p => p.materials.some(pm => pm.materialId === id));
    if (isUsed) {
      alert('Không thể xóa vật liệu này vì đang được sử dụng trong công thức sản phẩm.');
      return;
    }
    setMaterials(prev => prev.filter(item => item.id !== id));
  };

  const importMaterialStock = (id: string, qty: number, cost: number) => {
    // 1. Increase stock (Immutable update)
    setMaterials(prev => prev.map(m => m.id === id ? { ...m, stock: m.stock + qty } : m));
    
    // 2. Create Expense Transaction
    const mat = materials.find(m => m.id === id);
    addTransaction({
      date: new Date().toISOString(),
      type: TransactionType.EXPENSE,
      amount: cost,
      source: TransactionSource.IMPORT,
      note: `Nhập kho ${qty} ${mat?.unit} ${mat?.name}`
    });
  };

  // --- LOGIC: PRODUCTS ---

  const addProduct = (p: Omit<Product, 'id'>) => {
    const newProduct = { ...p, id: generateId() };
    if (!newProduct.code) newProduct.code = 'SP' + Math.floor(Math.random() * 10000);
    setProducts(prev => [...prev, newProduct]);
  };

  const updateProduct = (id: string, p: Partial<Product>) => {
    setProducts(prev => prev.map(item => item.id === id ? { ...item, ...p } : item));
  };

  const deleteProduct = (id: string) => {
    setProducts(prev => prev.filter(item => item.id !== id));
  };

  // --- LOGIC: ORDERS (THE CORE) ---

  const calculateStockDeductions = (items: any[]): Map<string, number> => {
    const stockDeductions: Map<string, number> = new Map();
    for (const item of items) {
      const product = products.find(p => p.id === item.productId);
      if (product) {
        product.materials.forEach(mat => {
          const required = mat.quantity * item.quantity;
          const current = stockDeductions.get(mat.materialId) || 0;
          stockDeductions.set(mat.materialId, current + required);
        });
      }
    }
    return stockDeductions;
  };

  const calculateStockRefunds = (items: any[]): Map<string, number> => {
      return calculateStockDeductions(items);
  };

  const addOrder = (o: Omit<Order, 'id' | 'totalAmount'>): boolean => {
    // 1. Calculate Total & Validate Stock
    let total = o.shippingFee;
    const stockDeductions = calculateStockDeductions(o.items);

    o.items.forEach(item => total += item.price * item.quantity);

    // 2. Check Valid Stock
    for (const [matId, reqQty] of stockDeductions.entries()) {
      const material = materials.find(m => m.id === matId);
      if (!material || material.stock < reqQty) {
        alert(`Không đủ tồn kho cho vật liệu: ${material?.name || matId}. Cần: ${reqQty}, Có: ${material?.stock || 0}`);
        return false;
      }
    }

    // 3. Deduct Stock (Immutable Update)
    setMaterials(prev => prev.map(m => {
      const qtyToDeduct = stockDeductions.get(m.id);
      if (qtyToDeduct) {
        return { ...m, stock: m.stock - qtyToDeduct };
      }
      return m;
    }));

    // 4. Create Order
    const newOrder: Order = {
      ...o,
      id: generateId(),
      code: o.code || ('DH' + Math.floor(Math.random() * 100000)),
      status: OrderStatus.NEW,
      totalAmount: total
    };
    setOrders(prev => [newOrder, ...prev]);
    return true;
  };

  const updateOrder = (id: string, updatedData: Omit<Order, 'id' | 'totalAmount' | 'status' | 'createdAt'>): boolean => {
    const oldOrder = orders.find(o => o.id === id);
    if (!oldOrder) return false;

    // 1. Calculate Nets
    const stockRefunds = calculateStockRefunds(oldOrder.items);
    const stockDeductions = calculateStockDeductions(updatedData.items);

    // 2. Check Validity
    for (const [matId, reqQty] of stockDeductions.entries()) {
        const material = materials.find(m => m.id === matId);
        if (!material) continue;
        
        const refundQty = stockRefunds.get(matId) || 0;
        const availableVirtual = material.stock + refundQty;

        if (availableVirtual < reqQty) {
            alert(`Không đủ tồn kho để cập nhật. Vật liệu: ${material.name}. Cần: ${reqQty}, Khả dụng: ${availableVirtual}`);
            return false;
        }
    }

    // 3. Apply Stock Changes (Immutable Update)
    setMaterials(prev => prev.map(m => {
        let newStock = m.stock;
        
        // Add back refunds
        const refund = stockRefunds.get(m.id);
        if (refund) newStock += refund;
        
        // Deduct new requirements
        const deduction = stockDeductions.get(m.id);
        if (deduction) newStock -= deduction;

        return { ...m, stock: newStock };
    }));

    // 4. Update Order Record
    let newTotal = updatedData.shippingFee;
    updatedData.items.forEach(item => newTotal += item.price * item.quantity);

    setOrders(prev => prev.map(o => o.id === id ? {
        ...o,
        ...updatedData,
        totalAmount: newTotal
    } : o));

    // 5. Update Related Transaction
    if (oldOrder.status === OrderStatus.DONE || oldOrder.status === OrderStatus.SHIPPED) {
        setTransactions(prev => prev.map(t => 
            (t.orderId === id && t.type === TransactionType.INCOME) 
            ? { ...t, amount: newTotal, note: `Thu tiền đơn hàng ${oldOrder.code} (Đã cập nhật)` }
            : t
        ));
    }

    return true;
  };

  const updateOrderStatus = (id: string, status: OrderStatus) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    const oldStatus = order.status;
    
    // Logic: Create Income if Shipped/Done
    if ((status === OrderStatus.SHIPPED || status === OrderStatus.DONE) && 
        (oldStatus !== OrderStatus.SHIPPED && oldStatus !== OrderStatus.DONE)) {
      
      const exists = transactions.some(t => t.orderId === id && t.type === TransactionType.INCOME);
      if (!exists) {
        addTransaction({
          date: new Date().toISOString(),
          type: TransactionType.INCOME,
          amount: order.totalAmount,
          source: TransactionSource.ORDER,
          orderId: id,
          note: `Thu tiền đơn hàng ${order.code}`
        });
      }
    }

    // Logic: Cancel Order -> Refund Stock
    if (status === OrderStatus.CANCELLED && oldStatus !== OrderStatus.CANCELLED) {
      refundStock(order);
      deleteTransactionByOrderId(id);
    }
    
    if (oldStatus === OrderStatus.CANCELLED) {
        alert("Không thể chuyển trạng thái đơn đã hủy. Vui lòng tạo đơn mới.");
        return; 
    }

    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
  };

  const deleteOrder = (id: string) => {
    const order = orders.find(o => o.id === id);
    if (!order) return;

    if (order.status !== OrderStatus.NEW && order.status !== OrderStatus.CANCELLED) {
      alert("Chỉ được xóa đơn hàng Mới tạo hoặc Đã hủy.");
      return;
    }

    if (order.status === OrderStatus.NEW) {
      refundStock(order);
    }

    deleteTransactionByOrderId(id);
    setOrders(prev => prev.filter(o => o.id !== id));
  };

  // Helper: Refund Stock (Immutable Update)
  const refundStock = (order: Order) => {
    const refunds = calculateStockRefunds(order.items);
    
    setMaterials(prev => prev.map(m => {
        const qtyToRefund = refunds.get(m.id);
        if (qtyToRefund) {
            return { ...m, stock: m.stock + qtyToRefund };
        }
        return m;
    }));
  };

  // --- LOGIC: TRANSACTIONS ---

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    setTransactions(prev => [{ ...t, id: generateId() }, ...prev]);
  };

  const deleteTransaction = (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
  };

  const deleteTransactionByOrderId = (orderId: string) => {
    setTransactions(prev => prev.filter(t => t.orderId !== orderId));
  };

  return (
    <DataContext.Provider value={{
      materials, products, orders, transactions,
      addMaterial, updateMaterial, deleteMaterial, importMaterialStock,
      addProduct, updateProduct, deleteProduct,
      addOrder, updateOrder, updateOrderStatus, deleteOrder,
      addTransaction, deleteTransaction
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within DataProvider");
  return context;
};