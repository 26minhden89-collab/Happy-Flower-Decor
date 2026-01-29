import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { TransactionType, TransactionSource } from '../types';
import { Button, Card, Input, Modal, Select, ConfirmModal, Badge } from '../components/ui/Common';
import { Trash2, Plus, TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatDateFull } from '../utils';

export const Finance: React.FC = () => {
  const { transactions, addTransaction, deleteTransaction } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    amount: 0,
    type: TransactionType.EXPENSE,
    source: TransactionSource.OTHER,
    note: ''
  });

  const handleSave = () => {
    if (formData.amount <= 0) return alert("Số tiền phải lớn hơn 0");
    addTransaction({
      ...formData,
      date: new Date().toISOString()
    });
    setIsModalOpen(false);
    setFormData({ amount: 0, type: TransactionType.EXPENSE, source: TransactionSource.OTHER, note: '' });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Quản lý Thu - Chi</h2>
        <Button onClick={() => setIsModalOpen(true)}><Plus size={18} className="mr-2"/> Tạo phiếu thu/chi</Button>
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4">Ngày</th>
              <th className="px-6 py-4">Loại</th>
              <th className="px-6 py-4">Nguồn</th>
              <th className="px-6 py-4 text-right">Số tiền</th>
              <th className="px-6 py-4">Ghi chú</th>
              <th className="px-6 py-4 text-right">Xóa</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {transactions.map(t => (
              <tr key={t.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 text-slate-500">{formatDateFull(t.date)}</td>
                <td className="px-6 py-3">
                    <span className={`inline-flex items-center gap-1 ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-red-600'}`}>
                        {t.type === TransactionType.INCOME ? <TrendingUp size={16}/> : <TrendingDown size={16}/>}
                        {t.type}
                    </span>
                </td>
                <td className="px-6 py-3">
                   <Badge color={t.source === TransactionSource.ORDER ? 'blue' : 'gray'}>{t.source}</Badge>
                </td>
                <td className={`px-6 py-3 text-right font-medium ${t.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-red-600'}`}>
                  {t.type === TransactionType.INCOME ? '+' : '-'}{formatCurrency(t.amount)}
                </td>
                <td className="px-6 py-3 text-slate-600 truncate max-w-xs" title={t.note}>{t.note || '-'}</td>
                <td className="px-6 py-3 text-right">
                  <button onClick={() => setDeleteId(t.id)} className="text-slate-400 hover:text-red-500 transition-colors">
                    <Trash2 size={16}/>
                  </button>
                </td>
              </tr>
            ))}
            {transactions.length === 0 && <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-500">Chưa có giao dịch</td></tr>}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Tạo phiếu Thu / Chi">
        <div className="space-y-4">
          <Select 
            label="Loại phiếu" 
            options={[{ value: TransactionType.EXPENSE, label: 'Chi tiền' }, { value: TransactionType.INCOME, label: 'Thu tiền' }]}
            value={formData.type}
            onChange={e => setFormData({...formData, type: e.target.value as TransactionType})}
          />
          <Select 
            label="Nguồn" 
            options={[{ value: TransactionSource.OTHER, label: 'Khác' }, { value: TransactionSource.IMPORT, label: 'Nhập hàng' }]}
            value={formData.source}
            onChange={e => setFormData({...formData, source: e.target.value as TransactionSource})}
          />
          <div>
            <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-slate-700">Số tiền</label>
                {formData.source === TransactionSource.IMPORT && (
                    <button 
                        className="text-sm text-blue-600 hover:underline"
                        onClick={() => setFormData(prev => ({...prev, note: prev.note + ' - Nhập vật liệu: '}))}
                    >
                        Thêm vật liệu nhập
                    </button>
                )}
            </div>
            <Input type="number" value={formData.amount} onChange={e => setFormData({...formData, amount: Number(e.target.value)})} />
          </div>
          
          <Input label="Ghi chú" value={formData.note} onChange={e => setFormData({...formData, note: e.target.value})} />
          
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button onClick={handleSave}>Lưu phiếu</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={() => deleteId && deleteTransaction(deleteId)}
        title="Xóa giao dịch?" 
        message="Xóa giao dịch này sẽ ảnh hưởng đến báo cáo tổng kết." 
      />
    </div>
  );
};