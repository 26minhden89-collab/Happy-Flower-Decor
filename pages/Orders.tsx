import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Order, OrderStatus, OrderItem } from '../types';
import { Button, Card, Input, Modal, Select, ConfirmModal, Badge } from '../components/ui/Common';
import { Eye, Trash2, Plus, X, Search, Edit2 } from 'lucide-react';
import { formatCurrency, formatDate } from '../utils';

export const Orders: React.FC = () => {
  const { orders, products, addOrder, updateOrder, updateOrderStatus, deleteOrder } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewOrder, setViewOrder] = useState<Order | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<{
    code: string;
    customerName: string;
    customerPhone: string;
    shippingAddress: string;
    shippingCarrier: string;
    note: string;
    shippingFee: number;
    items: OrderItem[];
  }>({
    code: '',
    customerName: '',
    customerPhone: '',
    shippingAddress: '',
    shippingCarrier: '',
    note: '',
    shippingFee: 0,
    items: []
  });

  const resetForm = () => {
    setFormData({ 
      code: '',
      customerName: '', 
      customerPhone: '', 
      shippingAddress: '',
      shippingCarrier: '',
      note: '', 
      shippingFee: 0, 
      items: [] 
    });
    setEditingId(null);
  };

  const handleCreateOrder = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    if (order.status === OrderStatus.CANCELLED) {
      alert("Không thể sửa đơn hàng đã hủy.");
      return;
    }
    setEditingId(order.id);
    setFormData({
      code: order.code,
      customerName: order.customerName || '',
      customerPhone: order.customerPhone || '',
      shippingAddress: order.shippingAddress || '',
      shippingCarrier: order.shippingCarrier || '',
      note: order.note || '',
      shippingFee: order.shippingFee,
      items: [...order.items] // Clone items array
    });
    setIsModalOpen(true);
  };

  const handleAddItem = () => {
    if (products.length === 0) return alert("Chưa có sản phẩm nào.");
    const p = products[0];
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { productId: p.id, productName: p.name, quantity: 1, price: p.price }]
    }));
  };

  const updateItem = (index: number, productId: string) => {
    const p = products.find(prod => prod.id === productId);
    if (!p) return;
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], productId: p.id, productName: p.name, price: p.price };
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const updateQuantity = (index: number, q: number) => {
    const newItems = [...formData.items];
    newItems[index].quantity = q;
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const removeItem = (index: number) => {
    const newItems = [...formData.items];
    newItems.splice(index, 1);
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleSubmit = () => {
    if (formData.items.length === 0) return alert("Đơn hàng phải có ít nhất 1 sản phẩm.");
    
    let success = false;

    if (editingId) {
        // Update existing order
        success = updateOrder(editingId, {
            code: formData.code,
            customerName: formData.customerName,
            customerPhone: formData.customerPhone,
            shippingAddress: formData.shippingAddress,
            shippingCarrier: formData.shippingCarrier,
            note: formData.note,
            shippingFee: formData.shippingFee,
            items: formData.items
        });
    } else {
        // Create new order
        success = addOrder({
            createdAt: new Date().toISOString(),
            code: formData.code,
            customerName: formData.customerName,
            customerPhone: formData.customerPhone,
            shippingAddress: formData.shippingAddress,
            shippingCarrier: formData.shippingCarrier,
            note: formData.note,
            shippingFee: formData.shippingFee,
            items: formData.items,
            status: OrderStatus.NEW,
        });
    }

    if (success) {
      setIsModalOpen(false);
      resetForm();
    }
  };

  const getStatusColor = (s: OrderStatus) => {
    switch (s) {
      case OrderStatus.NEW: return 'blue';
      case OrderStatus.PROCESSING: return 'yellow';
      case OrderStatus.SHIPPED: return 'green';
      case OrderStatus.DONE: return 'green';
      case OrderStatus.CANCELLED: return 'red';
      default: return 'gray';
    }
  };

  const filteredOrders = orders.filter(o => 
    o.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.customerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
        <h2 className="text-2xl font-bold text-slate-800">Danh sách đơn hàng</h2>
        <div className="flex gap-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 text-slate-400" size={18} />
            <input 
              className="pl-10 h-10 w-full rounded-md border border-slate-300 text-sm focus:ring-primary focus:border-primary" 
              placeholder="Tìm mã đơn, tên khách..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={handleCreateOrder}><Plus size={18} className="mr-2"/> Tạo đơn</Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-x-auto">
        <table className="w-full text-left text-sm whitespace-nowrap">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Mã đơn</th>
              <th className="px-6 py-4">Ngày tạo</th>
              <th className="px-6 py-4">Khách hàng</th>
              <th className="px-6 py-4">Tổng tiền</th>
              <th className="px-6 py-4">Trạng thái</th>
              <th className="px-6 py-4 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.map(o => {
              const canDelete = o.status === OrderStatus.NEW || o.status === OrderStatus.CANCELLED;
              return (
              <tr key={o.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-medium text-primary">{o.code}</td>
                <td className="px-6 py-3 text-slate-500">{formatDate(o.createdAt)}</td>
                <td className="px-6 py-3">
                  {o.customerName || '-'} 
                  {o.shippingCarrier && <span className="ml-1 px-1.5 py-0.5 rounded text-[10px] bg-indigo-50 text-indigo-600 border border-indigo-100">{o.shippingCarrier}</span>}
                  <br/><span className="text-xs text-slate-400">{o.customerPhone}</span>
                </td>
                <td className="px-6 py-3 font-medium">{formatCurrency(o.totalAmount)}</td>
                <td className="px-6 py-3"><Badge color={getStatusColor(o.status)}>{o.status}</Badge></td>
                <td className="px-6 py-3 text-right space-x-2">
                  <Button size="sm" variant="secondary" onClick={() => setViewOrder(o)} title="Xem chi tiết"><Eye size={14}/></Button>
                  
                  {o.status !== OrderStatus.CANCELLED && (
                      <Button size="sm" variant="secondary" onClick={() => handleEditOrder(o)} title="Sửa đơn hàng"><Edit2 size={14}/></Button>
                  )}

                  <Button 
                    size="sm" 
                    variant={canDelete ? "danger" : "secondary"} 
                    disabled={!canDelete}
                    className={!canDelete ? "opacity-40 cursor-not-allowed bg-slate-100 text-slate-400 hover:bg-slate-100" : ""}
                    onClick={() => canDelete && setDeleteId(o.id)} 
                    title={canDelete ? "Xóa đơn hàng" : "Chỉ xóa được đơn Mới hoặc Đã hủy"}
                  >
                    <Trash2 size={14}/>
                  </Button>
                </td>
              </tr>
            )})}
            {filteredOrders.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Không tìm thấy đơn hàng</td></tr>}
          </tbody>
        </table>
      </div>

      {/* CREATE/EDIT ORDER MODAL */}
      <div className={`fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm ${!isModalOpen && 'hidden'}`}>
      <div className="bg-white rounded-lg shadow-lg w-full max-w-5xl max-h-[95vh] overflow-y-auto border border-orange-100">
        <div className="flex justify-between items-center p-4 border-b border-orange-100">
            <h3 className="text-lg font-semibold text-slate-800">{editingId ? 'Chỉnh sửa đơn hàng' : 'Tạo đơn hàng mới'}</h3>
            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-primary transition-colors">&times;</button>
        </div>
        <div className="p-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Tên khách hàng" value={formData.customerName} onChange={e => setFormData({...formData, customerName: e.target.value})} />
            <Input label="Số điện thoại" value={formData.customerPhone} onChange={e => setFormData({...formData, customerPhone: e.target.value})} />
          </div>

          <Input label="Địa chỉ giao hàng" value={formData.shippingAddress} onChange={e => setFormData({...formData, shippingAddress: e.target.value})} placeholder="VD: 123 Đường ABC, Quận XYZ..." />

          <div className="grid grid-cols-2 gap-4">
             <Input label="Đơn vị giao hàng" value={formData.shippingCarrier} onChange={e => setFormData({...formData, shippingCarrier: e.target.value})} placeholder="VD: GHTK, Viettel Post..." />
             <Input label="Mã đơn hàng (Tùy chọn)" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="Mã tự sinh nếu để trống" />
          </div>
          
          <div className="border-t border-slate-100 pt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold text-slate-700">Sản phẩm</label>
              <Button size="sm" variant="secondary" onClick={handleAddItem}><Plus size={14}/> Thêm</Button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {formData.items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-center bg-slate-50 p-2 rounded border border-slate-200">
                  <div className="flex-1 min-w-[200px]"> 
                     <Select 
                       className="w-full"
                       options={products.map(p => ({ value: p.id, label: `${p.name} (${formatCurrency(p.price)})` }))}
                       value={item.productId}
                       onChange={e => updateItem(idx, e.target.value)}
                     />
                  </div>
                  <Input type="number" className="w-20" min="1" value={item.quantity} onChange={e => updateQuantity(idx, Number(e.target.value))} />
                  <div className="text-sm font-medium w-28 text-right text-slate-700">{formatCurrency(item.price * item.quantity)}</div>
                  <button onClick={() => removeItem(idx)} className="text-slate-400 hover:text-red-500 p-1 transition-colors"><X size={18}/></button>
                </div>
              ))}
              {formData.items.length === 0 && <p className="text-sm text-slate-400 italic text-center py-4">Chưa có sản phẩm nào.</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-100 pt-4">
            <Input label="Phí ship" type="number" value={formData.shippingFee} onChange={e => setFormData({...formData, shippingFee: Number(e.target.value)})} />
            <Input label="Ghi chú" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
          </div>
          
          <div className="flex justify-between items-center pt-2 font-bold text-lg text-slate-800">
             <span>Tổng cộng:</span>
             <span className="text-primary">{formatCurrency(formData.items.reduce((s, i) => s + i.price * i.quantity, 0) + formData.shippingFee)}</span>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button onClick={handleSubmit}>{editingId ? 'Cập nhật' : 'Tạo đơn & Trừ kho'}</Button>
          </div>
        </div>
      </div>
      </div>

      {/* VIEW/EDIT STATUS MODAL */}
      <Modal isOpen={!!viewOrder} onClose={() => setViewOrder(null)} title={`Chi tiết đơn: ${viewOrder?.code}`}>
        {viewOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><strong>Khách:</strong> {viewOrder.customerName} - {viewOrder.customerPhone}</div>
              <div><strong>Ngày:</strong> {formatDate(viewOrder.createdAt)}</div>
              {viewOrder.shippingAddress && <div className="col-span-2"><strong>Địa chỉ:</strong> {viewOrder.shippingAddress}</div>}
              {viewOrder.shippingCarrier && <div><strong>ĐVGH:</strong> {viewOrder.shippingCarrier}</div>}
              <div className="col-span-2"><strong>Ghi chú:</strong> {viewOrder.note || 'Không có'}</div>
            </div>
            
            <div className="border rounded p-2 bg-slate-50 text-sm">
              <table className="w-full">
                <thead>
                  <tr className="border-b"><th className="text-left pb-2">Sản phẩm</th><th className="text-center pb-2">SL</th><th className="text-right pb-2">Thành tiền</th></tr>
                </thead>
                <tbody>
                  {viewOrder.items.map((item, i) => (
                    <tr key={i}>
                      <td className="py-1">{item.productName}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right">{formatCurrency(item.price * item.quantity)}</td>
                    </tr>
                  ))}
                  <tr className="border-t">
                     <td colSpan={2} className="pt-2 font-medium">Phí ship</td>
                     <td className="text-right pt-2">{formatCurrency(viewOrder.shippingFee)}</td>
                  </tr>
                  <tr>
                     <td colSpan={2} className="pt-2 font-bold text-lg">Tổng cộng</td>
                     <td className="text-right pt-2 font-bold text-lg text-primary">{formatCurrency(viewOrder.totalAmount)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="pt-4 border-t">
              <label className="font-bold block mb-2">Cập nhật trạng thái</label>
              <div className="flex flex-wrap gap-2">
                {Object.values(OrderStatus).map(status => (
                  <button
                    key={status}
                    onClick={() => {
                        updateOrderStatus(viewOrder.id, status);
                        setViewOrder({...viewOrder, status}); // Update local view
                    }}
                    disabled={viewOrder.status === OrderStatus.CANCELLED && status !== OrderStatus.CANCELLED}
                    className={`px-3 py-1 rounded text-sm border ${viewOrder.status === status ? 'bg-primary text-white border-primary' : 'bg-white hover:bg-slate-50'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
              <p className="text-xs text-slate-500 mt-2">
                * Chuyển sang "Đã giao" hoặc "Đã hoàn thành" sẽ tự động tạo phiếu Thu.<br/>
                * Chuyển sang "Đã hủy" sẽ hoàn lại tồn kho.
              </p>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={() => deleteId && deleteOrder(deleteId)}
        title="Xóa đơn hàng?" 
        message="Vật liệu sẽ được hoàn trả lại kho. Các khoản thu liên quan sẽ bị xóa." 
      />
    </div>
  );
};