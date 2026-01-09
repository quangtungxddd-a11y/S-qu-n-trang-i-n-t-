
import React, { useState } from 'react';
import { 
  UserPlus, 
  Save, 
  CheckCircle, 
  QrCode, 
  User,
  Building2,
  ChevronRight,
  ShieldCheck,
  ChevronDown,
  BadgeCheck,
  ShieldAlert,
  CalendarDays,
  Target,
  AlertCircle,
  X,
  Shield
} from 'lucide-react';
import { UserRole, Soldier, UnitInfo, PersonnelType } from '../types';
import { RANKS } from '../constants';

interface RegistrationFormProps {
  onSuccess: (data: Soldier) => void;
}

const RegistrationForm: React.FC<RegistrationFormProps> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    fullName: '',
    birthDate: '',
    enlistmentYear: new Date().getFullYear().toString(),
    rank: RANKS[0],
    personnelType: PersonnelType.CHIEN_SY,
    position: '',
    serviceId: '',
    password: '',
    phone: '',
    role: UserRole.SOLDIER // Mặc định là quân nhân
  });

  const [unitDetail, setUnitDetail] = useState<UnitInfo>({
    tieuDoi: '',
    trungDoi: '',
    daiDoi: '',
    tieuDoan: '',
    trungDoan: '',
    suDoan: '',
    quanBinhChung: '',
    vanPhongBQP: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [registeredData, setRegisteredData] = useState<Soldier | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleUnitChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUnitDetail(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const allUsers = JSON.parse(localStorage.getItem('all_soldiers_db') || '[]');
    const isDuplicate = allUsers.some((u: Soldier) => u.serviceId === formData.serviceId.trim());
    
    if (isDuplicate) {
      setTimeout(() => {
        setError(`Số hiệu quân nhân "${formData.serviceId}" đã tồn tại trên hệ thống!`);
        setIsSubmitting(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 500);
      return;
    }

    setTimeout(() => {
      let primaryUnitName = '';
      let primaryUnitLevel = '';
      
      const levels = [
        { key: 'tieuDoi', label: 'Tiểu đội' },
        { key: 'trungDoi', label: 'Trung đội' },
        { key: 'daiDoi', label: 'Đại đội (and tương đương)' },
        { key: 'tieuDoan', label: 'Tiểu đoàn (and tương đương)' },
        { key: 'trungDoan', label: 'Trung đoàn (and tương đương)' },
        { key: 'suDoan', label: 'Sư đoàn (and tương đương)' },
        { key: 'quanBinhChung', label: 'Quân (binh) chủng và tương đương' },
        { key: 'vanPhongBQP', label: 'Bộ Quốc Phòng' }
      ];

      for (const level of levels) {
        const val = unitDetail[level.key as keyof UnitInfo];
        if (val && val.trim() !== '') {
          primaryUnitName = val;
          primaryUnitLevel = level.label;
          break;
        }
      }

      const newSoldier: Soldier = {
        ...formData,
        serviceId: formData.serviceId.trim(),
        id: 'S' + Math.random().toString(36).substr(2, 9).toUpperCase(),
        registrationDate: new Date().toISOString(),
        joinDate: `${formData.enlistmentYear}-09-01`,
        unitLevel: primaryUnitLevel || 'Chưa xác định',
        unitName: primaryUnitName || 'Chưa xác định',
        unitDetail: { ...unitDetail },
        itemSizes: {},
        qrCode: formData.serviceId.trim(), 
        sizes: { 
          hat: '-',
          shirt: '-',
          pants: '-',
          shoes: '-'
        }
      } as Soldier;

      const updatedUsers = [...allUsers, newSoldier];
      localStorage.setItem('all_soldiers_db', JSON.stringify(updatedUsers));
      localStorage.setItem('local_soldiers_cache', JSON.stringify(updatedUsers));

      setRegisteredData(newSoldier);
      setIsSubmitting(false);
      setShowSuccessModal(true);
    }, 1200);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 md:space-y-6 font-sans">
      <div className="flex items-center justify-between bg-white p-4 md:p-8 rounded-[24px] md:rounded-[40px] border shadow-sm">
        <div className="flex items-center gap-3 md:gap-5">
          <div className="p-3 bg-emerald-900 text-yellow-500 rounded-2xl shadow-lg">
            <UserPlus size={24} className="md:w-8 md:h-8" />
          </div>
          <div>
            <h3 className="text-sm md:text-3xl font-black text-black uppercase tracking-tight leading-tight">Đăng ký Hồ sơ điện tử</h3>
            <p className="text-black/40 text-[8px] md:text-[11px] mt-1 uppercase font-black tracking-widest">Hệ thống Quân nhu QĐNDVN</p>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border-2 border-red-200 p-4 rounded-[24px] flex items-center gap-4 animate-in slide-in-from-top duration-300">
          <AlertCircle size={20} className="text-red-600" />
          <p className="text-[11px] font-bold text-red-600 uppercase">{error}</p>
          <button onClick={() => setError(null)} className="ml-auto text-red-300 hover:text-red-600"><X size={18} /></button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-5 space-y-6">
          <section className="bg-white p-6 md:p-10 rounded-[32px] border shadow-sm space-y-6 relative overflow-hidden">
            <div className="flex items-center gap-3 text-black border-b pb-4">
              <User size={18} className="text-emerald-900" />
              <h4 className="text-[10px] md:text-[13px] font-black uppercase tracking-[0.2em]">1. Thông tin cá nhân</h4>
            </div>
            
            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-black/40 uppercase px-1">Vai trò hệ thống *</label>
                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1.5 rounded-2xl border-2 border-slate-100">
                  <button 
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: UserRole.SOLDIER }))}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${formData.role === UserRole.SOLDIER ? 'bg-emerald-900 text-white shadow-md' : 'text-slate-400 hover:bg-white'}`}
                  >
                    <User size={14} /> Cá nhân
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, role: UserRole.SUPPLY_OFFICER }))}
                    className={`flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${formData.role === UserRole.SUPPLY_OFFICER ? 'bg-yellow-500 text-emerald-950 shadow-md' : 'text-slate-400 hover:bg-white'}`}
                  >
                    <ShieldCheck size={14} /> Quản lý
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-black/40 uppercase px-1">Họ và tên quân nhân *</label>
                <input required name="fullName" value={formData.fullName} onChange={handleInputChange} placeholder="NGUYỄN VĂN A" className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-black uppercase focus:ring-2 focus:ring-emerald-500 outline-none" />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-black/40 uppercase px-1">Đối tượng *</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: PersonnelType.SY_QUAN, label: 'Sỹ quan' },
                    { id: PersonnelType.QNCN, label: 'QNCN' },
                    { id: PersonnelType.CHIEN_SY, label: 'Chiến sỹ' }
                  ].map(type => (
                    <button 
                      key={type.id}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, personnelType: type.id }))}
                      className={`py-2.5 rounded-xl text-[9px] font-black uppercase border-2 transition-all ${formData.personnelType === type.id ? 'bg-emerald-900 border-emerald-900 text-white' : 'bg-slate-50 border-slate-100 text-slate-400'}`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black/40 uppercase px-1">Số hiệu *</label>
                  <input required name="serviceId" value={formData.serviceId} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-mono font-black" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black/40 uppercase px-1">Mật khẩu *</label>
                  <input required type="password" name="password" value={formData.password} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-black" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black/40 uppercase px-1">Cấp bậc</label>
                  <select name="rank" value={formData.rank} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-black uppercase">
                    {RANKS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-black/40 uppercase px-1">Nhập ngũ</label>
                  <input required type="number" name="enlistmentYear" value={formData.enlistmentYear} onChange={handleInputChange} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl text-sm font-black text-black" />
                </div>
              </div>
            </div>
          </section>
        </div>

        <div className="xl:col-span-7 space-y-6">
          <section className="bg-white p-6 md:p-10 rounded-[32px] border shadow-sm space-y-6 flex flex-col h-full">
            <div className="flex items-center gap-3 text-black border-b pb-4">
              <Building2 size={18} className="text-emerald-900" />
              <h4 className="text-[10px] md:text-[13px] font-black uppercase tracking-[0.2em]">2. Phân cấp đơn vị</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {[
                { label: 'Bộ Quốc Phòng', name: 'vanPhongBQP' },
                { label: 'Quân (binh) chủng', name: 'quanBinhChung' },
                { label: 'Sư đoàn / Lữ đoàn', name: 'suDoan' },
                { label: 'Trung đoàn', name: 'trungDoan' },
                { label: 'Tiểu đoàn', name: 'tieuDoan' },
                { label: 'Đại đội', name: 'daiDoi' },
                { label: 'Trung đội', name: 'trungDoi' },
                { label: 'Tiểu đội', name: 'tieuDoi' },
              ].map((unit) => (
                <div key={unit.name} className="space-y-1">
                  <label className="text-[9px] font-black text-black/60 uppercase ml-1">{unit.label}</label>
                  <input name={unit.name} value={unitDetail[unit.name as keyof UnitInfo] || ''} onChange={handleUnitChange} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[12px] font-black text-black uppercase outline-none focus:border-emerald-500" />
                </div>
              ))}
            </div>

            <div className="bg-slate-50 p-5 rounded-[24px] border border-slate-100 flex items-start gap-4 mt-auto">
              <ShieldAlert size={20} className="text-emerald-700 shrink-0 mt-1" />
              <p className="text-[10px] font-bold text-black/40 uppercase leading-relaxed italic">Hệ thống sẽ tự động xác định Đơn vị quản lý trực tiếp dựa trên cấp nhỏ nhất được khai báo phía trên.</p>
            </div>
          </section>
        </div>

        <div className="xl:col-span-12">
          <button type="submit" disabled={isSubmitting} className="w-full bg-[#1a2f12] text-white py-5 rounded-[32px] font-black uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-800 transition-all flex items-center justify-center gap-4 active:scale-95 disabled:opacity-50 text-[11px] md:text-sm">
            {isSubmitting ? "ĐANG XỬ LÝ DỮ LIỆU..." : <><Save size={24} className="text-yellow-500" /> HOÀN TẤT ĐĂNG KÝ HỒ SƠ</>}
          </button>
        </div>
      </form>

      {showSuccessModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-emerald-950/80 backdrop-blur-md">
          <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
            <div className="bg-[#1a2f12] p-10 text-center text-white">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border-4 border-yellow-500 shadow-2xl">
                <CheckCircle size={40} className="text-emerald-900" />
              </div>
              <h2 className="text-2xl font-black uppercase">Đăng ký thành công</h2>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-2">Vai trò: {registeredData?.role === UserRole.SUPPLY_OFFICER ? 'Quản lý Quân nhu' : 'Quân nhân'}</p>
              <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Đơn vị: {registeredData?.unitName}</p>
            </div>
            <div className="p-10 text-center space-y-6">
              <div className="flex flex-col items-center">
                <div className="bg-slate-50 p-6 rounded-[32px] border-4 border-white shadow-inner mb-2">
                   <div className="bg-white p-2 border border-slate-200">
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${registeredData?.serviceId}`} alt="Soldier QR" />
                   </div>
                </div>
                <p className="text-[10px] font-black text-black/40 uppercase tracking-[0.2em]">QR ĐỊNH DANH SỐ: {registeredData?.serviceId}</p>
              </div>
              <button onClick={() => registeredData && onSuccess(registeredData)} className="w-full bg-[#1a2f12] text-white py-5 rounded-[24px] font-black uppercase tracking-widest shadow-lg active:scale-95 flex items-center justify-center gap-2">VÀO HỆ THỐNG <ChevronRight size={20} className="text-yellow-500" /></button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RegistrationForm;
