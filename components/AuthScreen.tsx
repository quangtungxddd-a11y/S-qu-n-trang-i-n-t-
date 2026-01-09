
import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  User, 
  LogIn, 
  UserPlus, 
  ArrowRight, 
  ShieldAlert, 
  Check,
  Info,
  BookOpen,
  X,
  Scale,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Shield,
  Printer,
  FileText,
  FileSearch,
  ScrollText,
  KeyRound,
  ShieldQuestion,
  LifeBuoy,
  Send,
  Wifi,
  HelpCircle,
  Settings2,
  RefreshCw,
  Zap
} from 'lucide-react';
import RegistrationForm from './RegistrationForm';
import UserGuide from './UserGuide';
import { Soldier, UserRole } from '../types';
import { api } from '../services/apiService';

interface AuthScreenProps {
  onLoginSuccess: (user: Soldier) => void;
}

interface LegalDoc {
  id: string;
  title: string;
  subject: string;
  summary: string;
  fullContent?: string;
}

const LEGAL_BASIS: LegalDoc[] = [
  {
    id: 'nd76',
    title: 'Nghị định 76/2016/NĐ-CP',
    subject: 'Tiêu chuẩn vật chất hậu cần (MẬT)',
    summary: 'Quy định chi tiết về tiêu chuẩn ăn, mặc, ở, thuốc men, vệ sinh và định mức sử dụng điện năng cho quân nhân tại ngũ.',
    fullContent: `...`
  },
  {
    id: 'tt38',
    title: 'Thông tư 38/2017/TT-BQP',
    subject: 'Tiêu chuẩn quân trang & nhu yếu phẩm',
    summary: 'Quy định tiêu chuẩn quân trang của quân nhân, DBĐV và tiêu chuẩn nhu yếu phẩm của người nuôi quân.',
    fullContent: `...`
  }
];

