
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  ArrowDownToLine,
  X,
  FileText,
  Printer,
  History,
  ChevronRight,
  Plus,
  Save,
  ChevronDown,
  CheckSquare,
  Square,
  Building2,
  BadgeCheck,
  CheckCircle2,
  FileSearch,
  Users
} from 'lucide-react';
import { EquipmentItem, EquipmentType, ImportRecord, Soldier } from '../types';
import { api } from '../services/apiService';

interface InventoryProps {
  items: EquipmentItem[];
  onUpdate: (newItems: EquipmentItem[]) => void;
  isMobileView?: boolean;
  onNavigate?: (tab: string) => void;
  currentUser?: Soldier | null;
}

const Inventory: React.FC<InventoryProps> = ({ items, onUpdate, isMobileView, onNavigate, currentUser }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'INVENTORY' | 'EXPORT_HISTORY' | 'IMPORT_HISTORY'>('INVENTORY');
  
  const [allIssues, setAllIssues] = useState<any[]>([]);
  const [selectedIssueIds, setSelectedIssueIds] = useState<string[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showGroupPrintModal, setShowGroupPrintModal] = useState(false);

  const [importData, setImportData] = useState({
    superiorVoucherId: '',
    importVoucherId: '',
    date: new Date().toISOString().split('T')[0],
    items: [{ itemId: '', itemName: '', unit: '', voucherQty: 0, actualQty: 0, note: '' }]
  });

  const refreshData = async () => {
    const issues = await api.getIssues();
    setAllIssues(issues.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredInventory = useMemo(() => {
    return items.filter(item => 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      item.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [items, searchTerm]);

  const filteredIssues = useMemo(() => {
    return allIssues.filter(issue => 
      issue.soldierName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      issue.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      issue.soldierUnit?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allIssues, searchTerm]);

  const toggleSelectIssue = (id: string) => {
    setSelectedIssueIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectedIssuesForPrint = useMemo(() => {
    return allIssues.filter(i => selectedIssueIds.includes(i.id));
  }, [allIssues, selectedIssueIds]);

  const executeImport = () => {
    const updatedInventory = items.map(invItem => {
      const importItem = importData.items.find(it => it.itemId === invItem.id);
      return importItem ? { ...invItem, stock: invItem.stock + importItem.actualQty } : invItem;
    });
    onUpdate(updatedInventory);
    setShowImportModal(false);
    alert("Báo cáo: Đã nhập kho thành công và cập nhật tồn thực tế.");
  };

  return (
    <div className="bg-white rounded-[32px] md:rounded-[56px] border shadow-2xl overflow-hidden flex flex-col h-full animate-in fade-in duration-500">
      <div className="p-6 md:p-12 border-b border-slate-50">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-6">
            <div>
              <h3 className="font-black text-slate-900 uppercase tracking-tight text-xl md:text-3xl">
                Quản lý Kho & Quyết toán
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-4">
                 {[
                   { id: 'INVENTORY', label: 'Tồn kho thực tế' },
                   { id: 'EXPORT_HISTORY', label: 'Cấp phát chi tiết' },
                   { id: 'IMPORT_HISTORY', label: 'Lịch sử nhập kho' }
                 ].map(tab => (
                   <button 
                     key={tab.id}
                     onClick={() => setViewMode(tab.id as any)}
                     className={`text-[9px] md:text-[10px] font-black uppercase tracking-widest px-4 py-2.5 rounded-xl transition-all border-2 ${viewMode === tab.id ? 'bg-emerald-950 text-white border-emerald-950 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}
                   >
                     {tab.label}
                   </button>
                 ))}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button onClick={() => setShowImportModal(true)} className="bg-emerald-900 text-white px-6 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl text-[10px] flex items-center gap-2 active:scale-95 transition-all">
                <ArrowDownToLine size={18} /> Nhập kho
              </button>
              {viewMode === 'EXPORT_HISTORY' && (
                <button 
                  onClick={() => {
                    if (selectedIssueIds.length === 0) {
                      alert("Báo cáo: Vui lòng chọn ít nhất một phiếu xuất để in gộp!");
                      return;
                    }
                    setShowGroupPrintModal(true);
                  }}
                  className={`px-6 py-4 rounded-2xl font-black uppercase tracking-widest shadow-xl text-[10px] flex items-center gap-2 active:scale-95 transition-all ${selectedIssueIds.length > 0 ? 'bg-yellow-500 text-emerald-950 shadow-yellow-500/20' : 'bg-slate-100 text-slate-400'}`}
                >
                  <Printer size={18} /> In phiếu xuất gộp ({selectedIssueIds.length})
                </button>
              )}
            </div>
          </div>

          <div className="relative">
             <Search className="absolute left-4 top-3.5 text-slate-400" size={20} />
             <input 
               type="text" 
               placeholder={viewMode === 'INVENTORY' ? "Tìm tên mặt hàng..." : "Tìm tên quân nhân, đơn vị, số phiếu..."}
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
               className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] font-black text-slate-900 outline-none focus:border-emerald-600 focus:bg-white transition-all shadow-inner"
             />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto bg-white custom-scrollbar">
        {viewMode === 'INVENTORY' && (
          <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b tracking-widest">
                    <th className="px-10 py-5">Vật chất quân nhu</th>
                    <th className="px-6 py-5 text-center">Phân loại</th>
                    <th className="px-6 py-5 text-center">ĐVT</th>
                    <th className="px-10 py-5 text-right">Tồn thực tế</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.map(item => (
                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-10 py-6 flex items-center gap-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-2xl shadow-sm">{item.category === 'QUAN_AO' ? '👕' : '👞'}</div>
                        <div>
                           <p className="font-black text-slate-900 uppercase text-sm leading-none">{item.name}</p>
                           <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">Mã: {item.id}</p>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <span className="bg-slate-100 px-3 py-1 rounded-full text-[9px] font-black uppercase text-emerald-900">{item.type}</span>
                      </td>
                      <td className="px-6 py-6 text-center font-black text-xs uppercase">{item.unit}</td>
                      <td className="px-10 py-6 text-right font-black text-xl text-emerald-950">{item.stock}</td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        )}

        {viewMode === 'EXPORT_HISTORY' && (
          <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b tracking-widest">
                    <th className="px-6 py-5 w-10">Chọn</th>
                    <th className="px-6 py-5">Quân nhân tiếp nhận</th>
                    <th className="px-6 py-5">Đơn vị</th>
                    <th className="px-6 py-5 text-center">Ngày cấp phát</th>
                    <th className="px-6 py-5 text-center">Số phiếu</th>
                    <th className="px-6 py-5 text-center">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredIssues.map(issue => (
                    <tr key={issue.id} className={`hover:bg-slate-50 transition-colors ${selectedIssueIds.includes(issue.id) ? 'bg-emerald-50/50' : ''}`}>
                      <td className="px-6 py-6">
                        <button onClick={() => toggleSelectIssue(issue.id)} className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${selectedIssueIds.includes(issue.id) ? 'bg-emerald-900 border-emerald-900 text-white shadow-md' : 'bg-white border-slate-200'}`}>
                           {selectedIssueIds.includes(issue.id) && <CheckSquare size={14} />}
                        </button>
                      </td>
                      <td className="px-6 py-6">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400"><Users size={18} /></div>
                            <div>
                               <p className="font-black text-slate-900 uppercase text-xs leading-none">{issue.soldierName}</p>
                               <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase">SH: {issue.soldierId}</p>
                            </div>
                         </div>
                      </td>
                      <td className="px-6 py-6 text-[11px] font-black text-emerald-900 uppercase">{issue.soldierUnit}</td>
                      <td className="px-6 py-6 text-center text-[11px] font-black text-slate-500">{new Date(issue.date).toLocaleDateString('vi-VN')}</td>
                      <td className="px-6 py-6 text-center text-[11px] font-mono font-black text-emerald-950">{issue.id}</td>
                      <td className="px-6 py-6 text-center">
                         <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${
                           issue.status === 'PENDING' ? 'bg-orange-50 text-orange-600 border-orange-200' : 
                           issue.status === 'ISSUED' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                           'bg-emerald-50 text-emerald-600 border-emerald-200'
                         }`}>
                           {issue.status === 'PENDING' ? 'Đang chờ ký' : issue.status === 'ISSUED' ? 'Đã ký nhận' : 'Đã quyết toán'}
                         </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
             </table>
          </div>
        )}

        {viewMode === 'IMPORT_HISTORY' && (
           <div className="p-20 text-center text-slate-300 space-y-4 opacity-50">
              <History size={64} className="mx-auto" />
              <p className="text-xs font-black uppercase tracking-[0.3em]">Đang nâng cấp module lịch sử nhập...</p>
           </div>
        )}
      </div>

      {/* Group Print Modal C31 */}
      {showGroupPrintModal && selectedIssuesForPrint.length > 0 && (
        <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md no-print">
           <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in duration-300">
              <div className="p-8 bg-emerald-950 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-4">
                    <Printer size={24} className="text-yellow-500" />
                    <h3 className="text-xl font-black uppercase tracking-tight">Phiếu xuất kho tổng hợp (Gộp {selectedIssuesForPrint.length} quân nhân)</h3>
                 </div>
                 <button onClick={() => setShowGroupPrintModal(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={28} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-12 bg-slate-100 custom-scrollbar">
                 <div className="bg-white p-16 shadow-2xl mx-auto w-full max-w-[850px] border font-serif min-h-[1100px] text-black a4-page">
                    <div className="flex justify-between items-start mb-10">
                       <div className="text-center">
                          <p className="font-bold text-xs uppercase">Đơn vị: {selectedIssuesForPrint[0]?.soldierUnit || '---'}</p>
                          <p className="text-xs uppercase border-b border-black inline-block pb-1">Ban Quân nhu</p>
                       </div>
                       <div className="text-center">
                          <p className="font-bold text-xs">Mẫu số: C31-HD</p>
                          <p className="text-[10px] italic">(Ban hành kèm theo TT số 148/2017/TT-BQP)</p>
                       </div>
                    </div>
                    
                    <div className="text-center mb-10">
                       <h2 className="text-2xl font-black uppercase mb-1">PHIẾU XUẤT KHO TỔNG HỢP</h2>
                       <p className="text-sm font-bold">Số: {selectedIssuesForPrint[0]?.id.split('-')[0]}-G{selectedIssuesForPrint.length}</p>
                       <p className="text-xs italic mt-2">Ngày {new Date().getDate()} tháng {new Date().getMonth()+1} năm {new Date().getFullYear()}</p>
                    </div>

                    <div className="space-y-4 mb-10 text-sm">
                       <p>- Đơn vị nhận hàng: <span className="font-bold uppercase underline">{selectedIssuesForPrint[0]?.soldierUnit}</span></p>
                       <p>- Lý do xuất kho: Cấp phát quân trang gộp cho đơn vị {selectedIssuesForPrint[0]?.period} - {selectedIssuesForPrint[0]?.budgetYear}</p>
                       <p>- Xuất tại kho: Kho Quân nhu đơn vị</p>
                    </div>

                    <table className="w-full border-collapse border border-black text-[10px] text-center mb-10">
                       <thead>
                          <tr className="font-bold bg-slate-50">
                             <th className="border border-black p-2 w-10">STT</th>
                             <th className="border border-black p-2 text-left">Họ tên quân nhân</th>
                             <th className="border border-black p-2">Danh mục vật chất cấp phát</th>
                             <th className="border border-black p-2 w-20">Số phiếu gốc</th>
                             <th className="border border-black p-2 w-24">Xác nhận ký</th>
                          </tr>
                       </thead>
                       <tbody>
                          {selectedIssuesForPrint.map((issue, idx) => (
                             <tr key={idx}>
                                <td className="border border-black p-2">{idx+1}</td>
                                <td className="border border-black p-2 text-left uppercase font-bold">{issue.soldierName}</td>
                                <td className="border border-black p-2 text-left italic">
                                   {issue.items.map((it:any) => `${it.name} (${it.quantity})`).join(', ')}
                                </td>
                                <td className="border border-black p-2">{issue.id}</td>
                                <td className="border border-black p-2 text-[8px] font-black uppercase text-emerald-700">
                                   {issue.status === 'ISSUED' || issue.status === 'FINALIZED' ? 'Đã ký nhận điện tử' : '---'}
                                </td>
                             </tr>
                          ))}
                       </tbody>
                    </table>

                    <div className="grid grid-cols-4 gap-4 text-[11px] font-bold text-center mt-20">
                       <div className="flex flex-col items-center">
                          <p className="uppercase">Người lập phiếu</p>
                          <p className="font-normal italic mt-1">(Ký, họ tên)</p>
                          <div className="h-24"></div>
                          <p className="uppercase">{currentUser?.fullName}</p>
                       </div>
                       <div>
                          <p className="uppercase">Thủ kho</p>
                          <p className="font-normal italic mt-1">(Ký, họ tên)</p>
                       </div>
                       <div className="flex flex-col items-center">
                          <p className="uppercase">Chỉ huy nhận hàng</p>
                          <p className="font-normal italic mt-1">(Ký, họ tên)</p>
                          <div className="h-24"></div>
                          <p className="uppercase">..........................</p>
                       </div>
                       <div>
                          <p className="uppercase">Chỉ huy đơn vị</p>
                          <p className="font-normal italic mt-1">(Ký, họ tên)</p>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="p-8 bg-white border-t flex justify-end gap-4 shrink-0 shadow-2xl">
                 <button onClick={() => setShowGroupPrintModal(false)} className="px-10 py-5 bg-slate-100 rounded-[24px] text-[10px] font-black uppercase text-slate-500">Hủy bỏ</button>
                 <button onClick={() => window.print()} className="px-12 py-5 bg-emerald-950 text-white rounded-[24px] text-[10px] font-black uppercase flex items-center gap-3 shadow-xl active:scale-95 transition-all"><Printer size={20} className="text-yellow-500" /> In phiếu xuất đơn vị</button>
              </div>
           </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-emerald-950/90 backdrop-blur-md">
          <div className="bg-white rounded-[48px] shadow-2xl overflow-hidden flex flex-col w-full max-w-4xl h-[90vh]">
            <div className="p-8 bg-emerald-950 text-white flex justify-between items-center shrink-0">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-yellow-500 rounded-2xl text-emerald-950 shadow-lg"><ArrowDownToLine size={24} /></div>
                  <h3 className="font-black uppercase tracking-widest text-xl">Phiếu nhập kho quân trang</h3>
               </div>
               <button onClick={() => setShowImportModal(false)} className="p-3 hover:bg-white/10 rounded-full"><X size={24} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-12 space-y-8 bg-slate-50 custom-scrollbar">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Lệnh cấp của trên *</label>
                     <input type="text" value={importData.superiorVoucherId} onChange={e => setImportData({...importData, superiorVoucherId: e.target.value})} className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-black outline-none focus:border-emerald-600" placeholder="VD: 123/L-QN" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Số Phiếu nhập đơn vị *</label>
                     <input type="text" value={importData.importVoucherId} onChange={e => setImportData({...importData, importVoucherId: e.target.value})} className="w-full px-5 py-4 bg-white border-2 border-slate-100 rounded-2xl text-sm font-black outline-none focus:border-emerald-600" placeholder="VD: 01/PN" />
                  </div>
               </div>
               <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                     <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Danh sách vật phẩm nhập kho</h4>
                     <button onClick={() => setImportData({...importData, items: [...importData.items, { itemId: '', itemName: '', unit: '', voucherQty: 0, actualQty: 0, note: '' }]})} className="text-[10px] font-black uppercase text-emerald-900 bg-emerald-50 px-4 py-2 rounded-xl flex items-center gap-2"><Plus size={16} /> Thêm mặt hàng</button>
                  </div>
                  {importData.items.map((row, idx) => (
                    <div key={idx} className="bg-white p-8 rounded-[32px] border space-y-4 shadow-sm relative group">
                       <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-400">Chọn mặt hàng quân trang *</label>
                          <select value={row.itemId} onChange={(e) => { const ni = [...importData.items]; ni[idx].itemId = e.target.value; setImportData({...importData, items: ni}); }} className="w-full px-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[13px] font-black outline-none focus:border-emerald-600 appearance-none">
                            <option value="">-- Chọn mặt hàng --</option>
                            {items.map(it => <option key={it.id} value={it.id}>{it.name} ({it.unit})</option>)}
                          </select>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                             <label className="text-[9px] font-black uppercase text-slate-400">Số lượng theo lệnh</label>
                             <input type="number" value={row.voucherQty} onChange={e => { const ni = [...importData.items]; ni[idx].voucherQty = parseInt(e.target.value) || 0; setImportData({...importData, items: ni}); }} className="w-full px-4 py-3 bg-slate-50 border rounded-xl font-black" />
                          </div>
                          <div className="space-y-1">
                             <label className="text-[9px] font-black uppercase text-slate-400">Số lượng thực nhập</label>
                             <input type="number" value={row.actualQty} onChange={e => { const ni = [...importData.items]; ni[idx].actualQty = parseInt(e.target.value) || 0; setImportData({...importData, items: ni}); }} className="w-full px-4 py-3 bg-emerald-50 border-2 border-emerald-100 rounded-xl font-black text-emerald-950" />
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
            <div className="p-8 bg-white border-t flex gap-4 shrink-0 shadow-2xl">
               <button onClick={() => setShowImportModal(false)} className="flex-1 py-5 bg-slate-100 rounded-[24px] text-[11px] font-black uppercase text-slate-500">Hủy</button>
               <button onClick={executeImport} className="flex-[2] bg-emerald-950 text-white py-5 rounded-[24px] text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all">
                 <Save size={20} className="text-yellow-500" /> Xác nhận & Cập nhật kho
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
