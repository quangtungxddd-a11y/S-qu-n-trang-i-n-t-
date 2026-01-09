
import React, { useState } from 'react';
import { 
  Wifi, 
  Monitor, 
  Smartphone, 
  RefreshCw, 
  ShieldCheck, 
  Terminal, 
  AlertCircle,
  Network,
  Database,
  CloudUpload,
  Code2,
  Server,
  Settings2,
  Copy,
  Check,
  Globe,
  Zap
} from 'lucide-react';

const UserGuide: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'USER' | 'TECH'>('USER');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const userSteps = [
    {
      title: "1. Kết nối WIFI đơn vị",
      icon: <Wifi className="text-blue-600" size={32} />,
      content: "Tất cả điện thoại của quân nhân và máy tính Trợ lý quân nhu phải kết nối chung vào một cục phát WIFI nội bộ.",
      note: "Mạng này không cần có Internet (không cần cắm dây mạng viễn thông)."
    },
    {
      title: "2. Truy cập địa chỉ máy chủ",
      icon: <Globe className="text-emerald-700" size={32} />,
      content: "Mở trình duyệt trên điện thoại (Chrome/Safari), nhập địa chỉ IP của máy chủ do Trợ lý cung cấp kèm cổng 3000.",
      tip: "Ví dụ: http://192.168.1.5:3000"
    },
    {
      title: "3. Cấu hình Đồng bộ LAN LIVE",
      icon: <Zap className="text-yellow-600" size={32} />,
      content: "Sau khi vào giao diện, vào mục 'Cài đặt' -> 'Đồng bộ LAN'. Nhập địa chỉ IP vào ô cấu hình.",
      action: "Nhấn 'Lưu & Kết nối'. Đèn LAN LIVE xanh là thành công."
    },
    {
      title: "4. Trải nghiệm tức thì",
      icon: <RefreshCw className="text-emerald-600" size={32} />,
      content: "Khi Trợ lý quân nhu thay đổi kho hoặc cấp phát trên máy tính, điện thoại quân nhân sẽ tự cập nhật ngay lập tức mà không cần tải lại trang.",
      note: "Công nghệ WebSocket giúp dữ liệu thông suốt toàn đơn vị."
    }
  ];

  const fullServerCode = `
/**
 * SERVER QUÂN NHU NỘI BỘ (server.js) - BẢN NÂNG CẤP LIVE SYNC
 * Hướng dẫn: Coppy mã này vào file server.js trong thư mục cài đặt Node.js
 */
const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));

// 1. QUẢN LÝ WEBSOCKET (Broadcast tín hiệu)
const broadcast = (data) => {
    wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
};

wss.on('connection', (ws) => {
    console.log('📡 Thiết bị mới đã kết nối vào luồng LIVE.');
});

// 2. HÀM ĐỌC/GHI DỮ LIỆU
const getData = (filename) => {
    const filePath = path.join(__dirname, filename);
    if (!fs.existsSync(filePath)) return [];
    try {
        return JSON.parse(fs.readFileSync(filePath, 'utf8'));
      } catch (e) { return []; }
};

const saveData = (filename, data) => {
    fs.writeFileSync(path.join(__dirname, filename), JSON.stringify(data, null, 2));
    // PHÁT TÍN HIỆU THAY ĐỔI CHO TẤT CẢ THIẾT BỊ
    broadcast({ type: 'DATA_CHANGED', timestamp: Date.now() });
};

// 3. CÁC ĐIỂM KẾT NỐI (API ENDPOINTS)
app.get('/api/health', (req, res) => res.send({ status: 'ok', time: new Date() }));

app.get('/api/inventory', (req, res) => res.json(getData('inventory_db.json')));
app.post('/api/inventory', (req, res) => {
    saveData('inventory_db.json', req.body);
    res.json({ success: true });
});

app.get('/api/soldiers', (req, res) => res.json(getData('soldiers_db.json')));
app.post('/api/soldiers', (req, res) => {
    saveData('soldiers_db.json', req.body);
    res.json({ success: true });
});

app.get('/api/issues', (req, res) => res.json(getData('issues_db.json')));
app.post('/api/issues', (req, res) => {
    saveData('issues_db.json', req.body);
    res.json({ success: true });
});

// 4. KHỞI CHẠY SERVER
server.listen(PORT, '0.0.0.0', () => {
    console.log('--------------------------------------------------');
    console.log('HỆ THỐNG SỔ QUÂN TRANG ĐANG CHẠY CHẾ ĐỘ LIVE SYNC');
    console.log('Cổng dịch vụ: ' + PORT);
    console.log('Dữ liệu lưu tại: ' + __dirname);
    console.log('--------------------------------------------------');
});
  `;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom duration-700 pb-20">
      <div className="bg-[#1a2f12] p-8 md:p-12 rounded-[40px] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-800 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 opacity-30"></div>
        <div className="relative z-10">
          <h2 className="text-2xl md:text-4xl font-black uppercase tracking-tight mb-2">Triển khai Đồng bộ Tức thì</h2>
          <p className="text-emerald-400 text-[10px] md:text-xs font-black uppercase tracking-[0.3em]">Hệ thống LIVE LAN - Kết nối không độ trễ</p>
          
          <div className="flex bg-white/10 p-1 rounded-xl mt-8 w-fit border border-white/10">
            <button 
              onClick={() => setActiveTab('USER')}
              className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'USER' ? 'bg-white text-emerald-950 shadow-lg' : 'text-emerald-100'}`}
            >
              Quy trình sử dụng
            </button>
            <button 
              onClick={() => setActiveTab('TECH')}
              className={`px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'TECH' ? 'bg-white text-emerald-950 shadow-lg' : 'text-emerald-100'}`}
            >
              Cấu hình Máy chủ
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'USER' ? (
        <div className="space-y-6">
          {userSteps.map((step, i) => (
            <div key={i} className="bg-white p-6 md:p-8 rounded-[32px] border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 hover:border-emerald-200 transition-all">
              <div className="shrink-0">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center shadow-inner">
                    {step.icon}
                </div>
              </div>
              <div className="space-y-3">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{step.title}</h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed">{step.content}</p>
                {step.note && (
                  <div className="flex items-center gap-2 text-[10px] font-black text-amber-600 uppercase bg-amber-50 px-3 py-1.5 rounded-lg w-fit">
                      <AlertCircle size={14} /> {step.note}
                  </div>
                )}
                {step.tip && (
                  <div className="flex items-center gap-2 text-[10px] font-black text-emerald-700 uppercase bg-emerald-50 px-3 py-1.5 rounded-lg w-fit">
                      <ShieldCheck size={14} /> Lưu ý: {step.tip}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-6 animate-in fade-in duration-500">
           <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm space-y-6">
              <div className="flex items-center gap-4 border-b pb-4">
                 <Server className="text-emerald-900" size={24} />
                 <h3 className="font-black uppercase text-lg">Thiết lập Máy chủ đơn vị</h3>
              </div>
              <ul className="space-y-4">
                 {[
                   "Tải Node.js tại nodejs.org và cài đặt vào máy tính Trợ lý quân nhu.",
                   "Tạo thư mục 'QuanNhu_Server', tạo file 'server.js' bên trong.",
                   "Mở CMD trong thư mục đó, gõ: 'npm init -y'.",
                   "Cài đặt thư viện cần thiết: 'npm i express cors ws'.",
                   "Sao chép mã nguồn bên dưới vào file 'server.js'.",
                   "Chạy Server bằng lệnh: 'node server.js'.",
                   "Mở Control Panel -> Firewall -> Allow Port 3000."
                 ].map((req, i) => (
                   <li key={i} className="flex items-center gap-4 text-sm font-bold text-slate-700 bg-slate-50 p-4 rounded-2xl">
                      <div className="w-8 h-8 bg-emerald-900 text-white rounded-lg flex items-center justify-center font-black shrink-0">{i+1}</div>
                      {req}
                   </li>
                 ))}
              </ul>
           </div>

           <div className="bg-slate-900 p-8 rounded-[40px] shadow-2xl space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                 <Code2 size={120} className="text-white" />
              </div>
              <div className="flex items-center justify-between text-emerald-400 mb-2">
                 <div className="flex items-center gap-3">
                   <Terminal size={20} />
                   <h4 className="font-black uppercase text-xs tracking-[0.2em]">Mã nguồn server.js (Bản nâng cấp LIVE)</h4>
                 </div>
                 <button 
                  onClick={() => handleCopy(fullServerCode)}
                  className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg text-[10px] hover:bg-white/20 transition-all"
                 >
                   {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                   {copied ? 'ĐÃ SAO CHÉP' : 'SAO CHÉP MÃ'}
                 </button>
              </div>
              <pre className="text-emerald-500 font-mono text-[10px] md:text-xs p-6 bg-black/40 rounded-2xl overflow-x-auto leading-relaxed border border-white/5 h-[400px] custom-scrollbar">
                 {fullServerCode}
              </pre>
           </div>
        </div>
      )}

      <div className="bg-[#0c1808] p-8 rounded-[40px] text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl relative overflow-hidden border border-emerald-900">
         <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500 rounded-full blur-[80px] opacity-10"></div>
         <div className="flex items-center gap-4 relative z-10">
            <Network className="text-yellow-500" size={32} />
            <div>
               <h4 className="font-black uppercase text-sm">Công nghệ WebSocket LIVE Sync</h4>
               <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Dữ liệu thông suốt, không độ trễ giữa nhiều thiết bị</p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default UserGuide;
