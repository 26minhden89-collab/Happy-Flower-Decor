import React, { useMemo, useState } from 'react';
import { useData } from '../contexts/DataContext';
import { Card } from '../components/ui/Common';
import { formatCurrency } from '../utils';
import { TransactionType } from '../types';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export const Dashboard: React.FC = () => {
  const { transactions, orders, materials } = useData();
  const [filterDays, setFilterDays] = useState(30);

  // Stats Logic
  const stats = useMemo(() => {
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - filterDays);

    const filteredTx = transactions.filter(t => new Date(t.date) >= startDate);
    
    const income = filteredTx
      .filter(t => t.type === TransactionType.INCOME)
      .reduce((sum, t) => sum + t.amount, 0);
      
    const expense = filteredTx
      .filter(t => t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.amount, 0);

    const profit = income - expense;

    const lowStockCount = materials.filter(m => m.stock < 10).length;
    const pendingOrders = orders.filter(o => o.status === 'Mới tạo' || o.status === 'Đang xử lý').length;

    return { income, expense, profit, lowStockCount, pendingOrders };
  }, [transactions, materials, orders, filterDays]);

  // Chart Data
  const chartData = useMemo(() => {
    // Group transactions by day
    const dataMap = new Map<string, { date: string; income: number; expense: number }>();
    
    const startDate = new Date();
    startDate.setDate(new Date().getDate() - filterDays);

    transactions.forEach(t => {
      const d = new Date(t.date);
      if (d < startDate) return;
      const key = d.toLocaleDateString('vi-VN');
      if (!dataMap.has(key)) dataMap.set(key, { date: key, income: 0, expense: 0 });
      
      const entry = dataMap.get(key)!;
      if (t.type === TransactionType.INCOME) entry.income += t.amount;
      else entry.expense += t.amount;
    });

    return Array.from(dataMap.values()).reverse().slice(0, 7).reverse(); // Last 7 active days
  }, [transactions, filterDays]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-slate-800">Tổng quan kinh doanh</h2>
        <select 
          className="bg-white border border-slate-300 rounded-md px-3 py-1 text-sm"
          value={filterDays}
          onChange={(e) => setFilterDays(Number(e.target.value))}
        >
          <option value={7}>7 ngày qua</option>
          <option value={30}>30 ngày qua</option>
          <option value={90}>3 tháng qua</option>
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-emerald-50 border-emerald-100">
          <div className="text-sm text-emerald-600 font-medium">Doanh thu</div>
          <div className="text-2xl font-bold text-emerald-700 mt-1">{formatCurrency(stats.income)}</div>
        </Card>
        <Card className="bg-red-50 border-red-100">
          <div className="text-sm text-red-600 font-medium">Chi phí</div>
          <div className="text-2xl font-bold text-red-700 mt-1">{formatCurrency(stats.expense)}</div>
        </Card>
        <Card className="bg-blue-50 border-blue-100">
          <div className="text-sm text-blue-600 font-medium">Lợi nhuận</div>
          <div className="text-2xl font-bold text-blue-700 mt-1">{formatCurrency(stats.profit)}</div>
        </Card>
        <Card>
          <div className="text-sm text-slate-500 font-medium">Cần xử lý</div>
          <div className="mt-1 flex gap-4 text-sm">
            <div><span className="font-bold text-amber-600">{stats.lowStockCount}</span> vật liệu sắp hết</div>
            <div><span className="font-bold text-primary">{stats.pendingOrders}</span> đơn mới</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Biểu đồ dòng tiền (Gần đây)" className="lg:col-span-2">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" fontSize={12} />
                <YAxis fontSize={12} />
                <Tooltip />
                <Bar dataKey="income" name="Thu" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Chi" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Vật liệu tồn kho thấp">
          <div className="space-y-4 max-h-64 overflow-y-auto">
            {materials.sort((a,b) => a.stock - b.stock).slice(0, 5).map(m => (
              <div key={m.id} className="flex justify-between items-center pb-2 border-b border-slate-100 last:border-0">
                <div>
                  <div className="font-medium text-slate-800">{m.name}</div>
                  <div className="text-xs text-slate-500">Đơn vị: {m.unit}</div>
                </div>
                <div className={`font-bold ${m.stock < 10 ? 'text-red-500' : 'text-slate-600'}`}>
                  {m.stock}
                </div>
              </div>
            ))}
            {materials.length === 0 && <p className="text-slate-500 text-sm">Chưa có dữ liệu.</p>}
          </div>
        </Card>
      </div>
    </div>
  );
};