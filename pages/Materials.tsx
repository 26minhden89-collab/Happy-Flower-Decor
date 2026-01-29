import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Material, UnitType } from '../types';
import { Button, Card, Input, Modal, Select, ConfirmModal } from '../components/ui/Common';
import { Edit2, Trash2, Plus, ArrowDownCircle } from 'lucide-react';

export const Materials: React.FC = () => {
  const { materials, addMaterial, updateMaterial, deleteMaterial, importMaterialStock } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [editingMaterial, setEditingMaterial] = useState<Partial<Material> | null>(null);
  const [importData, setImportData] = useState({ id: '', qty: 0, cost: 0 });

  const [formData, setFormData] = useState({
    name: '',
    stock: 0,
    unit: UnitType.CAI
  });

  const handleOpenModal = (m?: Material) => {
    if (m) {
      setEditingMaterial(m);
      setFormData({ name: m.name, stock: m.stock, unit: m.unit as UnitType });
    } else {
      setEditingMaterial(null);
      setFormData({ name: '', stock: 0, unit: UnitType.CAI });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name) return;
    if (editingMaterial && editingMaterial.id) {
      updateMaterial(editingMaterial.id, formData);
    } else {
      addMaterial(formData);
    }
    setIsModalOpen(false);
  };

  const handleOpenImport = (m: Material) => {
    setImportData({ id: m.id, qty: 0, cost: 0 });
    setIsImportModalOpen(true);
  };

  const handleImport = () => {
    if (importData.qty <= 0) return alert("Số lượng nhập phải > 0");
    importMaterialStock(importData.id, importData.qty, importData.cost);
    setIsImportModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Kho vật liệu</h2>
        <Button onClick={() => handleOpenModal()}><Plus size={18} className="mr-2"/> Thêm vật liệu</Button>
      </div>

      <div className="bg-white rounded-lg shadow border border-slate-200 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr>
              <th className="px-6 py-4 font-semibold text-slate-700">Tên vật liệu</th>
              <th className="px-6 py-4 font-semibold text-slate-700 text-center">Tồn kho</th>
              <th className="px-6 py-4 font-semibold text-slate-700">Đơn vị</th>
              <th className="px-6 py-4 font-semibold text-slate-700 text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {materials.map(m => (
              <tr key={m.id} className="hover:bg-slate-50">
                <td className="px-6 py-3 font-medium">{m.name}</td>
                <td className="px-6 py-3 text-center">
                  <span className={`font-bold ${m.stock < 10 ? 'text-red-500' : 'text-slate-800'}`}>
                    {Math.round(m.stock * 100) / 100}
                  </span>
                </td>
                <td className="px-6 py-3">{m.unit}</td>
                <td className="px-6 py-3 text-right space-x-2">
                  <Button size="sm" variant="success" onClick={() => handleOpenImport(m)} title="Nhập hàng"><ArrowDownCircle size={14}/></Button>
                  <Button size="sm" variant="secondary" onClick={() => handleOpenModal(m)}><Edit2 size={14}/></Button>
                  <Button size="sm" variant="danger" onClick={() => setDeleteId(m.id)}><Trash2 size={14}/></Button>
                </td>
              </tr>
            ))}
            {materials.length === 0 && <tr><td colSpan={4} className="px-6 py-8 text-center text-slate-500">Chưa có dữ liệu</td></tr>}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingMaterial ? "Sửa vật liệu" : "Thêm vật liệu"}>
        <div className="space-y-4">
          <Input label="Tên vật liệu" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          {/* Only allow setting initial stock when creating. Otherwise use Import. */}
          {!editingMaterial && <Input label="Tồn đầu kỳ" type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />}
          <Select label="Đơn vị tính" options={Object.values(UnitType).map(v => ({ value: v, label: v }))} value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button onClick={handleSave}>Lưu</Button>
          </div>
        </div>
      </Modal>

      {/* Import Modal */}
      <Modal isOpen={isImportModalOpen} onClose={() => setIsImportModalOpen(false)} title="Nhập kho">
         <div className="space-y-4">
          <p className="text-sm text-slate-600">Nhập thêm số lượng cho: <strong>{materials.find(m => m.id === importData.id)?.name}</strong></p>
          <Input label="Số lượng nhập thêm" type="number" value={importData.qty} onChange={e => setImportData({...importData, qty: Number(e.target.value)})} />
          <Input label="Tổng tiền nhập (Tạo phiếu chi)" type="number" value={importData.cost} onChange={e => setImportData({...importData, cost: Number(e.target.value)})} />
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsImportModalOpen(false)}>Hủy</Button>
            <Button onClick={handleImport} variant="success">Xác nhận nhập</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={() => deleteId && deleteMaterial(deleteId)}
        title="Xóa vật liệu?" 
        message="Không thể xóa nếu vật liệu đang được dùng trong sản phẩm." 
      />
    </div>
  );
};