const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [showInfo, setShowInfo] = useState(false);
  const [showForgotPass, setShowForgotPass] = useState(false);
  const [showLanConfig, setShowLanConfig] = useState(false);
  const [showUserGuide, setShowUserGuide] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<LegalDoc | null>(null);
  const [serviceId, setServiceId] = useState('');
  const [password, setPassword] = useState(''); 
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');

  const [lanIp, setLanIp] = useState(localStorage.getItem('lan_server_ip') || '');
  const [isOnline, setIsOnline] = useState(false);

  const [forgotServiceId, setForgotServiceId] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    const checkConn = async () => {
      const status = await api.checkConnection();
      setIsOnline(status);
    };
    checkConn();
    const interval = setInterval(checkConn, 10000);

    const rememberedId = localStorage.getItem('remembered_service_id');
    if (rememberedId) {
      setServiceId(rememberedId);
      setRememberMe(true);
    }
    return () => clearInterval(interval);
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    let foundUser: Soldier | null = null;
    
    const allUsers = JSON.parse(localStorage.getItem('all_soldiers_db') || '[]');
    
    if (serviceId === '20150912' && password === '123456') {
      foundUser = {
        id: 's1',
        fullName: 'Nguyễn Văn Hùng',
        birthDate: '1992-05-15',
        enlistmentYear: '2015',
        rank: 'Thượng úy',
        position: 'Trợ lý Quân nhu',
        unitLevel: 'Đại đội',
        unitName: 'Đại đội 1',
        unitDetail: { daiDoi: 'Đại đội 1', tieuDoan: 'Tiểu đoàn 1' },
        serviceId: '20150912',
        joinDate: '2015-09-01',
        phone: '0987654321',
        role: UserRole.SUPPLY_OFFICER,
        qrCode: 'QR_20150912',
        registrationDate: '2023-01-01',
        itemSizes: { 'tx2': '4', 'dc1': '4', 'lp1': '4', 'dc3': '41', 'lp3': '41' },
        sizes: { hat: '57', shirt: '4', pants: '4', shoes: '41' }
      } as any;
    } else {
      foundUser = allUsers.find((u: Soldier) => 
        u.serviceId === serviceId && 
        (u.password === password || (!u.password && password === '123456'))
      );
    }

    if (foundUser) {
      if (rememberMe) localStorage.setItem('remembered_service_id', serviceId);
      else localStorage.removeItem('remembered_service_id');
      onLoginSuccess(foundUser);
    } else {
      setError('Số hiệu quân nhân hoặc mật khẩu không chính xác!');
    }
  };

  const handleSaveLanConfig = () => {
    localStorage.setItem('lan_server_ip', lanIp.trim());
    alert("Báo cáo: Đã cập nhật cấu hình mạng nội bộ. Hệ thống sẽ khởi động lại.");
    window.location.reload(); 
  };

  const handleRequestPasswordReset = () => {
    if (!forgotServiceId.trim()) return;
    const allUsers = JSON.parse(localStorage.getItem('all_soldiers_db') || '[]');
    const userIndex = allUsers.findIndex((u: Soldier) => u.serviceId === forgotServiceId);
    if (userIndex !== -1) {
      allUsers[userIndex].passwordResetRequested = true;
      localStorage.setItem('all_soldiers_db', JSON.stringify(allUsers));
      setResetSuccess(true);
    } else {
      alert("Không tìm thấy quân nhân có số hiệu này trong hệ thống!");
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1a0a] flex items-center justify-center p-4 relative overflow-hidden">
      <style>{`
        .a4-page {
          font-family: 'Times New Roman', Times, serif;
          background-color: #ffffff !important;
          color: #000000 !important;
        }
        @media print {
          .no-print { display: none !important; }
        }
      `}</style>

      {/* Top Right Actions - NEW: LAN Config & User Guide */}
      <div className="fixed top-6 right-6 z-[50] flex items-center gap-3">
        <button 
          onClick={() => setShowUserGuide(true)}
          className="px-4 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all"
        >
          <HelpCircle size={16} className="text-yellow-400" /> Hướng dẫn SD
        </button>
        <button 
          onClick={() => setShowLanConfig(true)}
          className={`px-4 py-2.5 backdrop-blur-md border rounded-2xl text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${isOnline ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-red-500/20 border-red-500/30'}`}
        >
          <Wifi size={16} className={isOnline ? 'text-emerald-400' : 'text-red-400'} /> 
          {isOnline ? 'LAN ONLINE' : 'CẤU HÌNH LAN'}
        </button>
      </div>

      {/* Background decoration */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-yellow-500 rounded-full blur-[120px]"></div>
      </div>

      <div className={`w-full ${isLoginMode ? 'max-w-5xl' : 'max-w-7xl'} grid grid-cols-1 ${isLoginMode ? 'lg:grid-cols-2' : ''} bg-white rounded-[40px] shadow-2xl overflow-hidden relative z-10 border border-emerald-900/20 transition-all duration-500`}>
        {isLoginMode && (
          <div className="hidden lg:flex flex-col justify-between bg-emerald-900 p-12 text-white relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-14 h-14 bg-yellow-500 rounded-2xl flex items-center justify-center text-emerald-950 font-black shadow-lg border-2 border-yellow-300 transform rotate-3">QT</div>
                <h1 className="text-2xl font-black uppercase tracking-tighter leading-tight">Sổ Quân Trang <br/> <span className="text-yellow-400">Điện Tử</span></h1>
              </div>
              <h2 className="text-4xl font-black leading-tight mb-6">Nền tảng Hậu cần <br/> Số hóa Toàn quân</h2>
              <p className="text-emerald-200 text-sm leading-relaxed max-w-xs">Hỗ trợ tra cứu tiêu chuẩn định mức và quản lý cấp phát quân trang chuẩn xác theo quy định của BQP.</p>
              
              <button 
                onClick={() => setShowInfo(true)}
                className="mt-10 flex items-center gap-3 bg-white/10 hover:bg-white/20 px-6 py-4 rounded-2xl border border-white/10 transition-all group"
              >
                <BookOpen className="text-yellow-400" />
                <div className="text-left">
                  <p className="text-[10px] font-black uppercase tracking-widest text-emerald-300">Tra cứu tiêu chuẩn</p>
                  <p className="text-xs font-black uppercase text-white">Văn bản & Quy chuẩn</p>
                </div>
                <ChevronRight className="ml-auto group-hover:translate-x-1 transition-transform" size={16} />
              </button>
            </div>

            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3 text-xs font-bold text-emerald-300 uppercase tracking-widest">
                <ShieldCheck size={16} /> An toàn thông tin quân sự
              </div>
            </div>
          </div>
        )}

        <div className={`p-8 lg:p-12 bg-white flex flex-col justify-center min-h-[600px] ${!isLoginMode ? 'w-full' : ''}`}>
          {isLoginMode ? (
            <div className="animate-in fade-in slide-in-from-right duration-500">
              <div className="mb-10 text-center lg:text-left">
                <h3 className="text-3xl font-black text-slate-800 uppercase mb-2">Đăng nhập</h3>
                <p className="text-slate-500 text-sm font-bold uppercase tracking-widest text-[10px]">Cổng quản lý quân trang điện tử</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-6 max-w-md mx-auto lg:mx-0">
                {error && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 text-red-600 text-xs font-bold animate-pulse">
                    <ShieldAlert size={18} /> {error}
                  </div>
                )}
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-1">Số hiệu quân nhân</label>
                  <div className="relative group">
                    <User size={20} className="absolute left-4 top-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    <input required type="text" value={serviceId} onChange={(e) => setServiceId(e.target.value)} placeholder="Nhập số hiệu của bạn" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none font-mono font-bold text-black" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-1">Mật khẩu xác thực</label>
                  <div className="relative group">
                    <Lock size={20} className="absolute left-4 top-4 text-slate-400 group-focus-within:text-emerald-600 transition-colors" />
                    <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-black" />
                  </div>
                </div>

                <div className="flex items-center justify-between px-1">
                  <label className="flex items-center gap-2 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={rememberMe} 
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-emerald-700 transition-colors">Ghi nhớ thông tin</span>
                  </label>
                  <button 
                    type="button" 
                    onClick={() => { setShowForgotPass(true); setResetSuccess(false); }}
                    className="text-[10px] font-black text-emerald-700 uppercase tracking-widest hover:underline"
                  >
                    Khôi phục mật khẩu?
                  </button>
                </div>

                <button type="submit" className="w-full bg-emerald-900 text-white py-5 rounded-[20px] font-black uppercase tracking-widest shadow-2xl hover:bg-emerald-800 active:scale-95 transition-all flex items-center justify-center gap-3">Xác thực quân nhân <LogIn size={22} /></button>
              </form>

              <div className="mt-10 pt-10 border-t border-slate-100 text-center lg:text-left flex flex-col md:flex-row items-center gap-6">
                 <div>
                    <p className="text-sm text-slate-500 font-medium">Lần đầu tham gia hệ thống?</p>
                    <button onClick={() => setIsLoginMode(false)} className="mt-2 text-[10px] font-black text-emerald-700 uppercase tracking-widest hover:underline flex items-center gap-2 mx-auto lg:mx-0">
                      <UserPlus size={14} /> Đăng ký hồ sơ mới
                    </button>
                 </div>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-left duration-500 w-full">
               <button onClick={() => setIsLoginMode(true)} className="mb-6 p-3 bg-slate-100 hover:bg-slate-200 rounded-2xl transition-colors text-slate-600 flex items-center gap-2 text-xs font-bold">
                 <ChevronLeft size={18} /> Quay lại đăng nhập
               </button>
               <RegistrationForm onSuccess={(user) => { setIsLoginMode(true); setServiceId(user.serviceId); }} />
            </div>
          )}
        </div>
      </div>

      {/* Modal Cấu hình LAN (Tiền đăng nhập) */}
      {showLanConfig && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-emerald-950/90 backdrop-blur-md">
           <div className="bg-[#0c1808] text-white rounded-[40px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                 <div className="flex items-center gap-3">
                    <Wifi size={24} className="text-emerald-400" />
                    <h3 className="text-xl font-black uppercase tracking-tight">Cấu hình LAN SYNC</h3>
                 </div>
                 <button onClick={() => setShowLanConfig(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
              </div>
              <div className="p-10 space-y-8">
                 <div className="space-y-4">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-emerald-400 uppercase tracking-widest px-1">Địa chỉ IP Máy chủ Quân nhu</label>
                       <div className="relative group">
                          <Settings2 className="absolute left-4 top-4 text-emerald-100/30 group-focus-within:text-yellow-500 transition-colors" size={20} />
                          <input 
                            type="text" 
                            value={lanIp} 
                            onChange={(e) => setLanIp(e.target.value)} 
                            placeholder="VD: 192.168.1.5" 
                            className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl font-mono text-white outline-none focus:border-yellow-500 transition-all shadow-inner" 
                          />
                       </div>
                    </div>
                    <div className="bg-white/5 p-5 rounded-2xl border border-white/10 flex items-start gap-4">
                       <Zap size={20} className="text-yellow-500 shrink-0 mt-1" />
                       <p className="text-[10px] text-emerald-100/50 uppercase font-bold italic leading-relaxed">
                          Nhập địa chỉ IP nội bộ của máy chủ Trợ lý quân nhu để đồng bộ dữ liệu toàn đơn vị.
                       </p>
                    </div>
                 </div>
                 <button onClick={handleSaveLanConfig} className="w-full bg-yellow-500 text-emerald-950 py-5 rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
                    <RefreshCw size={18} /> Lưu & Khởi chạy LAN Sync
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Modal Hướng dẫn SD (Tiền đăng nhập) */}
      {showUserGuide && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-emerald-950/90 backdrop-blur-md">
           <div className="bg-white rounded-[40px] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col animate-in zoom-in duration-300">
              <div className="p-8 bg-emerald-950 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-4">
                    <HelpCircle size={24} className="text-yellow-400" />
                    <h3 className="text-xl font-black uppercase tracking-tight">Hướng dẫn triển khai & Sử dụng</h3>
                 </div>
                 <button onClick={() => setShowUserGuide(false)} className="p-2 hover:bg-white/10 rounded-full"><X size={24} /></button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 p-6 md:p-12">
                 <UserGuide />
              </div>
           </div>
        </div>
      )}

      {/* Modal Khôi phục mật khẩu */}
      {showForgotPass && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-emerald-950/90 backdrop-blur-md">
           <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
              <div className="p-8 bg-emerald-900 text-white text-center">
                 <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/20">
                    <ShieldQuestion size={40} className="text-yellow-400" />
                 </div>
                 <h3 className="text-xl font-black uppercase tracking-tight">Khôi phục mật khẩu</h3>
                 <p className="text-emerald-200 text-[10px] font-bold uppercase mt-2">Hệ thống an ninh quân nhu số</p>
              </div>
              <div className="p-8 space-y-6">
                 {!resetSuccess ? (
                    <>
                      <div className="bg-slate-50 p-6 rounded-2xl border-2 border-slate-100 flex items-start gap-4">
                        <LifeBuoy size={24} className="text-emerald-700 shrink-0" />
                        <p className="text-xs text-slate-600 font-medium leading-relaxed">
                          Nhập số hiệu của đồng chí. Hệ thống sẽ gửi yêu cầu khôi phục tới <span className="text-emerald-900 font-black">Ban Quân nhu</span> đơn vị để cấp lại mật khẩu mặc định (123456).
                        </p>
                      </div>
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase px-1">Số hiệu quân nhân của đồng chí</label>
                          <input 
                            type="text" 
                            value={forgotServiceId}
                            onChange={(e) => setForgotServiceId(e.target.value)}
                            placeholder="VD: 20150912" 
                            className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black outline-none focus:border-emerald-600"
                          />
                        </div>
                      </div>
                      <button 
                        onClick={handleRequestPasswordReset}
                        className="w-full bg-emerald-950 text-white py-5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                      >
                        <Send size={16} /> Gửi yêu cầu khôi phục
                      </button>
                    </>
                 ) : (
                    <div className="text-center py-6 space-y-4">
                       <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-200">
                          <Check size={32} />
                       </div>
                       <div className="space-y-2">
                          <h4 className="font-black text-black uppercase">Đã gửi yêu cầu!</h4>
                          <p className="text-xs text-slate-500 leading-relaxed px-4">Đồng chí vui lòng đợi Trợ lý Quân nhu đơn vị phê duyệt. Sau khi được phê duyệt, mật khẩu của đồng chí sẽ là <span className="font-black text-emerald-900 underline">123456</span>.</p>
                       </div>
                       <button onClick={() => setShowForgotPass(false)} className="w-full py-4 bg-slate-100 rounded-xl text-[10px] font-black uppercase">Quay lại</button>
                    </div>
                 )}
              </div>
           </div>
        </div>
      )}

      {/* Document Library Modal */}
      {showInfo && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 md:p-4 bg-emerald-950/90 backdrop-blur-md">
           <div className={`bg-white rounded-[40px] shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col animate-in zoom-in duration-300`}>
              <div className="p-4 md:p-8 bg-emerald-900 text-white flex justify-between items-center shrink-0 no-print">
                 <div className="flex items-center gap-4">
                    {selectedDoc ? (
                       <button onClick={() => setSelectedDoc(null)} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition-all mr-2">
                          <ChevronLeft size={24} />
                       </button>
                    ) : (
                       <div className="p-3 bg-yellow-500 text-emerald-950 rounded-2xl shadow-xl"><Scale size={24} /></div>
                    )}
                    <div>
                       <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight">
                          {selectedDoc ? 'Nội dung chi tiết' : 'Cơ sở dữ liệu pháp quy'}
                       </h3>
                       <p className="text-emerald-300 text-[10px] font-black uppercase tracking-widest mt-1">
                          Quy chuẩn vật chất hậu cần Quân đội
                       </p>
                    </div>
                 </div>
                 <button onClick={() => { setShowInfo(false); setSelectedDoc(null); }} className="p-3 bg-white/10 rounded-full hover:bg-white/20 transition-colors">
                    <X size={20} />
                 </button>
              </div>
              
              <div className="flex-1 overflow-y-auto bg-slate-100 custom-scrollbar">
                 {selectedDoc ? (
                    <div dangerouslySetInnerHTML={{ __html: selectedDoc.fullContent || '' }} />
                 ) : (
                    <div className="p-6 md:p-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                       {LEGAL_BASIS.map(item => (
                         <div key={item.id} onClick={() => setSelectedDoc(item)} className="bg-white p-8 rounded-[32px] border-2 border-slate-200 group hover:border-emerald-600 hover:shadow-2xl transition-all cursor-pointer relative overflow-hidden flex flex-col h-full">
                            <h5 className="font-black text-emerald-900 text-base md:text-lg uppercase leading-tight mb-2">{item.title}</h5>
                            <p className="text-[10px] font-black text-black/60 uppercase tracking-widest mb-4 border-l-4 border-yellow-500 pl-3">{item.subject}</p>
                            <p className="text-xs text-slate-500 leading-relaxed font-medium mb-8 flex-1">{item.summary}</p>
                            <button className="flex items-center gap-2 text-[10px] font-black text-emerald-950 uppercase tracking-widest group-hover:translate-x-3 transition-transform mt-auto">
                               Xem bản điện tử A4 <ArrowRight size={14} />
                            </button>
                         </div>
                       ))}
                    </div>
                 )}
              </div>
              <div className="p-8 bg-white border-t flex justify-center shrink-0 no-print">
                 <button onClick={() => setShowInfo(false)} className="px-12 py-5 bg-emerald-950 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Đóng thư viện</button>
              </div>
           </div>
        </div>
      )}

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-emerald-900/30 font-bold uppercase tracking-[0.3em] whitespace-nowrap">Cục Quân nhu - Tổng cục Hậu cần</div>
    </div>
  );
};

export default AuthScreen;
