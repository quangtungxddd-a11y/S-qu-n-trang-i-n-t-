
import React, { useState, useEffect } from 'react';
import { 
  BadgeCheck, Save, Ruler, ChevronDown, Lock, X, Scissors, Shield, Building2, SaveAll,
  AlertTriangle, Send
} from 'lucide-react';
import { Soldier, EquipmentItem, BodyMeasurements } from '../types';
import { api } from '../services/apiService';

const PersonalLedger: React.FC<{
  soldier: Soldier;
  onUpdateUser?: (updatedUser: Soldier) => void;
  onNavigate?: (tab: string) => void;
  isMobileView?: boolean;
}> = ({ soldier, onUpdateUser, onNavigate, isMobileView }) => {
  const [inventory, setInventory] = useState<EquipmentItem[]>([]);
  const [isEditingSizes, setIsEditingSizes] = useState(false);
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);
  const [editedSizes, setEditedSizes] = useState<Record<string, string>>(soldier.itemSizes || {});
  const [measurements, setMeasurements] = useState<BodyMeasurements>(soldier.measurements || {});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const fetchInv = async () => {
      const inv = await api.getInventory();
      setInventory(inv);
    };
    fetchInv();
  }, []);

  const hasMdSize = Object.values(editedSizes).some(val => val === 'MĐ');

  const saveSizes = async () => {
    setIsSaving(true);
    if (onUpdateUser) {
      // Nếu không còn cỡ MĐ nào, tự động tắt yêu cầu may đo
      const stillHasMd = Object.values(editedSizes).some(val => val === 'MĐ');
      await onUpdateUser({ 
        ...soldier, 
        itemSizes: editedSizes,
        tailoringRequest: stillHasMd ? soldier.tailoringRequest : false
      });
    }
    setIsSaving(false);
    setIsEditingSizes(false);
    alert("Báo cáo: Đã cập nhật cỡ số đăng ký quân trang thành công.");
  };

  const handleRegisterTailoring = async () => {
    if (!measurements.height || !measurements.weight) {
      alert("Báo cáo: Đồng chí vui lòng cập nhật đầy đủ Số đo hình thể trước khi Đăng ký may đo!");
      setShowMeasurementModal(true);
      return;
    }
    
    setIsSaving(true);
    if (onUpdateUser) {
      await onUpdateUser({ ...soldier, tailoringRequest: true });
    }
    setIsSaving(false);
    alert("Báo cáo: Đã gửi yêu cầu may đo tới Ban Quân nhu đơn vị.");
  };

  const saveMeasurements = async () => {
    setIsSaving(true);
    if (onUpdateUser) {
      await onUpdateUser({ 
        ...soldier, 
        measurements: { ...measurements, lastUpdated: new Date().toISOString() } 
      });
    }
    setIsSaving(false);
    setShowMeasurementModal(false);
    alert("Báo cáo: Đã cập nhật số đo hình thể chi tiết.");
  };

  const getSizeOptions = (category: string) => {
    switch (category) {
      case 'QUAN_AO':
        const clothes = [];
        for (let i = 1; i <= 7; i++) {
          clothes.push(`${i}A`, `${i}B`, `${i}C`);
        }
        return [...clothes, 'MĐ'];
      case 'GIAY_DEP':
        const shoes = [];
        for (let i = 35; i <= 46; i++) shoes.push(`${i}`);
        return shoes;
      case 'MU_NON':
        const hats = [];
        for (let i = 52; i <= 62; i++) hats.push(`${i}`);
        return hats;
      default:
        return ['Tự do'];
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-500 pb-10">
      <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="bg-white rounded-[40px] border shadow-xl overflow-hidden h-fit">
          <div className="bg-[#1a2f12] h-32 md:h-48 relative">
             <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          </div>
          <div className="px-8 pb-8 -mt-16 md:-mt-24 text-center relative z-10">
            <div className="inline-block relative mb-6">
              <img src={`https://picsum.photos/seed/${soldier.serviceId}/400/400`} className="w-32 h-32 md:w-48 md:h-48 rounded-[48px] border-[8px] border-white shadow-2xl object-cover" />
              <div className="absolute -bottom-2 -right-2 bg-yellow-500 text-emerald-950 rounded-2xl p-3 shadow-xl border-4 border-white"><Shield size={24} /></div>
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{soldier.fullName}</h3>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{soldier.rank} • SH: {soldier.serviceId}</p>
            
            <div className="mt-8 space-y-3">
              <button onClick={() => setShowMeasurementModal(true)} className="w-full py-4 bg-emerald-50 text-emerald-900 border-2 border-emerald-100 rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-3 hover:bg-emerald-100 transition-all">
                 <Scissors size={18} /> Cập nhật số đo hình thể
              </button>
              <button className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                 <Lock size={16} /> Đổi mật khẩu đăng nhập
              </button>
            </div>
          </div>
        </div>

        {/* Sizes & Data Column */}
        <div className="lg:col-span-2 space-y-6">
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Identification */}
              <div className="bg-[#0c1808] rounded-[48px] text-white p-10 flex flex-col items-center justify-center text-center shadow-2xl">
                 <div className="bg-white p-4 rounded-[32px] mb-6 shadow-2xl">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${soldier.serviceId}`} className="w-40 h-40" />
                 </div>
                 <span className="text-[10px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-1">Mã định danh quân nhân</span>
                 <p className="text-3xl font-mono font-black">{soldier.serviceId}</p>
              </div>

              {/* Size Registration Form */}
              <div className="bg-white rounded-[48px] border shadow-xl p-8 flex flex-col">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                       <div className="p-3 bg-emerald-50 rounded-2xl text-emerald-900"><Ruler size={24} /></div>
                       <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest">Cỡ số đăng ký gốc</h4>
                    </div>
                    <button onClick={() => setIsEditingSizes(!isEditingSizes)} className={`text-[9px] font-black px-4 py-2 rounded-xl uppercase border-2 transition-all ${isEditingSizes ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                       {isEditingSizes ? 'Hủy bỏ' : 'Chỉnh sửa'}
                    </button>
                 </div>

                 <div className="flex-1 space-y-3 overflow-y-auto max-h-[350px] pr-2 custom-scrollbar">
                    {inventory.map(item => (
                       <div key={item.id} className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl">
                          <span className="text-[10px] font-black text-slate-700 uppercase leading-tight max-w-[150px]">{item.name}</span>
                          {isEditingSizes ? (
                             <select 
                               value={editedSizes[item.id] || ''} 
                               onChange={(e) => setEditedSizes({...editedSizes, [item.id]: e.target.value})}
                               className="text-[11px] font-black border-2 rounded-xl px-3 py-1.5 bg-white outline-none focus:border-emerald-600"
                             >
                                <option value="">Chọn</option>
                                {getSizeOptions(item.category).map(o => <option key={o} value={o}>{o}</option>)}
                             </select>
                          ) : (
                             <span className={`font-black text-sm px-4 py-1.5 rounded-xl border ${soldier.itemSizes[item.id] === 'MĐ' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-white text-emerald-950 border-slate-100 shadow-sm'}`}>
                                {soldier.itemSizes[item.id] || '-'}
                             </span>
                          )}
                       </div>
                    ))}
                 </div>

                 {isEditingSizes ? (
                   <button onClick={saveSizes} disabled={isSaving} className="w-full py-5 bg-emerald-950 text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest mt-6 shadow-2xl active:scale-95 transition-all">
                      {isSaving ? 'Đang đồng bộ...' : 'Lưu cỡ số cá nhân'}
                   </button>
                 ) : hasMdSize && !soldier.tailoringRequest && (
                   <button onClick={handleRegisterTailoring} className="w-full py-5 bg-red-600 text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest mt-6 shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-3 animate-bounce">
                      <Scissors size={20} /> Đăng ký may đo hồ sơ MĐ
                   </button>
                 )}
                 
                 {soldier.tailoringRequest && !isEditingSizes && (
                    <div className="mt-6 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center gap-3">
                       <BadgeCheck size={20} className="text-emerald-600" />
                       <p className="text-[9px] font-black text-emerald-800 uppercase">Đã gửi yêu cầu may đo</p>
                    </div>
                 )}
              </div>
           </div>

           {/* Stats Summary */}
           <div className="bg-white rounded-[48px] border shadow-xl p-10 flex flex-col md:flex-row items-center gap-10">
              <div className="w-24 h-24 bg-emerald-50 rounded-[32px] flex items-center justify-center text-emerald-900 border border-emerald-100 shrink-0">
                 <BadgeCheck size={48} />
              </div>
              <div className="space-y-4">
                 <h4 className="text-xl font-black text-slate-900 uppercase tracking-tight">Trạng thái hồ sơ quân trang</h4>
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                    <div><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Cỡ số đã đk</p><p className="text-xl font-black text-emerald-900">{Object.keys(soldier.itemSizes).length} / {inventory.length}</p></div>
                    <div><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Yêu cầu may đo</p><p className={`text-xl font-black ${soldier.tailoringRequest ? 'text-red-600' : 'text-slate-300'}`}>{soldier.tailoringRequest ? 'CÓ' : 'KHÔNG'}</p></div>
                    <div><p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-1">Số đo hình thể</p><p className="text-xl font-black text-emerald-900">{measurements.lastUpdated ? 'ĐÃ CẬP NHẬT' : 'CHƯA CÓ'}</p></div>
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Modal Cập nhật Số đo Hình thể */}
      {showMeasurementModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-emerald-950/80 backdrop-blur-md">
           <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-300">
              <div className="p-8 bg-emerald-950 text-white flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-500 text-emerald-950 rounded-2xl shadow-xl"><Scissors size={24} /></div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Chỉ số đo hình thể chi tiết</h3>
                 </div>
                 <button onClick={() => setShowMeasurementModal(false)} className="p-2 hover:bg-white/10 rounded-full transition-all"><X size={28} /></button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-10 space-y-10 bg-slate-50">
                 <div className="bg-white p-8 rounded-[32px] border shadow-sm space-y-8">
                    <div className="flex items-center gap-3 border-b pb-4">
                       <Ruler size={20} className="text-emerald-900" />
                       <h5 className="font-black text-slate-900 uppercase text-xs tracking-widest">Kê khai thông số (cm)</h5>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                       {[
                         { id: 'height', label: 'Chiều cao (cm)' },
                         { id: 'weight', label: 'Cân nặng (kg)' },
                         { id: 'neck', label: 'Vòng cổ' },
                         { id: 'chest', label: 'Vòng ngực' },
                         { id: 'waist', label: 'Vòng bụng' },
                         { id: 'shoulder', label: 'Rộng vai' },
                         { id: 'armLength', label: 'Dài tay' },
                         { id: 'pantsLength', label: 'Dài quần' },
                         { id: 'hip', label: 'Vòng mông' }
                       ].map(field => (
                         <div key={field.id} className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">{field.label}</label>
                            <input 
                              type="number" 
                              value={(measurements as any)[field.id] || ''} 
                              onChange={(e) => setMeasurements({ ...measurements, [field.id]: parseFloat(e.target.value) || 0 })} 
                              className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-base font-black text-emerald-950 focus:border-emerald-600 outline-none transition-all" 
                              placeholder="--" 
                            />
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="bg-emerald-50 p-6 rounded-[24px] border border-emerald-100 flex items-start gap-4">
                    <div className="p-2 bg-emerald-900 text-white rounded-xl shadow-lg shadow-emerald-900/20"><BadgeCheck size={20} /></div>
                    <p className="text-[11px] font-bold text-emerald-800 uppercase leading-relaxed italic">
                       Các thông số này sẽ giúp Ban Quân nhu lập lệnh sản xuất/may đo chính xác nhất cho đồng chí trong trường hợp không có cỡ số chuẩn.
                    </p>
                 </div>
              </div>

              <div className="p-8 bg-white border-t flex gap-4 shrink-0 shadow-2xl">
                 <button onClick={() => setShowMeasurementModal(false)} className="flex-1 py-5 bg-slate-100 rounded-[24px] text-[11px] font-black uppercase text-slate-500">Đóng</button>
                 <button 
                  onClick={saveMeasurements}
                  disabled={isSaving}
                  className="flex-[2] py-5 bg-emerald-950 text-white rounded-[24px] text-[11px] font-black uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"
                 >
                   <SaveAll size={20} className="text-yellow-500" /> {isSaving ? 'Đang lưu...' : 'Lưu & Đồng bộ thông số'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default PersonalLedger;
