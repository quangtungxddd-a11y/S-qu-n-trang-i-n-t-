
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Eye, Building2, ChevronRight, X, Scissors, Save, KeyRound, BellRing, Clock,
  FileOutput, ArrowRightLeft, ShieldAlert, ShieldPlus, ChevronDown, Users, RotateCcw,
  BookOpen, Info, BadgeCheck, Tag, Layers, Send, UserPlus, CheckCircle2, MapPin, Ruler, User
} from 'lucide-react';
import { UNIT_LEVELS, Soldier, UnitInfo, BodyMeasurements, UserRole, EquipmentItem, TransferRequest } from '../types';
import { api } from '../services/apiService';

const LEVEL_MAP: Record<string, keyof UnitInfo> = {
  'Tiểu đội': 'tieuDoi',
  'Trung đội': 'trungDoi',
  'Đại đội (and tương đương)': 'daiDoi',
  'Tiểu đoàn (and tương đương)': 'tieuDoan',
  'Trung đoàn (and tương đương)': 'trungDoan',
  'Sư đoàn (and tương đương)': 'suDoan',
  'Quân (binh) chủng và tương đương': 'quanBinhChung',
  'Bộ Quốc Phòng': 'vanPhongBQP'
};

const PERIODS = ["Quý I", "Quý II", "Quý III", "Quý IV", "Chiến sỹ mới", "Bổ sung"];

