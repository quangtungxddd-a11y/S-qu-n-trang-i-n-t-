
import React, { useState, useEffect } from 'react';
import { 
  PackageCheck, 
  ShieldCheck, 
  Clock, 
  History, 
  FileText, 
  Shield, 
  X, 
  BadgeCheck, 
  Zap,
  CheckCircle2,
  AlertCircle,
  Signature
} from 'lucide-react';
import { Soldier, EquipmentItem } from '../types';
import { api } from '../services/apiService';

interface ReceptionProps {
  soldier: Soldier;
  onInventoryUpdate: (newInv: EquipmentItem[]) => void;
  isMobileView?: boolean;
}

const ReceptionSystem: React.FC<ReceptionProps> = ({ soldier, onInventoryUpdate, isMobileView }) => {
  const [activeSubTab, setActiveSubTab] = useState<'PENDING' | 'HISTORY'>('PENDING');
  const [issues, setIssues] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState<any>(null);

  const refreshData = async () => {
    const allIssues = await api.getIssues();
    // Lọc các bản ghi dành riêng cho quân nhân này
    const filtered = allIssues.filter((p: any) => p.soldierId === soldier.serviceId);
    setIssues(filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  useEffect(() => {
    refreshData();
    // Polling nhẹ để nhận thông báo mới nếu không có WebSocket
    const interval = setInterval(refreshData, 10000);
    return () => clearInterval(interval);
  }, [soldier.serviceId]);

  const pendingIssues = issues.filter(i => i.status === 'PENDING');
  const historyIssues = issues.filter(i => i.status === 'ISSUED' || i.status === 'FINALIZED');

  const handleConfirmReceipt = async (issue: any) => {
    setIsProcessing(true);
    try {
      const allIssues = await api.getIssues();
      const idx = allIssues.findIndex((i: any) => i.id === issue.id);
      
      if (idx !== -1) {
        // 1. Cập nhật trạng thái đợt cấp phát
        allIssues[idx].status = 'ISSUED';
        allIssues[idx].confirmDate = new Date().toISOString();
        
        // 2. Trừ tồn kho thực tế ngay lập tức
        const currentInv = await api.getInventory();
        const updatedInv = currentInv.map(invItem => {
          const itemInIssue = issue.items.find((it: any) => it.id === invItem.id);
          if (itemInIssue) {
            return { 
              ...invItem, 
              stock: Math.max(0, invItem.stock - (itemInIssue.quantity || 0)) 
            };
          }
          return invItem;
        });

        // 3. Đồng bộ lên Server/Cache
        await api.saveIssues(allIssues);
        await api.updateInventory(updatedInv);
        
        // 4. Cập nhật State App
        onInventoryUpdate(updatedInv);
        refreshData();
        setShowConfirmModal(null);
        alert("Báo cáo: Đồng chí đã xác nhận tiếp nhận quân trang thành công. Hệ thống đã cập nhật quyết toán kho.");
      }
    } catch (error) {
      console.error(error);
      alert("Lỗi: Không thể kết nối với máy chủ để xác thực.");
    }
    setIsProcessing(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      {/* Header Profile Reception */}
      <div className="bg-[#0c1808] text-white p-8 md:p-12 rounded-[40px] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-10"></div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
           <div className="w-24 h-24 bg-yellow-500 rounded-[32px] flex items-center justify-center text-emerald-950 shadow-xl border-4 border-emerald-900 shrink-0">
              <PackageCheck size={48} />
           </div>
           <div className="text-center md:text-left">
              <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-none">{soldier.fullName}</h3>
              <p className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.3em] mt-3 flex items-center justify-center md:justify-start gap-2">
                 <Zap size={14} className="fill-current" /> Tiếp nhận quân trang trực tuyến
              </p>
           </div>
        </div>
      </div>

      {/* Tabs Chờ nhận / Lịch sử */}
      <div className="flex bg-white p-1 rounded-2xl border shadow-sm">
        <button 
          onClick={() => setActiveSubTab('PENDING')} 
          className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${activeSubTab === 'PENDING' ? 'bg-emerald-950 text-white shadow-md' : 'text-slate-400 hover:text-emerald-900'}`}
        >
          <Clock size={16} /> Thông báo mới ({pendingIssues.length})
        </button>
        <button 
          onClick={() => setActiveSubTab('HISTORY')} 
          className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase transition-all flex items-center justify-center gap-2 ${activeSubTab === 'HISTORY' ? 'bg-emerald-950 text-white shadow-md' : 'text-slate-400 hover:text-emerald-900'}`}
        >
          <History size={16} /> Lịch sử tiếp nhận ({historyIssues.length})
        </button>
      </div>

      <div className="space-y-4">
        {activeSubTab === 'PENDING' ? (
          pendingIssues.length > 0 ? (
            pendingIssues.map(issue => (
              <div key={issue.id} className="bg-white p-6 md:p-8 rounded-[32px] border-2 border-orange-100 shadow-xl group hover:border-orange-300 transition-all animate-in slide-in-from-bottom duration-300">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                  <div>
                     <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mã đợt: #{issue.id}</span>
                     <h4 className="text-xl font-black text-emerald-950 uppercase mt-1">Cấp phát {issue.period} - {issue.budgetYear}</h4>
                  </div>
                  <div className="px-4 py-2 bg-orange-50 text-orange-600 rounded-xl border border-orange-100 flex items-center gap-2">
                     <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
                     <span className="text-[9px] font-black uppercase">Chờ xác nhận</span>
                  </div>
                </div>

                <div className="space-y-3 mb-8">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Danh mục vật chất cấp phát:</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {issue.items.map((it: any) => (
                      <div key={it.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                        <div className="flex items-center gap-3">
                           <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-100">{it.category === 'QUAN_AO' ? '👕' : '👞'}</div>
                           <span className="text-[11px] font-black text-emerald-950 uppercase">{it.name}</span>
                        </div>
                        <span className="text-sm font-black text-emerald-900">{it.quantity} {it.unit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <button 
                  onClick={() => setShowConfirmModal(issue)}
                  className="w-full bg-emerald-950 text-white py-5 rounded-[24px] font-black uppercase tracking-widest text-[11px] shadow-xl hover:bg-emerald-800 transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                   <Signature size={20} className="text-yellow-500" /> Ký nhận điện tử
                </button>
              </div>
            ))
          ) : (
            <div className="bg-white p-20 rounded-[40px] border shadow-sm text-center space-y-4 opacity-50">
               <BadgeCheck size={64} className="mx-auto text-slate-200" />
               <p className="text-sm font-black uppercase text-slate-400 tracking-widest">Đồng chí không có thông báo cấp phát mới</p>
            </div>
          )
        ) : (
          <div className="grid grid-cols-1 gap-4">
             {historyIssues.map(issue => (
               <div key={issue.id} className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 group hover:bg-emerald-50/30 transition-all">
                  <div className="flex items-center gap-6">
                     <div className="w-16 h-16 bg-emerald-50 text-emerald-900 rounded-[24px] flex items-center justify-center"><CheckCircle2 size={32} /></div>
                     <div>
                        <h4 className="font-black text-slate-900 uppercase">Đã tiếp nhận {issue.period}</h4>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Ngày xác nhận: {new Date(issue.confirmDate).toLocaleDateString('vi-VN')} • #{issue.id}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="text-right">
                        <p className="text-sm font-black text-emerald-900 uppercase">{issue.items.length} mặt hàng</p>
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Trạng thái: {issue.status === 'FINALIZED' ? 'Đã quyết toán' : 'Đã ký nhận'}</p>
                     </div>
                     <button className="p-3 bg-white border-2 border-slate-100 rounded-xl text-slate-400 hover:text-emerald-900 transition-all"><FileText size={20} /></button>
                  </div>
               </div>
             ))}
          </div>
        )}
      </div>

      {/* Modal Xác nhận ký tên */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-emerald-950/90 backdrop-blur-md">
           <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in duration-300 flex flex-col">
              <div className="p-8 bg-emerald-950 text-white flex justify-between items-center">
                 <h3 className="font-black uppercase tracking-widest text-sm">Xác nhận ký tên điện tử</h3>
                 <button onClick={() => setShowConfirmModal(null)} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
              </div>
              <div className="p-10 space-y-8 flex-1 overflow-y-auto">
                 <div className="text-center space-y-4">
                    <div className="w-24 h-24 bg-emerald-50 text-emerald-900 rounded-[32px] flex items-center justify-center mx-auto border-2 border-emerald-100 shadow-inner">
                       <Signature size={48} />
                    </div>
                    <div className="space-y-1">
                       <h4 className="text-xl font-black uppercase text-slate-900">Cam kết tiếp nhận</h4>
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-relaxed">Đồng chí vui lòng kiểm tra kỹ số lượng và chất lượng vật chất trước khi ký tên.</p>
                    </div>
                 </div>

                 <div className="bg-slate-50 p-6 rounded-[24px] border border-slate-200 space-y-4">
                    <p className="text-[11px] font-bold text-slate-600 uppercase italic">
                       "Tôi là <span className="text-emerald-950 font-black">{soldier.fullName}</span>, cam kết đã nhận đủ các mặt hàng quân trang theo phiếu số <span className="text-emerald-950 font-black">#{showConfirmModal.id}</span> và chịu trách nhiệm bảo quản theo đúng niên hạn quy định."
                    </p>
                 </div>

                 <div className="flex items-center gap-3 p-4 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-900">
                    <AlertCircle size={20} className="shrink-0" />
                    <p className="text-[10px] font-black uppercase leading-tight">Sau khi ký, hệ thống sẽ tự động trừ tồn kho và cập nhật báo cáo quyết toán của đơn vị.</p>
                 </div>
              </div>

              <div className="p-8 bg-white border-t flex gap-4 shadow-2xl">
                 <button onClick={() => setShowConfirmModal(null)} className="flex-1 py-5 bg-slate-100 rounded-3xl text-[11px] font-black uppercase text-slate-500">Hủy</button>
                 <button 
                  onClick={() => handleConfirmReceipt(showConfirmModal)}
                  disabled={isProcessing}
                  className="flex-[2] py-5 bg-emerald-950 text-white rounded-3xl text-[11px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                 >
                   {isProcessing ? 'Đang xác thực...' : 'Xác nhận & Ký tên'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ReceptionSystem;
