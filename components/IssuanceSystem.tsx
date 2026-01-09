
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Camera, 
  QrCode, 
  CheckCircle2, 
  X,
  Package,
  Clock,
  CalendarDays,
  ListFilter,
  PackageCheck,
  PackageSearch,
  FileCheck,
  Search,
  Keyboard,
  UserCheck,
  AlertCircle,
  ChevronDown,
  Printer,
  ShieldAlert,
  RefreshCw,
  Calendar,
  FileText,
  BadgeCheck,
  ArrowRight
} from 'lucide-react';
import jsQR from 'jsqr';
import { EquipmentItem, Soldier, ExportRecord } from '../types';
import { api } from '../services/apiService';

interface IssuanceProps {
  items: EquipmentItem[];
  soldier: Soldier; 
  onInventoryUpdate?: (newInv: EquipmentItem[]) => void;
}

const ISSUANCE_PERIODS = [
  "Quý I", "Quý II", "Quý III", "Quý IV", "Chiến sỹ mới", "Dự bị động viên (DBĐV)", "Cấp phát bổ sung"
];

const CURRENT_YEAR = new Date().getFullYear();
const BUDGET_YEARS = Array.from({ length: 4 }, (_, i) => (CURRENT_YEAR - 2 + i).toString());

const IssuanceSystem: React.FC<IssuanceProps> = ({ items, soldier, onInventoryUpdate }) => {
  const [activeTab, setActiveTab] = useState<'CREATE' | 'MANAGE'>('CREATE');
  const [activeStep, setActiveStep] = useState(1);
  const [identificationMode, setIdentificationMode] = useState<'QR' | 'MANUAL'>('QR');
  
  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualId, setManualId] = useState('');
  const [targetSoldier, setTargetSoldier] = useState<Soldier | null>(null);
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  
  const [issuancePeriod, setIssuancePeriod] = useState(ISSUANCE_PERIODS[0]);
  const [budgetYear, setBudgetYear] = useState(CURRENT_YEAR.toString());

  const [allIssues, setAllIssues] = useState<any[]>([]);
  const [searchTerm, setSearchingTerm] = useState('');
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedIssueToPrint, setSelectedIssueToPrint] = useState<any>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const requestRef = useRef<number>(null);

  const refreshIssues = async () => {
    const data = await api.getIssues();
    setAllIssues(data.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  };

  useEffect(() => {
    refreshIssues();
    const interval = setInterval(refreshIssues, 5000);
    return () => clearInterval(interval);
  }, []);

  const filteredIssues = useMemo(() => {
    return allIssues.filter(i => 
      i.soldierName.toLowerCase().includes(searchTerm.toLowerCase()) || 
      i.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [allIssues, searchTerm]);

  const tick = () => {
    if (videoRef.current?.readyState === videoRef.current?.HAVE_ENOUGH_DATA && canvasRef.current) {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.height = video.videoHeight;
      canvas.width = video.videoWidth;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        if (code) {
          handleSoldierFound(code.data);
          return;
        }
      }
    }
    requestRef.current = requestAnimationFrame(tick);
  };

  const startCamera = async () => {
    setCameraError(null);
    setIsScanning(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        requestRef.current = requestAnimationFrame(tick);
      }
    } catch (err: any) {
      setIsScanning(false);
      setCameraError("Không thể truy cập Camera. Vui lòng kiểm tra quyền.");
    }
  };

  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (requestRef.current) cancelAnimationFrame(requestRef.current);
    setIsScanning(false);
  };

  const handleSoldierFound = async (id: string) => {
    stopCamera();
    const allSoldiers = await api.getSoldiers();
    const found = allSoldiers.find((s: Soldier) => s.serviceId === id || s.qrCode === id);
    if (found) {
      setTargetSoldier(found);
      setActiveStep(2);
    } else {
      alert(`Không tìm thấy quân nhân: ${id}`);
      if (identificationMode === 'QR') startCamera(); 
    }
  };

  const handleConfirmIssuance = async () => {
    if (!targetSoldier) return;

    const voucherId = `PX-${Date.now().toString().slice(-6)}`;
    const issueItems = Object.entries(selectedItems).map(([id, qty]) => {
      const item = items.find(i => i.id === id);
      return { id: item?.id, name: item?.name, unit: item?.unit, quantity: qty, category: item?.category };
    });

    const newIssue = {
      id: voucherId,
      soldierId: targetSoldier.serviceId,
      soldierName: targetSoldier.fullName,
      soldierUnit: targetSoldier.unitName,
      soldierRank: targetSoldier.rank,
      issuerId: soldier.serviceId,
      issuerName: soldier.fullName,
      items: issueItems,
      period: issuancePeriod,
      budgetYear: budgetYear,
      date: new Date().toISOString(),
      status: 'PENDING'
    };
    
    // --- Logic Tự động gỡ trạng thái "Chờ may đo" ---
    if (targetSoldier.tailoringRequest) {
      // Tìm các mặt hàng mà quân nhân đăng ký là MĐ
      const mdItemIds = Object.entries(targetSoldier.itemSizes)
        .filter(([_, val]) => val === 'MĐ')
        .map(([id]) => id);

      // Kiểm tra xem đợt cấp phát này có đủ TẤT CẢ các mặt hàng MĐ đó không
      const issuedIds = Object.keys(selectedItems);
      const isFullMdIssued = mdItemIds.every(id => issuedIds.includes(id) && selectedItems[id] > 0);

      if (isFullMdIssued) {
        const updatedSoldier = { ...targetSoldier, tailoringRequest: false };
        await api.updateSoldier(updatedSoldier);
      }
    }

    const currentIssues = await api.getIssues();
    await api.saveIssues([...currentIssues, newIssue]);
    setActiveStep(3);
  };

  const finalizeIssue = async (issueId: string) => {
    const issues = await api.getIssues();
    const idx = issues.findIndex((i: any) => i.id === issueId);
    if (idx === -1) return;
    
    if (issues[idx].status !== 'ISSUED') {
      alert("Báo cáo: Quân nhân chưa thực hiện Ký nhận điện tử cho phiếu này!");
      return;
    }

    if (!window.confirm("Báo cáo: Đồng chí xác nhận chốt đợt cấp phát này để đưa vào Báo cáo quyết toán năm?")) return;

    issues[idx].status = 'FINALIZED';
    issues[idx].finalizedDate = new Date().toISOString();
    await api.saveIssues(issues);
    refreshIssues();
    alert(`Báo cáo: Đã chốt quyết toán thành công cho phiếu ${issueId}.`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20 animate-in fade-in duration-500">
      <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm max-w-md mx-auto">
        <button onClick={() => setActiveTab('CREATE')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'CREATE' ? 'bg-emerald-900 text-white shadow-md' : 'text-slate-400 hover:text-black'}`}><QrCode size={16} /> Lập đợt cấp phát</button>
        <button onClick={() => setActiveTab('MANAGE')} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${activeTab === 'MANAGE' ? 'bg-emerald-900 text-white shadow-md' : 'text-slate-400 hover:text-black'}`}><ListFilter size={16} /> Quản lý đợt</button>
      </div>

      {activeTab === 'CREATE' ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-10 relative mb-10">
            <div className="absolute top-1/2 left-10 right-10 h-0.5 bg-slate-200 -translate-y-1/2"></div>
            {[1, 2, 3].map(step => (
              <div key={step} className="relative z-10 flex flex-col items-center gap-2">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black transition-all duration-500 ${activeStep >= step ? 'bg-emerald-900 text-white shadow-lg' : 'bg-white border-2 border-slate-200 text-black/20'}`}>
                  {activeStep > step ? <CheckCircle2 size={24} /> : step}
                </div>
                <span className={`text-[10px] font-black uppercase tracking-widest ${activeStep >= step ? 'text-emerald-900' : 'text-black/40'}`}>{step === 1 ? 'Định danh' : step === 2 ? 'Kê khai' : 'Hoàn tất'}</span>
              </div>
            ))}
          </div>

          {activeStep === 1 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-in zoom-in duration-300">
              <div className="bg-white rounded-[40px] border shadow-xl p-10 flex flex-col gap-6">
                <div>
                  <h3 className="text-2xl font-black text-black uppercase tracking-tight">Định danh quân nhân</h3>
                  <p className="text-black/60 text-xs mt-1 font-bold uppercase tracking-widest">Quét mã QR hoặc nhập số hiệu</p>
                </div>
                <div className="flex p-1 bg-slate-100 rounded-2xl border">
                   <button onClick={() => { stopCamera(); setIdentificationMode('QR'); }} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${identificationMode === 'QR' ? 'bg-white text-black shadow-sm' : 'text-slate-400'}`}><Camera size={16} /> Quét QR</button>
                   <button onClick={() => { stopCamera(); setIdentificationMode('MANUAL'); }} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${identificationMode === 'MANUAL' ? 'bg-white text-black shadow-sm' : 'text-slate-400'}`}><Keyboard size={16} /> Số hiệu</button>
                </div>
                {identificationMode === 'QR' ? (
                  <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">
                    <div className="w-20 h-20 bg-emerald-50 rounded-3xl flex items-center justify-center text-emerald-900 border-2 border-emerald-100 shadow-inner"><QrCode size={36} /></div>
                    {cameraError ? (
                      <div className="p-4 bg-red-50 rounded-2xl border border-red-100 flex flex-col items-center gap-2">
                        <ShieldAlert size={20} className="text-red-600" />
                        <p className="text-[9px] font-black text-red-700 uppercase">{cameraError}</p>
                        <button onClick={startCamera} className="text-[9px] font-black uppercase text-emerald-900 underline flex items-center gap-1"><RefreshCw size={12}/> Thử lại</button>
                      </div>
                    ) : !isScanning ? (
                      <button onClick={startCamera} className="w-full bg-emerald-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] shadow-xl shadow-emerald-900/10 active:scale-95 transition-all">Kích hoạt Camera</button>
                    ) : (
                      <p className="text-[10px] font-black text-emerald-900 uppercase animate-pulse">Đang chờ quét tín hiệu...</p>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col justify-center space-y-6">
                    <input type="text" value={manualId} onChange={(e) => setManualId(e.target.value.toUpperCase())} placeholder="Số hiệu..." className="w-full px-5 py-5 bg-slate-50 border-2 border-slate-100 rounded-2xl text-base font-black text-black outline-none focus:border-emerald-900 shadow-inner" />
                    <button onClick={() => handleSoldierFound(manualId)} className="w-full bg-emerald-900 text-white py-5 rounded-2xl font-black uppercase text-[10px] shadow-xl shadow-emerald-900/10 active:scale-95 transition-all">Truy xuất hồ sơ</button>
                  </div>
                )}
              </div>
              <div className="bg-black rounded-[40px] shadow-2xl overflow-hidden relative min-h-[400px] border-4 border-white flex items-center justify-center">
                {isScanning && <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />}
                {!isScanning && (
                   <div className="text-center space-y-4 opacity-10">
                      <QrCode size={120} className="mx-auto text-white" />
                      <p className="text-white font-black uppercase tracking-[0.5em]">Camera Offline</p>
                   </div>
                )}
                {isScanning && <div className="absolute inset-0 border-2 border-emerald-500/50 m-20 rounded-[40px] pointer-events-none animate-pulse"></div>}
                <canvas ref={canvasRef} className="hidden" />
              </div>
            </div>
          )}

          {activeStep === 2 && targetSoldier && (
            <div className="bg-white rounded-[40px] border shadow-2xl overflow-hidden animate-in slide-in-from-right duration-500">
               <div className="p-10 md:p-12 bg-[#1a2f12] text-white flex flex-col md:flex-row justify-between items-center gap-8 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500 rounded-full blur-[100px] opacity-10"></div>
                  <div className="flex items-center gap-8 relative z-10">
                    <img src={`https://picsum.photos/seed/${targetSoldier.serviceId}/200/200`} className="w-24 h-24 md:w-32 md:h-32 rounded-[32px] border-4 border-emerald-700 shadow-2xl object-cover" />
                    <div>
                      <h4 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-none">{targetSoldier.fullName}</h4>
                      <p className="text-xs font-bold text-emerald-400 uppercase mt-3 tracking-[0.3em] flex items-center gap-2">
                        <BadgeCheck size={16} /> {targetSoldier.rank} • SH: {targetSoldier.serviceId}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 relative z-10">
                    {[{l:'Mũ', v:targetSoldier.sizes.hat}, {l:'Áo', v:targetSoldier.sizes.shirt}, {l:'Giày', v:targetSoldier.sizes.shoes}].map((s,i) => (
                      <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/10 text-center min-w-[80px] shadow-inner backdrop-blur-sm">
                        <p className="text-[8px] font-black text-emerald-300 uppercase tracking-widest">{s.l}</p>
                        <p className="text-xl font-black mt-1">{s.v}</p>
                      </div>
                    ))}
                  </div>
               </div>
               
               <div className="p-8 md:p-12 space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Kỳ cấp phát *</label>
                        <div className="relative">
                          <select value={issuancePeriod} onChange={e=>setIssuancePeriod(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black uppercase text-xs outline-none focus:border-emerald-900 appearance-none">
                             {ISSUANCE_PERIODS.map(p => <option key={p} value={p}>{p}</option>)}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={20} />
                        </div>
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Năm ngân sách *</label>
                        <div className="relative">
                          <select value={budgetYear} onChange={e=>setBudgetYear(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black uppercase text-xs outline-none focus:border-emerald-900 appearance-none">
                             {BUDGET_YEARS.map(y => <option key={y} value={y}>{y}</option>)}
                          </select>
                          <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={20} />
                        </div>
                     </div>
                  </div>

                  <div className="space-y-4">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Danh mục vật chất cấp phát</h4>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {items.map(item => (
                          <div key={item.id} className={`p-5 rounded-[32px] border-2 flex items-center justify-between gap-4 transition-all active:scale-[0.98] ${selectedItems[item.id] > 0 ? 'border-emerald-500 bg-emerald-50' : 'bg-white border-slate-100 hover:border-slate-300'}`}>
                             <div className="flex items-center gap-4">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-sm ${selectedItems[item.id] > 0 ? 'bg-emerald-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                   {item.category === 'QUAN_AO' ? '👕' : item.category === 'GIAY_DEP' ? '👞' : '🎓'}
                                </div>
                                <div>
                                   <p className="text-sm font-black text-black uppercase leading-tight">{item.name}</p>
                                   <div className="flex items-center gap-2 mt-1">
                                      <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Kho: {item.stock} {item.unit}</p>
                                      {targetSoldier.itemSizes[item.id] === 'MĐ' && (
                                         <span className="bg-red-50 text-red-600 text-[8px] font-black px-2 py-0.5 rounded-full border border-red-100 uppercase">Hồ sơ MĐ</span>
                                      )}
                                   </div>
                                </div>
                             </div>
                             <div className="flex items-center gap-3 bg-white p-1.5 rounded-2xl border shadow-inner">
                                <button onClick={()=>setSelectedItems(prev => ({...prev, [item.id]: Math.max(0, (prev[item.id]||0)-1)}))} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-400 hover:text-red-600 transition-all">-</button>
                                <span className="w-8 text-center font-black text-base text-emerald-950">{selectedItems[item.id] || 0}</span>
                                <button onClick={()=>setSelectedItems(prev => ({...prev, [item.id]: (prev[item.id]||0)+1}))} className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center font-black text-slate-400 hover:text-emerald-900 transition-all">+</button>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>

                  <div className="flex gap-4 pt-10 border-t border-slate-100">
                    <button onClick={() => {setActiveStep(1); setTargetSoldier(null);}} className="flex-1 py-5 bg-slate-100 rounded-[24px] font-black uppercase text-[10px] text-slate-500 shadow-sm active:scale-95 transition-all">Hủy & Quay lại</button>
                    <button onClick={handleConfirmIssuance} disabled={Object.keys(selectedItems).length === 0} className="flex-[2] bg-emerald-950 text-white py-5 rounded-[24px] font-black uppercase tracking-widest shadow-2xl shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                       Gửi yêu cầu cấp phát <ArrowRight size={20} />
                    </button>
                  </div>
               </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="bg-white rounded-[40px] border shadow-2xl p-16 text-center space-y-8 max-w-2xl mx-auto animate-in zoom-in duration-500">
               <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-100 shadow-inner">
                  <CheckCircle2 size={64} className="animate-in zoom-in duration-700 delay-300" />
               </div>
               <div className="space-y-2">
                  <h3 className="text-3xl font-black uppercase tracking-tight text-emerald-950">Đã gửi yêu cầu</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest leading-relaxed">Quân nhân <span className="text-emerald-900">{targetSoldier?.fullName}</span> sẽ nhận được thông báo ký nhận điện tử trên thiết bị cá nhân của mình.</p>
               </div>
               <button onClick={() => {setActiveStep(1); setActiveTab('MANAGE'); setTargetSoldier(null); setSelectedItems({});}} className="w-full py-6 bg-emerald-950 text-white rounded-[24px] font-black uppercase tracking-widest shadow-xl shadow-emerald-900/10 hover:bg-emerald-900 transition-all">Xác nhận & Quay về quản lý</button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
           <div className="bg-white p-8 rounded-[32px] border shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-4">
                 <div className="p-4 bg-emerald-50 rounded-2xl text-emerald-900 border border-emerald-100 shadow-sm"><ListFilter size={24} /></div>
                 <div>
                    <h3 className="font-black uppercase tracking-tight text-lg">Quản lý cấp phát & Quyết toán</h3>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Theo dõi luồng trạng thái xác nhận tức thì</p>
                 </div>
              </div>
              <div className="relative w-full md:w-96">
                 <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
                 <input type="text" placeholder="Tìm tên quân nhân, số hiệu..." value={searchTerm} onChange={e=>setSearchingTerm(e.target.value)} className="w-full pl-12 pr-4 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl text-[11px] font-black outline-none focus:border-emerald-900 focus:bg-white transition-all shadow-inner" />
              </div>
           </div>

           <div className="grid grid-cols-1 gap-4">
              {filteredIssues.length > 0 ? filteredIssues.map((issue) => (
                <div key={issue.id} className="bg-white rounded-[32px] border shadow-sm overflow-hidden group hover:border-emerald-300 transition-all active:bg-slate-50">
                   <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                      <div className="flex items-center gap-6">
                         <div className={`w-16 h-16 rounded-[24px] flex items-center justify-center transition-all ${issue.status === 'PENDING' ? 'bg-orange-50 text-orange-400' : issue.status === 'ISSUED' ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-600'}`}>
                            {issue.status === 'PENDING' ? <Clock size={28} /> : <BadgeCheck size={28} />}
                         </div>
                         <div>
                            <div className="flex items-center gap-3">
                               <h4 className="font-black text-black uppercase text-lg leading-none">{issue.soldierName}</h4>
                               <span className={`px-4 py-1 rounded-full text-[8px] font-black uppercase border tracking-widest ${
                                 issue.status === 'PENDING' ? 'bg-orange-50 text-orange-600 border-orange-200' : 
                                 issue.status === 'ISSUED' ? 'bg-blue-50 text-blue-600 border-blue-200' : 
                                 'bg-emerald-50 text-emerald-600 border-emerald-200'
                               }`}>
                                 {issue.status === 'PENDING' ? 'Đang chờ ký' : issue.status === 'ISSUED' ? 'Quân nhân đã ký' : 'Đã quyết toán'}
                               </span>
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-3 flex items-center gap-2">
                               <FileText size={12} /> #{issue.id} • {issue.period} • Năm {issue.budgetYear}
                            </p>
                         </div>
                      </div>
                      <div className="flex items-center gap-3 w-full md:w-auto">
                         {issue.status === 'ISSUED' && (
                           <button onClick={() => finalizeIssue(issue.id)} className="flex-1 md:flex-none bg-emerald-950 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Hoàn tất quyết toán</button>
                         )}
                         {(issue.status === 'ISSUED' || issue.status === 'FINALIZED') && (
                           <button 
                            onClick={() => { setSelectedIssueToPrint(issue); setShowPrintModal(true); }}
                            className="p-4 bg-slate-900 text-white rounded-2xl hover:bg-emerald-900 transition-all shadow-xl active:scale-95"
                           >
                            <Printer size={20}/>
                           </button>
                         )}
                      </div>
                   </div>
                </div>
              )) : (
                <div className="text-center py-20 opacity-20 bg-white rounded-[40px] border">
                   <PackageSearch size={64} className="mx-auto" />
                   <p className="text-[10px] font-black uppercase tracking-[0.5em] mt-4">Không tìm thấy dữ liệu</p>
                </div>
              )}
           </div>
        </div>
      )}

      {/* Modal In Phiếu Xuất Kho C31-HD */}
      {showPrintModal && selectedIssueToPrint && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md no-print">
           <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[95vh] flex flex-col overflow-hidden animate-in zoom-in duration-300">
              <div className="p-8 bg-emerald-950 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-4">
                    <FileText size={24} className="text-yellow-500" />
                    <h3 className="text-xl font-black uppercase tracking-tight">Mẫu phiếu C31-HD chuẩn BQP</h3>
                 </div>
                 <button onClick={() => setShowPrintModal(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={28} /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-12 bg-slate-100 custom-scrollbar">
                 <div className="bg-white p-12 shadow-2xl mx-auto w-full max-w-[800px] border font-serif min-h-[1000px] text-black a4-page">
                    <div className="flex justify-between items-start mb-10">
                       <div className="text-center">
                          <p className="font-bold text-xs uppercase">Đơn vị: {selectedIssueToPrint.soldierUnit || 'Sư đoàn 3'}</p>
                          <p className="text-xs uppercase border-b border-black inline-block pb-1">Ban Quân nhu</p>
                       </div>
                       <div className="text-center">
                          <p className="font-bold text-xs">Mẫu số: C31-HD</p>
                          <p className="text-[10px] italic">(Ban hành kèm theo TT số 148/2017/TT-BQP)</p>
                       </div>
                    </div>
                    
                    <div className="text-center mb-10">
                       <h2 className="text-2xl font-black uppercase mb-1">PHIẾU XUẤT KHO</h2>
                       <p className="text-sm font-bold">Số: {selectedIssueToPrint.id}</p>
                       <p className="text-xs italic mt-2">Ngày {new Date(selectedIssueToPrint.date).getDate()} tháng {new Date(selectedIssueToPrint.date).getMonth()+1} năm {new Date(selectedIssueToPrint.date).getFullYear()}</p>
                    </div>

                    <div className="space-y-4 mb-10 text-sm">
                       <p>- Họ tên người nhận hàng: <span className="font-bold uppercase underline">{selectedIssueToPrint.soldierName}</span></p>
                       <p>- Cấp bậc: {selectedIssueToPrint.soldierRank || '---'}</p>
                       <p>- Lý do xuất kho: Cấp phát quân trang {selectedIssueToPrint.period} - Năm {selectedIssueToPrint.budgetYear}</p>
                       <p>- Xuất tại kho: Kho Quân nhu đơn vị</p>
                    </div>

                    <table className="w-full border-collapse border border-black text-xs text-center mb-10">
                       <thead>
                          <tr className="font-bold bg-slate-50">
                             <th className="border border-black p-2 w-10">STT</th>
                             <th className="border border-black p-2 text-left">Tên, nhãn hiệu vật chất quân nhu</th>
                             <th className="border border-black p-2 w-16">Mã số</th>
                             <th className="border border-black p-2 w-16">ĐVT</th>
                             <th className="border border-black p-2 w-20">Số lượng</th>
                             <th className="border border-black p-2">Ghi chú</th>
                          </tr>
                       </thead>
                       <tbody>
                          {selectedIssueToPrint.items.map((it:any, idx:number) => (
                             <tr key={idx}>
                                <td className="border border-black p-2">{idx+1}</td>
                                <td className="border border-black p-2 text-left uppercase font-bold">{it.name}</td>
                                <td className="border border-black p-2">{it.id}</td>
                                <td className="border border-black p-2">{it.unit}</td>
                                <td className="border border-black p-2 font-black">{it.quantity}</td>
                                <td className="border border-black p-2 italic">{selectedIssueToPrint.status === 'FINALIZED' ? 'Đã quyết toán' : 'Đã ký nhận'}</td>
                             </tr>
                          ))}
                       </tbody>
                    </table>

                    <div className="grid grid-cols-4 gap-4 text-[11px] font-bold text-center mt-20">
                       <div className="flex flex-col items-center">
                          <p className="uppercase">Người lập phiếu</p>
                          <p className="font-normal italic mt-1">(Ký, họ tên)</p>
                          <div className="h-24"></div>
                          <p className="uppercase">{selectedIssueToPrint.issuerName}</p>
                       </div>
                       <div>
                          <p className="uppercase">Thủ kho</p>
                          <p className="font-normal italic mt-1">(Ký, họ tên)</p>
                       </div>
                       <div className="flex flex-col items-center">
                          <p className="uppercase">Người nhận hàng</p>
                          <p className="font-normal italic mt-1 text-emerald-700">(Đã ký xác thực số)</p>
                          <div className="h-24 flex items-center justify-center">
                             <BadgeCheck className="text-emerald-600" size={40} />
                          </div>
                          <p className="uppercase">{selectedIssueToPrint.soldierName}</p>
                       </div>
                       <div>
                          <p className="uppercase">Chỉ huy đơn vị</p>
                          <p className="font-normal italic mt-1">(Ký, họ tên)</p>
                       </div>
                    </div>
                 </div>
              </div>
              <div className="p-8 bg-white border-t flex justify-end gap-4 shrink-0 shadow-2xl">
                 <button onClick={() => setShowPrintModal(false)} className="px-10 py-5 bg-slate-100 rounded-[24px] text-[10px] font-black uppercase text-slate-500">Đóng bản xem</button>
                 <button onClick={() => window.print()} className="px-12 py-5 bg-emerald-950 text-white rounded-[24px] text-[10px] font-black uppercase flex items-center gap-3 shadow-xl active:scale-95 transition-all"><Printer size={20} className="text-yellow-500" /> In phiếu C31 chính thức</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default IssuanceSystem;