const SoldierManagement: React.FC<{ isMobileView?: boolean }> = ({ isMobileView }) => {
  const [activeView, setActiveView] = useState<'LIST' | 'TAILORING' | 'CATALOG' | 'RECEPTION'>('LIST');
  const [searchTerm, setSearchTerm] = useState('');
  const [allSoldiers, setAllSoldiers] = useState<Soldier[]>([]);
  const [inventory, setInventory] = useState<EquipmentItem[]>([]);
  const [selectedSoldier, setSelectedSoldier] = useState<Soldier | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [drillPath, setDrillPath] = useState<{level: string, name: string}[]>([]);
  
  // Form điều chuyển
  const [transferForm, setTransferForm] = useState<Partial<TransferRequest>>({
    type: 'INTERNAL',
    lastIssuedPeriod: PERIODS[0],
    nextRequestPeriod: PERIODS[1],
    nextRequestYear: new Date().getFullYear().toString(),
    targetUnit: {}
  });

  const refreshData = async () => {
    const [soldiers, inv] = await Promise.all([
      api.getSoldiers(),
      api.getInventory()
    ]);
    setAllSoldiers(soldiers);
    setInventory(inv);
  };

  useEffect(() => {
    refreshData();
    api.onDataChange(refreshData);
    const session = localStorage.getItem('current_session');
    if (session) {
      const user = JSON.parse(session);
      setDrillPath([{ level: user.unitLevel, name: user.unitName }]);
    }
  }, []);

  // Quân nhân thuộc đơn vị hiện tại quản lý
  const contextSoldiers = useMemo(() => {
    if (drillPath.length === 0) return [];
    return allSoldiers.filter(s => {
      if (s.pendingTransfer?.status === 'PENDING') return false; 
      return drillPath.every(path => {
        const key = LEVEL_MAP[path.level];
        return key ? (s.unitDetail as any)[key] === path.name : true;
      });
    });
  }, [allSoldiers, drillPath]);

  // Quân nhân có yêu cầu may đo
  const tailoringSoldiers = useMemo(() => {
    return contextSoldiers.filter(s => s.tailoringRequest);
  }, [contextSoldiers]);

  // Quân nhân đang chờ tiếp nhận về đơn vị này
  const incomingSoldiers = useMemo(() => {
    if (drillPath.length === 0) return [];
    const currentUnitName = drillPath[drillPath.length - 1].name;
    const currentUnitLevel = drillPath[drillPath.length - 1].level;

    return allSoldiers.filter(s => 
      s.pendingTransfer?.status === 'PENDING' && 
      s.pendingTransfer?.targetUnitName === currentUnitName &&
      s.pendingTransfer?.targetUnitLevel === currentUnitLevel
    );
  }, [allSoldiers, drillPath]);

  const subUnits = useMemo(() => {
    if (drillPath.length === 0) return [];
    const currentLevel = drillPath[drillPath.length - 1].level;
    const currentIdx = UNIT_LEVELS.indexOf(currentLevel as any);
    if (currentIdx <= 0) return [];
    const nextLevel = UNIT_LEVELS[currentIdx - 1];
    const nextLevelKey = LEVEL_MAP[nextLevel];
    if (!nextLevelKey) return [];

    const groups: Record<string, number> = {};
    contextSoldiers.forEach(s => {
      const name = (s.unitDetail as any)[nextLevelKey];
      if (name) groups[name] = (groups[name] || 0) + 1;
    });
    return Object.entries(groups).map(([name, count]) => ({ name, count, level: nextLevel }));
  }, [contextSoldiers, drillPath]);

  const handleTransferSubmit = async () => {
    if (!selectedSoldier) return;
    
    let primaryName = '';
    let primaryLevel = '';
    const levels = [...UNIT_LEVELS];
    for (const level of levels) {
      const val = (transferForm.targetUnit as any)[LEVEL_MAP[level]];
      if (val && val.trim() !== '') {
        primaryName = val;
        primaryLevel = level;
        break;
      }
    }

    const updatedSoldier: Soldier = {
      ...selectedSoldier,
      pendingTransfer: {
        ...transferForm,
        targetUnitName: primaryName,
        targetUnitLevel: primaryLevel,
        requestDate: new Date().toISOString(),
        status: 'PENDING'
      } as TransferRequest
    };

    await api.updateSoldier(updatedSoldier);
    alert(`Báo cáo: Đã lập Giấy giới thiệu quân trang cho đ/c ${selectedSoldier.fullName} tới đơn vị ${primaryName}.`);
    setShowTransferModal(false);
    refreshData();
  };

  const handleAcceptSoldier = async (s: Soldier) => {
    if (!window.confirm(`Xác nhận tiếp nhận đ/c ${s.fullName} vào quân số đơn vị? Dữ liệu quân trang sẽ được đồng bộ ngay lập tức.`)) return;

    const updatedSoldier: Soldier = {
      ...s,
      unitName: s.pendingTransfer!.targetUnitName,
      unitLevel: s.pendingTransfer!.targetUnitLevel,
      unitDetail: { ...s.unitDetail, ...s.pendingTransfer!.targetUnit },
      pendingTransfer: undefined 
    };

    await api.updateSoldier(updatedSoldier);
    alert("Tiếp nhận thành công. Quân nhân đã nằm trong danh sách quản lý chính thức.");
    refreshData();
  };

  const handleResetPassword = async (s: Soldier) => {
    if (!window.confirm(`Báo cáo: Đồng chí có chắc chắn muốn cấp lại mật khẩu mặc định (123456) cho đ/c ${s.fullName}?`)) return;

    const updatedSoldier: Soldier = {
      ...s,
      password: '123456',
      passwordResetRequested: false
    };

    await api.updateSoldier(updatedSoldier);
    alert("Báo cáo: Đã cấp lại mật khẩu mặc định thành công.");
    refreshData();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-10">
      {/* Breadcrumbs */}
      <div className="bg-white p-6 rounded-[32px] border shadow-sm flex items-center justify-between">
        <div className="flex items-center flex-wrap gap-2 text-slate-400">
          <Users size={18} className="mr-2 text-emerald-900" />
          {drillPath.map((path, idx) => (
            <React.Fragment key={idx}>
              <button 
                onClick={() => setDrillPath(prev => prev.slice(0, idx + 1))}
                className={`text-[10px] font-black uppercase transition-all px-3 py-1.5 rounded-lg ${idx === drillPath.length - 1 ? 'bg-emerald-900 text-white shadow-md' : 'hover:bg-slate-100 hover:text-emerald-900'}`}
              >
                {path.name}
              </button>
              {idx < drillPath.length - 1 && <ChevronRight size={14} />}
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-white p-1.5 rounded-2xl border shadow-sm max-w-2xl mx-auto overflow-x-auto no-scrollbar">
        {[
          { id: 'LIST', label: 'Quản lý quân số', icon: <Users size={14} /> },
          { id: 'RECEPTION', label: `Tiếp nhận (${incomingSoldiers.length})`, icon: <UserPlus size={14} />, badge: incomingSoldiers.length > 0 },
          { id: 'TAILORING', label: `Hồ sơ may đo (${tailoringSoldiers.length})`, icon: <Scissors size={14} />, badge: tailoringSoldiers.length > 0 },
          { id: 'CATALOG', label: 'Thư viện vật chất', icon: <BookOpen size={14} /> }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveView(tab.id as any)}
            className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all relative ${activeView === tab.id ? 'bg-emerald-950 text-white shadow-lg' : 'text-slate-400 hover:text-emerald-900'}`}
          >
            {tab.icon} {tab.label}
            {tab.badge && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse border-2 border-white"></span>}
          </button>
        ))}
      </div>

      {activeView === 'LIST' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#1a2f12] p-8 rounded-[40px] text-white shadow-xl relative overflow-hidden col-span-1 md:col-span-2">
              <div className="relative z-10">
                <p className="text-emerald-400 text-[10px] font-black uppercase tracking-widest mb-1">Đang xem dữ liệu tại</p>
                <h2 className="text-3xl font-black uppercase tracking-tight">{drillPath[drillPath.length-1]?.name}</h2>
                <div className="mt-6 flex gap-10">
                  <div><p className="text-[10px] font-black uppercase text-emerald-300 opacity-60">Quân số thực tế</p><p className="text-4xl font-black">{contextSoldiers.length}</p></div>
                  <div><p className="text-[10px] font-black uppercase text-emerald-300 opacity-60">Đơn vị dưới</p><p className="text-4xl font-black text-yellow-500">{subUnits.length}</p></div>
                </div>
              </div>
              <Building2 className="absolute -right-10 -bottom-10 text-white/5 w-64 h-64" />
            </div>
            
            <div className="bg-white p-8 rounded-[40px] border shadow-sm flex flex-col justify-center text-center">
               <div className="w-16 h-16 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-bounce"><ShieldAlert size={28} /></div>
               <h4 className="text-2xl font-black text-black">{allSoldiers.filter(s => s.passwordResetRequested).length}</h4>
               <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mt-1">Yêu cầu cấp lại MK</p>
            </div>
          </div>

          {subUnits.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {subUnits.map((unit, i) => (
                <button 
                  key={i} 
                  onClick={() => setDrillPath(prev => [...prev, { name: unit.name, level: unit.level }])}
                  className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm hover:border-emerald-600 hover:bg-emerald-50 transition-all text-left group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="p-2 bg-slate-50 text-emerald-900 rounded-xl group-hover:bg-emerald-900 group-hover:text-white transition-colors"><Building2 size={20} /></div>
                    <span className="text-xl font-black text-emerald-900">{unit.count}</span>
                  </div>
                  <h4 className="text-[11px] font-black uppercase text-black group-hover:text-emerald-950 truncate">{unit.name}</h4>
                  <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mt-1">{unit.level}</p>
                </button>
              ))}
            </div>
          )}

          <div className="bg-white rounded-[32px] border shadow-sm overflow-hidden">
            <div className="p-6 border-b flex flex-col md:flex-row justify-between gap-4">
               <h3 className="text-sm font-black uppercase text-slate-900">Danh sách quân nhân chủ quản</h3>
               <div className="relative w-full md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" placeholder="Số hiệu, tên..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-12 pr-4 py-3 bg-slate-50 border rounded-xl text-[11px] font-bold outline-none focus:border-emerald-600" />
               </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b">
                    <th className="px-6 py-4">Quân nhân</th>
                    <th className="px-4 py-4 text-center">Chức trách</th>
                    <th className="px-6 py-4 text-right">Tác nghiệp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {contextSoldiers.filter(s => s.fullName.includes(searchTerm) || s.serviceId.includes(searchTerm)).map((s, i) => (
                    <tr key={i} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <img src={`https://picsum.photos/seed/${s.serviceId}/100/100`} className="w-10 h-10 rounded-xl border object-cover shadow-sm" />
                          <div>
                            <p className="text-[11px] font-black text-black uppercase">{s.fullName}</p>
                            <p className="text-[8px] font-bold text-slate-400">SH: {s.serviceId}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-center">
                        <div className="flex justify-center">
                          {s.role === UserRole.SUPPLY_OFFICER ? (
                            <div className="p-2 bg-yellow-100 text-yellow-700 rounded-xl shadow-sm border border-yellow-200" title="Quản lý quân nhu">
                              <ShieldPlus size={20} />
                            </div>
                          ) : (
                            <div className="p-2 bg-slate-100 text-slate-500 rounded-xl border border-slate-200" title="Quân nhân">
                              <User size={20} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1">
                         <button onClick={() => { setSelectedSoldier(s); setShowTransferModal(true); }} title="Giới thiệu điều chuyển" className="p-2 text-slate-400 hover:text-emerald-900"><ArrowRightLeft size={18} /></button>
                         <button onClick={() => handleResetPassword(s)} title="Cấp lại mật khẩu" className="p-2 text-slate-400 hover:text-emerald-950"><RotateCcw size={18} /></button>
                         <button onClick={() => { setSelectedSoldier(s); setShowDetailModal(true); }} className="p-2 text-slate-400 hover:text-emerald-900"><Eye size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeView === 'TAILORING' && (
        <div className="space-y-6 animate-in slide-in-from-right duration-500">
           <div className="bg-white p-8 rounded-[40px] border shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-red-50 text-red-600 rounded-3xl shadow-sm"><Scissors size={32} /></div>
                 <div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Hồ sơ chờ may đo</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Danh sách quân nhân đăng ký cỡ số MĐ (May đo)</p>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tailoringSoldiers.length > 0 ? tailoringSoldiers.map(s => (
                <div key={s.id} className="bg-white p-8 rounded-[40px] border-2 border-red-50 shadow-xl space-y-6 relative overflow-hidden group hover:border-red-200 transition-all">
                   <div className="absolute -top-10 -right-10 opacity-5 group-hover:scale-110 transition-transform"><Scissors size={180} /></div>
                   <div className="flex items-center gap-5 relative z-10">
                      <img src={`https://picsum.photos/seed/${s.serviceId}/200/200`} className="w-16 h-16 rounded-[24px] border-4 border-white shadow-lg object-cover" />
                      <div>
                         <h4 className="text-lg font-black text-slate-900 uppercase leading-tight">{s.fullName}</h4>
                         <p className="text-[9px] font-black text-red-600 uppercase tracking-widest mt-1">{s.rank} • SH: {s.serviceId}</p>
                      </div>
                   </div>

                   <div className="grid grid-cols-3 gap-3 relative z-10">
                      {[
                        { label: 'Cao', val: s.measurements?.height },
                        { label: 'Nặng', val: s.measurements?.weight },
                        { label: 'Vòng ngực', val: s.measurements?.chest },
                        { label: 'Vòng bụng', val: s.measurements?.waist },
                        { label: 'Vòng cổ', val: s.measurements?.neck },
                        { label: 'Dài tay', val: s.measurements?.armLength }
                      ].map((m, i) => (
                        <div key={i} className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-center">
                           <p className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">{m.label}</p>
                           <p className="text-sm font-black text-emerald-900">{m.val || '--'}</p>
                        </div>
                      ))}
                   </div>

                   <div className="bg-red-50 p-4 rounded-2xl border border-red-100 space-y-2 relative z-10">
                      <p className="text-[10px] font-black text-red-800 uppercase flex items-center gap-2"><Tag size={12} /> Mặt hàng cần may đo:</p>
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(s.itemSizes).filter(([_, val]) => val === 'MĐ').map(([id]) => {
                           const item = inventory.find(i => i.id === id);
                           return (
                             <span key={id} className="bg-white px-3 py-1 rounded-full text-[9px] font-black text-red-600 border border-red-200 shadow-sm uppercase">
                                {item?.name || id}
                             </span>
                           );
                        })}
                      </div>
                   </div>

                   <button className="w-full py-4 bg-emerald-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 hover:bg-emerald-900 active:scale-95 transition-all">
                      <FileOutput size={18} className="text-yellow-500" /> Xuất lệnh sản xuất
                   </button>
                </div>
              )) : (
                <div className="bg-white/50 border-2 border-dashed border-slate-200 p-20 rounded-[40px] text-center col-span-full opacity-30">
                   <Ruler size={48} className="mx-auto" />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-4">Hiện không có hồ sơ may đo nào</p>
                </div>
              )}
           </div>
        </div>
      )}

      {activeView === 'RECEPTION' && (
        <div className="space-y-6 animate-in slide-in-from-bottom duration-500">
           <div className="bg-white p-8 rounded-[40px] border shadow-xl flex items-center justify-between">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-emerald-50 text-emerald-900 rounded-3xl"><UserPlus size={32} /></div>
                 <div>
                    <h3 className="text-xl font-black uppercase">Tiếp nhận quân nhân mới</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Dữ liệu hồ sơ quân trang đang chờ xử lý</p>
                 </div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {incomingSoldiers.length > 0 ? incomingSoldiers.map(s => (
                <div key={s.id} className="bg-white p-8 rounded-[40px] border-2 border-emerald-100 shadow-xl flex flex-col gap-6 relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-all"><MapPin size={80} /></div>
                   <div className="flex items-center gap-5">
                      <img src={`https://picsum.photos/seed/${s.serviceId}/200/200`} className="w-16 h-16 rounded-[24px] border-4 border-slate-50 shadow-xl object-cover" />
                      <div>
                         <h4 className="text-lg font-black text-slate-900 uppercase leading-tight">{s.fullName}</h4>
                         <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mt-1">SH: {s.serviceId} • {s.rank}</p>
                      </div>
                   </div>
                   <div className="bg-slate-50 p-5 rounded-3xl space-y-3">
                      <div className="flex justify-between border-b border-slate-200 pb-2">
                         <span className="text-[9px] font-black text-slate-400 uppercase">Đơn vị cũ:</span>
                         <span className="text-[10px] font-black uppercase text-emerald-900">{s.unitName}</span>
                      </div>
                      <div className="flex justify-between border-b border-slate-200 pb-2">
                         <span className="text-[9px] font-black text-slate-400 uppercase">Kỳ quân trang cuối:</span>
                         <span className="text-[10px] font-black uppercase text-emerald-900">{s.pendingTransfer?.lastIssuedPeriod}</span>
                      </div>
                      <div className="flex justify-between">
                         <span className="text-[9px] font-black text-slate-400 uppercase">Đề nghị cấp từ:</span>
                         <span className="text-[10px] font-black uppercase text-yellow-600">{s.pendingTransfer?.nextRequestPeriod} - {s.pendingTransfer?.nextRequestYear}</span>
                      </div>
                   </div>
                   <button onClick={() => handleAcceptSoldier(s)} className="w-full py-4 bg-emerald-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all">
                      <CheckCircle2 size={18} className="text-yellow-500" /> Đồng ý tiếp nhận & Nhập quân số
                   </button>
                </div>
              )) : (
                <div className="bg-white/50 border-2 border-dashed border-slate-200 p-20 rounded-[40px] text-center col-span-full opacity-30">
                   <UserPlus size={48} className="mx-auto" />
                   <p className="text-[10px] font-black uppercase tracking-[0.3em] mt-4">Hiện không có quân nhân chờ tiếp nhận</p>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Modal Giới thiệu quân trang (Transfer Form) */}
      {showTransferModal && selectedSoldier && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-emerald-950/90 backdrop-blur-md">
           <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-300">
              <div className="p-8 bg-emerald-950 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-yellow-500 text-emerald-950 rounded-2xl"><ArrowRightLeft size={24} /></div>
                    <h3 className="text-xl font-black uppercase tracking-tight">Giấy giới thiệu điều chuyển quân trang</h3>
                 </div>
                 <button onClick={() => setShowTransferModal(false)}><X size={28} /></button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50 custom-scrollbar">
                 <div className="bg-white p-8 rounded-[32px] border flex items-center gap-8 shadow-sm">
                    <img src={`https://picsum.photos/seed/${selectedSoldier.serviceId}/200/200`} className="w-20 h-20 rounded-[24px] border-4 border-slate-50 shadow-lg" />
                    <div>
                       <h4 className="text-2xl font-black text-black uppercase leading-tight">{selectedSoldier.fullName}</h4>
                       <p className="text-[10px] font-black text-emerald-700 uppercase tracking-widest mt-1">SH: {selectedSoldier.serviceId} • {selectedSoldier.unitName}</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                       <h5 className="font-black text-slate-400 uppercase text-[9px] tracking-widest border-b pb-2">Thông tin điều chuyển</h5>
                       <div className="space-y-4">
                          <div className="space-y-1">
                             <label className="text-[10px] font-black text-slate-500 uppercase px-1">Loại hình chuyển công tác</label>
                             <select value={transferForm.type} onChange={e => setTransferForm({...transferForm, type: e.target.value as any})} className="w-full px-4 py-3 bg-white border rounded-xl font-black text-xs uppercase">
                                <option value="INTERNAL">Trong Quân (binh) chủng</option>
                                <option value="EXTERNAL">Ngoài Quân (binh) chủng</option>
                             </select>
                          </div>
                          <div className="space-y-1">
                             <label className="text-[10px] font-black text-slate-500 uppercase px-1">Kỳ quân trang đã cấp tại đơn vị</label>
                             <select value={transferForm.lastIssuedPeriod} onChange={e => setTransferForm({...transferForm, lastIssuedPeriod: e.target.value})} className="w-full px-4 py-3 bg-white border rounded-xl font-black text-xs uppercase">
                                {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                             </select>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                             <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase px-1">Đề nghị cấp từ kỳ</label>
                                <select value={transferForm.nextRequestPeriod} onChange={e => setTransferForm({...transferForm, nextRequestPeriod: e.target.value})} className="w-full px-4 py-3 bg-white border rounded-xl font-black text-xs uppercase">
                                   {PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                             </div>
                             <div className="space-y-1">
                                <label className="text-[10px] font-black text-slate-500 uppercase px-1">Từ năm ngân sách</label>
                                <input type="number" value={transferForm.nextRequestYear} onChange={e => setTransferForm({...transferForm, nextRequestYear: e.target.value})} className="w-full px-4 py-3 bg-white border rounded-xl font-black text-xs" />
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="space-y-6">
                       <h5 className="font-black text-slate-400 uppercase text-[9px] tracking-widest border-b pb-2">Đơn vị tiếp nhận mới</h5>
                       <div className="grid grid-cols-1 gap-3">
                          {[
                            { label: 'Quân (binh) chủng', name: 'quanBinhChung' },
                            { label: 'Sư đoàn / Lữ đoàn', name: 'suDoan' },
                            { label: 'Trung đoàn', name: 'trungDoan' },
                            { label: 'Tiểu đoàn', name: 'tieuDoan' },
                            { label: 'Đại đội', name: 'daiDoi' }
                          ].map(u => (
                            <div key={u.name} className="space-y-1">
                               <label className="text-[9px] font-black text-slate-400 uppercase ml-1">{u.label}</label>
                               <input 
                                value={(transferForm.targetUnit as any)[u.name] || ''} 
                                onChange={e => setTransferForm({...transferForm, targetUnit: {...transferForm.targetUnit, [u.name]: e.target.value.toUpperCase()}})}
                                className="w-full px-4 py-2.5 bg-white border rounded-xl text-[11px] font-black uppercase outline-none focus:border-emerald-600" 
                               />
                            </div>
                          ))}
                       </div>
                    </div>
                 </div>
              </div>

              <div className="p-8 bg-white border-t flex gap-4 shrink-0 shadow-2xl">
                 <button onClick={() => setShowTransferModal(false)} className="flex-1 py-4 bg-slate-100 rounded-2xl text-[10px] font-black uppercase text-slate-500">Hủy</button>
                 <button onClick={handleTransferSubmit} className="flex-[2] py-4 bg-emerald-950 text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl flex items-center justify-center gap-3">
                    <Send size={18} className="text-yellow-500" /> Hoàn tất chuyển đơn vị
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SoldierManagement;
