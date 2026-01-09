
import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, X, LogOut, Bot, Send, LayoutDashboard, 
  ClipboardList, PackagePlus, Package, Users, QrCode, FilePieChart, SlidersHorizontal,
  HelpCircle, Wifi, WifiOff, RefreshCw, Zap, Settings
} from 'lucide-react';
import { NAV_ITEMS } from './constants';
import { UserRole, Soldier, EquipmentItem } from './types';
import Dashboard from './components/Dashboard';
import ReceptionSystem from './components/ReceptionSystem';
import Inventory from './components/Inventory';
import SoldierManagement from './components/SoldierManagement';
import IssuanceSystem from './components/IssuanceSystem';
import PersonalLedger from './components/PersonalLedger';
import Reports from './components/Reports';
import AuthScreen from './components/AuthScreen';
import SystemSettings from './components/SystemSettings';
import UserGuide from './components/UserGuide';
import { getLogisticsAdvice } from './services/geminiService';
import { api } from './services/apiService';

interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Soldier | null>(null);
  const [activeTab, setActiveTab] = useState('personal');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [inventory, setInventory] = useState<EquipmentItem[]>([]);
  const [isServerOnline, setIsServerOnline] = useState(false);
  const [syncQueueCount, setSyncQueueCount] = useState(0);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const isEffectiveMobile = windowWidth < 768;

  const fetchData = async () => {
    const online = await api.checkConnection();
    setIsServerOnline(online);

    if (online) {
      api.processQueue();
      const serverInv = await api.getInventory();
      setInventory(serverInv);

      const savedSession = localStorage.getItem('current_session');
      if (savedSession) {
        const sessionUser = JSON.parse(savedSession);
        const allSoldiers = await api.getSoldiers();
        const freshUser = allSoldiers.find((s: Soldier) => s.serviceId === sessionUser.serviceId);
        if (freshUser) {
          setCurrentUser(freshUser);
          localStorage.setItem('current_session', JSON.stringify(freshUser));
        }
      }
    }
  };

  useEffect(() => {
    fetchData();
    api.connectWebSocket();

    api.onDataChange(() => {
      fetchData();
    });

    const handleQueueUpdate = (e: any) => setSyncQueueCount(e.detail.count);
    window.addEventListener('sync_queue_updated', handleQueueUpdate);
    
    return () => {
      window.removeEventListener('sync_queue_updated', handleQueueUpdate);
    };
  }, []);

  const handleLogin = (user: Soldier) => {
    setCurrentUser(user);
    localStorage.setItem('current_session', JSON.stringify(user));
    setActiveTab(user.role === UserRole.SOLDIER ? 'personal' : 'dashboard');
    fetchData();
  };

  const handleUpdateUser = async (updatedUser: Soldier) => {
    setCurrentUser(updatedUser);
    localStorage.setItem('current_session', JSON.stringify(updatedUser));
    await api.updateSoldier(updatedUser);
  };

  const updateInventory = async (newInventory: EquipmentItem[]) => {
    setInventory(newInventory);
    await api.updateInventory(newInventory);
  };

  const handleLogout = () => {
    if (window.confirm("Báo cáo: Đồng chí có chắc chắn muốn đăng xuất?")) {
      setCurrentUser(null);
      localStorage.removeItem('current_session');
    }
  };

  const handleAiConsult = async (query: string) => {
    if (!query.trim()) return;
    setChatHistory(prev => [...prev, { role: 'user', text: query }]);
    setIsAiLoading(true);
    const result = await getLogisticsAdvice(query, `Ngữ cảnh: ${currentUser?.fullName}, Kho: ${inventory.length} mục.`);
    setChatHistory(prev => [...prev, { role: 'ai', text: result || 'Lỗi AI.' }]);
    setIsAiLoading(false);
  };

  if (!currentUser) return <AuthScreen onLoginSuccess={handleLogin} />;

  const renderContent = () => {
    const props = { inventory, isMobileView: isEffectiveMobile, onNavigate: setActiveTab };
    switch (activeTab) {
      case 'dashboard': return <Dashboard role={currentUser.role} inventory={inventory} onNavigate={setActiveTab} isMobileView={isEffectiveMobile} />;
      case 'personal': return <PersonalLedger soldier={currentUser} onUpdateUser={handleUpdateUser} {...props} />;
      case 'reception': return <ReceptionSystem soldier={currentUser} onInventoryUpdate={updateInventory} {...props} />;
      case 'inventory': return <Inventory items={inventory} onUpdate={updateInventory} currentUser={currentUser} {...props} />;
      case 'soldiers': return <SoldierManagement isMobileView={isEffectiveMobile} />;
      case 'issuance': return <IssuanceSystem items={inventory} soldier={currentUser} onInventoryUpdate={updateInventory} />;
      case 'reports': return <Reports inventory={inventory} />;
      case 'guide': return <UserGuide />;
      case 'settings': return <SystemSettings {...props} onUpdate={updateInventory} />;
      default: return <PersonalLedger soldier={currentUser} onUpdateUser={handleUpdateUser} {...props} />;
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden select-none font-sans">
      {!isEffectiveMobile && (
        <aside className={`${isSidebarOpen ? 'w-72' : 'w-24'} transition-all duration-500 bg-[#0c1808] text-white flex flex-col z-20 shadow-2xl`}>
          <div className="p-6 flex items-center justify-between border-b border-white/5">
            {isSidebarOpen && (
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-yellow-500 rounded-xl flex items-center justify-center text-emerald-950 font-black border-2 border-yellow-300">QT</div>
                <h1 className="font-black text-xs uppercase tracking-widest">Sổ Quân Trang</h1>
              </div>
            )}
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-white/10 rounded-xl transition-all">
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
          <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto no-scrollbar">
            {NAV_ITEMS.filter(item => item.roles.includes(currentUser?.role || UserRole.SOLDIER)).map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all ${activeTab === item.id ? 'bg-yellow-500 text-emerald-950 font-black shadow-lg' : 'text-emerald-100/40 hover:bg-white/5 hover:text-white'}`}
              >
                {item.icon}
                {isSidebarOpen && <span className="text-[11px] font-black uppercase tracking-widest">{item.label}</span>}
              </button>
            ))}
          </nav>
          <div className="p-6 border-t border-white/5">
            <button onClick={handleLogout} className="flex items-center gap-3 text-[10px] font-black uppercase text-red-400 w-full hover:bg-red-500/10 p-2 rounded-xl transition-all">
              <LogOut size={18} /> {isSidebarOpen && "Đăng xuất"}
            </button>
          </div>
        </aside>
      )}

      <div className="flex-1 flex flex-col relative overflow-hidden">
        <header className="h-16 md:h-20 bg-white/80 backdrop-blur-xl border-b border-slate-100 flex items-center justify-between px-4 md:px-8 z-30 sticky top-0">
          <div className="flex flex-col">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Hệ thống Quân nhu số</h2>
            <h3 className="text-sm md:text-lg font-black text-black uppercase">{NAV_ITEMS.find(n => n.id === activeTab)?.label || 'Trang chủ'}</h3>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            {syncQueueCount > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                <RefreshCw size={12} className="animate-spin" />
                <span className="text-[9px] font-black uppercase">{syncQueueCount} Hàng chờ</span>
              </div>
            )}

            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border shadow-sm ${isServerOnline ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-red-50 border-red-100 text-red-700'}`}>
              <div className={`w-2 h-2 rounded-full ${isServerOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`}></div>
              <span className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                {isServerOnline ? 'LAN' : 'OFF'}
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button onClick={() => setShowAiPanel(!showAiPanel)} className="p-2 md:p-2.5 bg-emerald-950 text-white rounded-xl shadow-lg active:scale-95" title="Trợ lý ảo"><Bot size={18} /></button>
              {currentUser.role !== UserRole.SOLDIER && (
                <button onClick={() => setActiveTab('settings')} className="p-2 md:p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200 transition-all active:scale-95" title="Cấu hình hệ thống"><SlidersHorizontal size={18} /></button>
              )}
              <button onClick={handleLogout} className="p-2 md:p-2.5 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all active:scale-95" title="Đăng xuất"><LogOut size={18} /></button>
            </div>
          </div>
        </header>

        <main className={`flex-1 overflow-y-auto bg-slate-50 p-4 md:p-8 custom-scrollbar ${isEffectiveMobile ? 'pb-24' : ''}`}>
          {renderContent()}
        </main>

        {isEffectiveMobile && (
          <nav className="fixed bottom-0 left-0 right-0 h-20 bg-emerald-950/95 backdrop-blur-xl text-white flex justify-around items-center z-50 border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
            {[
              { id: 'dashboard', icon: <LayoutDashboard size={20} />, roles: ['SUPPLY_OFFICER', 'COMMANDER'], label: 'Tổng' },
              { id: 'personal', icon: <ClipboardList size={20} />, roles: ['SOLDIER', 'SUPPLY_OFFICER', 'COMMANDER'], label: 'Cá nhân' },
              { id: 'reception', icon: <PackagePlus size={20} />, roles: ['SOLDIER', 'SUPPLY_OFFICER', 'COMMANDER'], label: 'Nhận' },
              { id: 'inventory', icon: <Package size={20} />, roles: ['SUPPLY_OFFICER', 'COMMANDER'], label: 'Kho' },
              { id: 'soldiers', icon: <Users size={20} />, roles: ['SUPPLY_OFFICER', 'COMMANDER'], label: 'Quân số' },
            ].filter(item => item.roles.includes(currentUser?.role || UserRole.SOLDIER)).map((item) => (
              <button 
                key={item.id} 
                onClick={() => setActiveTab(item.id)} 
                className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 ${activeTab === item.id ? 'text-yellow-400' : 'text-emerald-100/30'}`}
              >
                {item.icon}
                <span className="text-[8px] font-black uppercase tracking-tighter">{item.label}</span>
              </button>
            ))}
          </nav>
        )}

        {showAiPanel && (
          <div className={`fixed inset-y-0 right-0 h-full bg-white border-l shadow-2xl z-[100] flex flex-col transition-all duration-500 ${isEffectiveMobile ? 'w-full' : 'w-[450px]'}`}>
            <div className="p-6 bg-emerald-950 text-white flex justify-between items-center">
              <h4 className="font-black uppercase tracking-widest text-sm">Trợ lý ảo Quân nhu</h4>
              <button onClick={() => setShowAiPanel(false)}><X size={20} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50">
              {chatHistory.map((msg, i) => (
                <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl text-xs font-bold ${msg.role === 'user' ? 'bg-emerald-900 text-white' : 'bg-white text-slate-800 shadow-sm border'}`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div className="p-6 border-t bg-white">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Hỏi trợ lý ảo..."
                  className="w-full px-5 py-4 bg-slate-100 rounded-2xl text-xs font-black outline-none focus:bg-white focus:ring-2 focus:ring-emerald-900 transition-all"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAiConsult((e.target as HTMLInputElement).value);
                      (e.target as HTMLInputElement).value = '';
                    }
                  }}
                />
                <button className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-emerald-950 text-white rounded-xl"><Send size={16} /></button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
