import React, { useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Product, UnitType, ProductStatus, ProductMaterial } from '../types';
import { Button, Card, Input, Modal, Select, ConfirmModal, Badge } from '../components/ui/Common';
import { Edit2, Trash2, Plus, X } from 'lucide-react';
import { formatCurrency } from '../utils';

export const Products: React.FC = () => {
  const { products, materials, addProduct, updateProduct, deleteProduct } = useData();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);

  const [formData, setFormData] = useState<{
    code: string;
    name: string;
    price: number;
    unit: string;
    status: ProductStatus;
    materials: ProductMaterial[];
  }>({
    code: '',
    name: '',
    price: 0,
    unit: UnitType.CAI,
    status: ProductStatus.ACTIVE,
    materials: []
  });

  const handleOpenModal = (p?: Product) => {
    if (p) {
      setEditingProduct(p);
      setFormData({
        code: p.code,
        name: p.name,
        price: p.price,
        unit: p.unit,
        status: p.status,
        materials: [...p.materials]
      });
    } else {
      setEditingProduct(null);
      setFormData({
        code: '',
        name: '',
        price: 0,
        unit: UnitType.CAI,
        status: ProductStatus.ACTIVE,
        materials: []
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name || formData.price < 0) return alert('Vui lòng nhập tên và giá hợp lệ.');
    
    const payload = { ...formData };
    
    if (editingProduct && editingProduct.id) {
      updateProduct(editingProduct.id, payload);
    } else {
      addProduct(payload);
    }
    setIsModalOpen(false);
  };

  // Recipe helpers
  const addMaterialToRecipe = () => {
    if (materials.length === 0) return alert('Chưa có vật liệu nào trong kho.');
    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, { materialId: materials[0].id, quantity: 1 }]
    }));
  };

  const removeMaterialFromRecipe = (index: number) => {
    const newMats = [...formData.materials];
    newMats.splice(index, 1);
    setFormData(prev => ({ ...prev, materials: newMats }));
  };

  const updateRecipeItem = (index: number, field: 'materialId' | 'quantity', value: any) => {
    const newMats = [...formData.materials];
    newMats[index] = { ...newMats[index], [field]: value };
    setFormData(prev => ({ ...prev, materials: newMats }));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Quản lý sản phẩm</h2>
        <Button onClick={() => handleOpenModal()}><Plus size={18} className="mr-2"/> Thêm sản phẩm</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {products.map(p => (
          <Card key={p.id} className="relative group">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h3 className="font-bold text-lg">{p.name}</h3>
                <span className="text-xs text-slate-500 bg-slate-100 px-2 py-0.5 rounded">{p.code}</span>
              </div>
              <Badge color={p.status === ProductStatus.ACTIVE ? 'green' : 'red'}>{p.status}</Badge>
            </div>
            
            <div className="text-emerald-600 font-bold text-xl mb-4">{formatCurrency(p.price)} <span className="text-sm font-normal text-slate-500">/ {p.unit}</span></div>
            
            <div className="text-sm text-slate-600 mb-2">
              <strong>Định mức vật liệu:</strong>
              {p.materials.length === 0 ? <p className="text-xs italic text-slate-400">Chưa cấu hình</p> : (
                <ul className="list-disc list-inside mt-1 text-xs">
                  {p.materials.map((m, i) => {
                     const matName = materials.find(mat => mat.id === m.materialId)?.name || 'Unknown';
                     const matUnit = materials.find(mat => mat.id === m.materialId)?.unit || '';
                     return <li key={i}>{matName}: {m.quantity} {matUnit}</li>
                  })}
                </ul>
              )}
            </div>

            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100">
              <Button size="sm" variant="secondary" onClick={() => handleOpenModal(p)}><Edit2 size={14} /></Button>
              <Button size="sm" variant="danger" onClick={() => setDeleteId(p.id)}><Trash2 size={14} /></Button>
            </div>
          </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingProduct ? "Sửa sản phẩm" : "Thêm sản phẩm"}>
        <div className="space-y-4">
          {/* REMOVED CODE AND STATUS INPUTS AS PER REQUEST */}
          {/* <Input label="Mã SP (Để trống tự sinh)" value={formData.code} onChange={e => setFormData({...formData, code: e.target.value})} placeholder="VD: AO001" /> */}
          
          <Input label="Tên sản phẩm" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
          
          <div className="grid grid-cols-2 gap-4">
            <Input label="Giá bán" type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} />
            <Select label="Đơn vị" options={Object.values(UnitType).map(v => ({ value: v, label: v }))} value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} />
          </div>
          
          {/* <Select label="Trạng thái" options={Object.values(ProductStatus).map(v => ({ value: v, label: v }))} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as ProductStatus})} /> */}
          
          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-bold">Vật liệu cấu thành (BOM)</label>
              <Button size="sm" variant="secondary" onClick={addMaterialToRecipe}><Plus size={14}/> Thêm vật liệu</Button>
            </div>
            {formData.materials.map((m, idx) => (
              <div key={idx} className="flex gap-2 items-end mb-2">
                <div className="flex-1">
                  <Select 
                    options={materials.map(mat => ({ value: mat.id, label: `${mat.name} (${mat.unit})` }))}
                    value={m.materialId}
                    onChange={e => updateRecipeItem(idx, 'materialId', e.target.value)}
                  />
                </div>
                <div className="w-24">
                  <Input type="number" step="0.1" value={m.quantity} onChange={e => updateRecipeItem(idx, 'quantity', Number(e.target.value))} />
                </div>
                <Button variant="danger" size="sm" onClick={() => removeMaterialFromRecipe(idx)}><X size={14}/></Button>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="secondary" onClick={() => setIsModalOpen(false)}>Hủy</Button>
            <Button onClick={handleSave}>Lưu sản phẩm</Button>
          </div>
        </div>
      </Modal>

      <ConfirmModal 
        isOpen={!!deleteId} 
        onClose={() => setDeleteId(null)} 
        onConfirm={() => deleteId && deleteProduct(deleteId)}
        title="Xóa sản phẩm?" 
        message="Hành động này không thể hoàn tác. Các đơn hàng cũ vẫn sẽ giữ tên sản phẩm này." 
      />
    </div>
  );
};