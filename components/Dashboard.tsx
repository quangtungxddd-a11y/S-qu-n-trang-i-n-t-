
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { 
  PackageCheck, 
  AlertTriangle, 
  CheckCircle2, 
  PackageSearch,
  History,
  AlertCircle,
  QrCode,
  FilePieChart,
  ArrowRight,
  ChevronRight
} from 'lucide-react';
import { UserRole, EquipmentItem } from '../types';

interface DashboardProps {
  role: UserRole;
  inventory: EquipmentItem[];
  onNavigate: (tab: string) => void;
  isMobileView?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ role, inventory, onNavigate, isMobileView }) => {
  const lowStockItems = inventory.filter(item => item.stock < 50);
  const totalStock = inventory.reduce((acc, item) => acc + item.stock, 0);
  
  const chartData = inventory.slice(0, 5).map(item => ({
    name: item.name,
    value: item.stock
  }));

  const COLORS = ['#1a2f12', '#D4AF37', '#16A34A', '#DC2626', '#1E40AF'];

  return (
    <div className="space-y-6 md:space-y-10 animate-in fade-in duration-700">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-6">
        {[
          { label: 'Danh mục', value: inventory.length, icon: <PackageSearch size={20} />, color: 'bg-blue-50 text-blue-600', border: 'border-blue-100' },
          { label: 'Tổng tồn', value: totalStock.toLocaleString(), icon: <PackageCheck size={20} />, color: 'bg-emerald-50 text-emerald-600', border: 'border-emerald-100' },
          { label: 'Sắp hết', value: lowStockItems.length, icon: <AlertTriangle size={20} />, color: 'bg-red-50 text-red-600', border: 'border-red-100' },
          { label: 'Yêu cầu', value: '08', icon: <History size={20} />, color: 'bg-purple-50 text-purple-600', border: 'border-purple-100' },
        ].map((stat, i) => (
          <div key={i} className={`bg-white p-4 md:p-6 rounded-[24px] md:rounded-[32px] border ${stat.border} shadow-sm active:scale-95 transition-all group`}>
            <div className="flex items-center justify-between mb-4">
              <div className={`p-2.5 md:p-3 rounded-xl ${stat.color} shadow-sm group-hover:scale-110 transition-transform`}>
                {stat.icon}
              </div>
            </div>
            <h3 className="text-xl md:text-3xl font-black text-slate-900 leading-none">{stat.value}</h3>
            <p className="text-[9px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart Section */}
        <div className="lg:col-span-2 bg-white p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-slate-100 shadow-sm relative overflow-hidden">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 relative z-10">
            <div>
              <h3 className="font-black text-slate-900 uppercase text-sm md:text-xl tracking-tight">Biểu đồ tồn kho thực tế</h3>
              <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em] mt-1">Dữ liệu quân trang chuẩn hóa</p>
            </div>
            <button 
              onClick={() => onNavigate('inventory')}
              className="bg-emerald-950 text-white text-[9px] md:text-[11px] font-black px-5 py-3 rounded-2xl uppercase tracking-widest hover:bg-emerald-800 active:scale-95 transition-all shadow-xl shadow-emerald-950/20"
            >
              Chi tiết kho <ArrowRight size={14} className="inline ml-2" />
            </button>
          </div>
          <div className="h-64 md:h-80 w-full relative z-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: '800' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#64748b', fontWeight: '800' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)', fontWeight: '900' }}
                />
                <Bar dataKey="value" radius={[12, 12, 0, 0]} barSize={isMobileView ? 30 : 50}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts Section */}
        <div className="bg-white p-6 md:p-10 rounded-[32px] md:rounded-[48px] border border-slate-100 shadow-sm flex flex-col">
          <div className="flex items-center gap-3 mb-8 text-red-600">
            <div className="p-3 bg-red-50 rounded-2xl"><AlertCircle size={22} /></div>
            <h3 className="font-black text-slate-900 uppercase text-sm tracking-tight">Cảnh báo nhập hàng</h3>
          </div>
          <div className="flex-1 space-y-4 overflow-y-auto no-scrollbar max-h-[300px] md:max-h-none pr-1">
            {lowStockItems.length > 0 ? lowStockItems.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-[24px] group hover:border-red-200 transition-all active:bg-red-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-2xl flex items-center justify-center text-xl shadow-sm border border-slate-100 group-hover:scale-110 transition-transform">
                    {item.category === 'QUAN_AO' ? '👕' : item.category === 'GIAY_DEP' ? '👞' : '🎓'}
                  </div>
                  <div>
                    <p className="text-[11px] md:text-sm font-black text-slate-800 uppercase leading-tight">{item.name}</p>
                    <p className="text-[9px] text-slate-400 font-black uppercase tracking-widest mt-1">Mã: {item.id}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-base md:text-lg font-black text-red-600">{item.stock}</p>
                  <p className="text-[8px] text-slate-400 font-black uppercase tracking-tighter">Đơn vị: {item.unit}</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-12 space-y-3 opacity-20">
                <CheckCircle2 size={48} className="mx-auto text-emerald-600" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Kho hàng an toàn</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Tiles */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div 
          onClick={() => onNavigate('issuance')}
          className="bg-emerald-950 p-8 md:p-12 rounded-[40px] md:rounded-[56px] text-white flex items-center justify-between shadow-2xl relative overflow-hidden group cursor-pointer active:scale-95 transition-all"
        >
           <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-900 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 opacity-50"></div>
           <div className="relative z-10">
             <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-yellow-500 rounded-xl text-emerald-950 shadow-lg"><QrCode size={20} /></div>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400">Hệ thống cấp phát</span>
             </div>
             <h4 className="text-2xl md:text-4xl font-black uppercase tracking-tight leading-none">Cấp nhanh <br/> QR Code</h4>
             <button className="mt-8 flex items-center gap-3 bg-white text-emerald-950 px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl group-hover:bg-yellow-500 transition-colors">
                Khởi chạy ngay <ChevronRight size={16} />
             </button>
           </div>
           <QrCode size={120} className="text-white/5 absolute -right-4 -bottom-4 rotate-12" />
        </div>

        <div 
          onClick={() => onNavigate('reports')}
          className="bg-white p-8 md:p-12 rounded-[40px] md:rounded-[56px] border border-slate-200 flex items-center justify-between shadow-xl relative overflow-hidden group cursor-pointer active:scale-95 transition-all"
        >
           <div className="relative z-10">
             <div className="flex items-center gap-3 mb-4">
               <div className="p-2 bg-emerald-900 rounded-xl text-yellow-500 shadow-lg"><FilePieChart size={20} /></div>
               <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Trung tâm báo cáo</span>
             </div>
             <h4 className="text-2xl md:text-4xl font-black uppercase tracking-tight leading-none text-slate-900">Quyết toán <br/> Quân trang</h4>
             <button className="mt-8 flex items-center gap-3 bg-slate-900 text-white px-6 py-3.5 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl group-hover:bg-emerald-800 transition-colors">
                Xem quyết toán <ChevronRight size={16} />
             </button>
           </div>
           <FilePieChart size={120} className="text-slate-50 absolute -right-4 -bottom-4 -rotate-6" />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
