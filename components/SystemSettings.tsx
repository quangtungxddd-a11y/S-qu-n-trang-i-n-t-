
import React, { useState, useEffect } from 'react';
import { 
  Save, Database, Edit2, X, Plus, Trash2, LayoutGrid, Search,
  RefreshCw, Wifi, Terminal, Server, Network, Zap, ChevronDown
} from 'lucide-react';
import { EquipmentItem, EquipmentType } from '../types';

const EQUIPMENT_TYPE_LABELS: Record<EquipmentType, string> = {
  [EquipmentType.NIEN_HAN]: 'Thường xuyên/Niên hạn',
  [EquipmentType.LE_PHUC]: 'Quân trang Lễ phục',
  [EquipmentType.DUNG_CHUNG]: 'Dùng chung',
  [EquipmentType.SSCD]: 'Sẵn sàng chiến đấu',
  [EquipmentType.DBDV]: 'Dự bị động viên',
  [EquipmentType.DOT_XUAT]: 'Đột xuất/Nhiệm vụ'
};

interface SystemSettingsProps {
  inventory: EquipmentItem[];
  onUpdate: (newInv: EquipmentItem[]) => void;
  isMobileView?: boolean;
}

const SystemSettings: React.FC<SystemSettingsProps> = ({ inventory, onUpdate, isMobileView }) => {
  const [activeTab, setActiveTab] = useState<'CATALOG' | 'STOCK' | 'LAN'>('LAN');
  const [editingItem, setEditingItem] = useState<EquipmentItem | null>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [stockYear, setStockYear] = useState(new Date().getFullYear().toString());
  const [openingBalances, setOpeningBalances] = useState<Record<string, number>>({});
  
  const [lanIp, setLanIp] = useState(localStorage.getItem('lan_server_ip') || '');

  useEffect(() => {
    const savedBalances = JSON.parse(localStorage.getItem(`opening_balance_${stockYear}`) || '{}');
    setOpeningBalances(savedBalances);
  }, [stockYear]);

  const handleSaveOpeningBalance = () => {
    localStorage.setItem(`opening_balance_${stockYear}`, JSON.stringify(openingBalances));
    const currentYearStr = new Date().getFullYear().toString();
    if (stockYear === currentYearStr) {
      const updatedInventory = inventory.map(item => ({
        ...item,
        stock: openingBalances[item.id] || 0
      }));
      onUpdate(updatedInventory);
    }
    alert(`Báo cáo: Đã lưu tồn đầu kỳ năm ${stockYear} và cập nhật kho thực tế.`);
  };

  const handleSaveLanConfig = () => {
    localStorage.setItem('lan_server_ip', lanIp.trim());
    alert("Báo cáo: Đã cập nhật cấu hình mạng nội bộ. Hệ thống sẽ khởi động lại luồng đồng bộ.");
    window.location.reload(); 
  };

  const saveCatalogItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    let newInventory: EquipmentItem[];
    const isNew = !inventory.find(i => i.id === editingItem.id);
    if (isNew) newInventory = [...inventory, editingItem];
    else newInventory = inventory.map(i => i.id === editingItem.id ? editingItem : i);
    onUpdate(newInventory);
    setShowItemModal(false);
    setEditingItem(null);
  };

  const deleteItem = (id: string) => {
    if (window.confirm("Báo cáo: Đồng chí có chắc chắn muốn xóa mặt hàng này khỏi danh mục hệ thống?")) {
      onUpdate(inventory.filter(i => i.id !== id));
    }
  };

  const filteredCatalog = inventory.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className={`space-y-6 max-w-6xl mx-auto ${isMobileView ? 'pb-20' : 'pb-10'}`}>
      <div className="flex bg-white p-1 rounded-2xl border shadow-sm overflow-x-auto no-scrollbar">
        {[
          { id: 'LAN', label: 'Đồng bộ LAN', icon: <Wifi size={14} /> },
          { id: 'CATALOG', label: 'Danh mục quân trang', icon: <LayoutGrid size={14} /> },
          { id: 'STOCK', label: 'Số dư đầu kỳ', icon: <Database size={14} /> }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 min-w-[150px] flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-emerald-950 text-white shadow-md' : 'text-slate-400 hover:text-emerald-900'}`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'LAN' && (
        <div className="bg-[#0c1808] rounded-[40px] text-white p-8 md:p-12 shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-10"></div>
           <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="space-y-6">
                 <h3 className="text-2xl font-black uppercase tracking-tight">Cấu hình LAN SYNC</h3>
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Địa chỉ IP Máy chủ Quân nhu</label>
                    <input type="text" value={lanIp} onChange={(e) => setLanIp(e.target.value)} placeholder="VD: 192.168.1.5" className="w-full px-5 py-4 bg-white/5 border border-white/10 rounded-2xl font-mono text-white outline-none focus:border-yellow-500 transition-all" />
                 </div>
                 <button onClick={handleSaveLanConfig} className="w-full bg-yellow-500 text-emerald-950 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Lưu cấu hình hệ thống</button>
              </div>
              <div className="bg-white/5 p-8 rounded-3xl border border-white/10 space-y-4">
                 <h4 className="text-yellow-500 font-black uppercase text-xs tracking-widest">Trạng thái đồng bộ</h4>
                 <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse"></div>
                    <span className="text-[11px] font-black uppercase tracking-widest">Sẵn sàng lưu trữ lâu dài</span>
                 </div>
                 <p className="text-[10px] text-emerald-100/40 uppercase font-bold italic leading-relaxed">
                    Mọi thay đổi về danh mục mặt hàng và số đo sẽ được lưu trữ bền vững tại Máy chủ nội bộ.
                 </p>
              </div>
           </div>
        </div>
      )}

      {activeTab === 'CATALOG' && (
        <div className="bg-white rounded-[32px] border shadow-sm overflow-hidden animate-in fade-in duration-500">
          <div className="p-6 md:p-8 bg-emerald-950 text-white flex flex-col md:flex-row justify-between items-center gap-4">
            <div>
               <h3 className="text-xl font-black uppercase">Danh mục quân trang gốc</h3>
               <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mt-1">Quản lý định mức & niên hạn mặt hàng</p>
            </div>
            <button 
              onClick={() => {
                setEditingItem({ id: `QT-${Date.now()}`, name: '', type: EquipmentType.NIEN_HAN, unit: 'Bộ', tenureMonths: 12, stock: 0, yearlyStandard: 1, category: 'QUAN_AO', price: 0 });
                setShowItemModal(true);
              }}
              className="bg-yellow-500 text-emerald-950 px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-lg active:scale-95 transition-all"
            >
              + Thêm mặt hàng quân trang
            </button>
          </div>
          
          <div className="p-8 space-y-6">
            <div className="relative">
               <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
               <input 
                 type="text" 
                 placeholder="Tìm theo tên hoặc mã quân trang..."
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] font-black outline-none focus:border-emerald-600 focus:bg-white transition-all shadow-inner"
               />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b tracking-widest">
                    <th className="px-6 py-4">Tên mặt hàng</th>
                    <th className="px-4 py-4 text-center">ĐVT</th>
                    <th className="px-4 py-4 text-center">Loại trang bị</th>
                    <th className="px-4 py-4 text-center">Niên hạn</th>
                    <th className="px-6 py-4 text-right">Tác vụ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredCatalog.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-black text-black text-sm uppercase leading-tight">{item.name}</p>
                        <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">Mã hàng: {item.id}</p>
                      </td>
                      <td className="px-4 py-4 text-center font-black text-xs uppercase">{item.unit}</td>
                      <td className="px-4 py-4 text-center">
                        <span className="bg-slate-100 px-3 py-1 rounded-full text-[9px] font-black uppercase text-emerald-900 border border-slate-200">
                           {EQUIPMENT_TYPE_LABELS[item.type]}
                        </span>
                      </td>
                      <td className="px-4 py-4 text-center font-black text-xs">{item.tenureMonths} tháng</td>
                      <td className="px-6 py-4 text-right space-x-1">
                        <button onClick={() => { setEditingItem(item); setShowItemModal(true); }} className="p-2 text-slate-400 hover:text-emerald-900 transition-colors"><Edit2 size={16}/></button>
                        <button onClick={() => deleteItem(item.id)} className="p-2 text-slate-400 hover:text-red-600 transition-colors"><Trash2 size={16}/></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'STOCK' && (
        <div className="bg-white rounded-[32px] border shadow-sm overflow-hidden animate-in fade-in duration-500">
          <div className="p-8 bg-emerald-900 text-white flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black uppercase">Tồn kho đầu kỳ {stockYear}</h3>
              <p className="text-emerald-300 text-[10px] font-black uppercase tracking-widest mt-1">Dữ liệu gốc phục vụ quyết toán</p>
            </div>
            <button onClick={handleSaveOpeningBalance} className="bg-yellow-500 text-emerald-950 px-6 py-3 rounded-xl font-black text-[10px] uppercase shadow-xl active:scale-95 transition-all">Lưu số dư & Đồng bộ</button>
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 bg-slate-50">
            {inventory.map(item => (
              <div key={item.id} className="p-6 bg-white border border-slate-100 rounded-[24px] space-y-3 shadow-sm group hover:border-emerald-400 transition-all">
                 <div className="flex justify-between items-start">
                   <label className="text-[10px] font-black uppercase text-slate-500 leading-tight">{item.name}</label>
                   <span className="text-[9px] font-black text-emerald-900/40 uppercase">{item.unit}</span>
                 </div>
                 <div className="relative">
                   <input 
                    type="number" 
                    value={openingBalances[item.id] || 0} 
                    onChange={(e) => setOpeningBalances({...openingBalances, [item.id]: parseInt(e.target.value) || 0})} 
                    className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-base outline-none focus:border-emerald-600 focus:bg-white transition-all" 
                   />
                   <Database className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-200" size={20} />
                 </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showItemModal && editingItem && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-emerald-950/80 backdrop-blur-md">
           <form onSubmit={saveCatalogItem} className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl overflow-hidden animate-in zoom-in duration-300">
              <div className="p-6 bg-emerald-900 text-white flex justify-between items-center">
                 <h3 className="font-black uppercase text-sm tracking-widest">Khai báo mặt hàng quân trang</h3>
                 <button type="button" onClick={() => setShowItemModal(false)}><X size={20} /></button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Tên mặt hàng quân trang *</label>
                    <input required value={editingItem.name} onChange={(e) => setEditingItem({...editingItem, name: e.target.value.toUpperCase()})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black uppercase outline-none focus:border-emerald-600" placeholder="VD: QUÂN PHỤC LỄ PHỤC HÈ SỸ QUAN" />
                 </div>
                 
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Đơn vị tính *</label>
                       <input required value={editingItem.unit} onChange={(e) => setEditingItem({...editingItem, unit: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black outline-none focus:border-emerald-600" placeholder="VD: Bộ, Đôi, Cái..." />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Loại quân trang *</label>
                       <div className="relative">
                          <select 
                            value={editingItem.type} 
                            onChange={(e) => setEditingItem({...editingItem, type: e.target.value as EquipmentType})}
                            className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black outline-none focus:border-emerald-600 appearance-none"
                          >
                             {Object.entries(EQUIPMENT_TYPE_LABELS).map(([val, label]) => (
                               <option key={val} value={val}>{label}</option>
                             ))}
                          </select>
                          <ChevronDown size={20} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                       </div>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Niên hạn cấp phát (Tháng) *</label>
                       <input type="number" required value={editingItem.tenureMonths} onChange={(e) => setEditingItem({...editingItem, tenureMonths: parseInt(e.target.value) || 0})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black outline-none focus:border-emerald-600" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Mã hiệu hệ thống (ID) *</label>
                       <input required value={editingItem.id} onChange={(e) => setEditingItem({...editingItem, id: e.target.value.toUpperCase()})} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-mono font-black outline-none focus:border-emerald-600" placeholder="VD: QT-01" />
                    </div>
                 </div>

                 <div className="pt-6 flex gap-4">
                    <button type="button" onClick={() => setShowItemModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl text-[10px] font-black uppercase text-slate-500">Hủy bỏ</button>
                    <button type="submit" className="flex-[2] py-4 bg-emerald-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-2 active:scale-95 transition-all"><Save size={18} className="text-yellow-500" /> Lưu vào danh mục lâu dài</button>
                 </div>
              </div>
           </form>
        </div>
      )}
    </div>
  );
};

export default SystemSettings;
