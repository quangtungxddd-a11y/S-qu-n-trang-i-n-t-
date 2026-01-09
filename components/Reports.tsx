
import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Printer, 
  Table as TableIcon,
  ChevronDown,
  FileCheck,
  Send,
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  History,
  Layers,
  PieChart as PieIcon,
  Activity,
  Users,
  Calendar
} from 'lucide-react';
import { EquipmentItem, ImportRecord, Soldier, UNIT_LEVELS } from '../types';

interface ReportsProps {
  inventory: EquipmentItem[];
}

type ReportStatus = 'CHUA_LAP' | 'DA_GUI' | 'DA_PHE_DUYET';

interface UnitOption {
  name: string;
  level: string;
}

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: 4 }, (_, i) => (CURRENT_YEAR - 2 + i).toString());
const PERIODS = ["Toàn năm", "Quý I", "Quý II", "Quý III", "Quý IV", "Chiến sỹ mới", "DBĐV", "Bổ sung"];

const Reports: React.FC<ReportsProps> = ({ inventory }) => {
  const [reportYear, setReportYear] = useState(CURRENT_YEAR.toString());
  const [reportPeriod, setReportPeriod] = useState(PERIODS[0]);
  const [selectedUnit, setSelectedUnit] = useState('ALL');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [reportStatus, setReportStatus] = useState<ReportStatus>('CHUA_LAP');
  const [calculatedData, setCalculatedData] = useState<any[]>([]);
  const [availableUnits, setAvailableUnits] = useState<UnitOption[]>([]);

  useEffect(() => {
    const allSoldiers: Soldier[] = JSON.parse(localStorage.getItem('all_soldiers_db') || '[]');
    const unitsMap = new Map<string, string>();
    allSoldiers.forEach(s => { if (s.unitName) unitsMap.set(s.unitName, s.unitLevel); });
    setAvailableUnits(Array.from(unitsMap.entries()).map(([name, level]) => ({ name, level })));
  }, []);

  useEffect(() => {
    const openingBalances = JSON.parse(localStorage.getItem(`opening_balance_${reportYear}`) || '{}');
    const importHistory: ImportRecord[] = JSON.parse(localStorage.getItem('import_history_db') || '[]');
    const issueHistory = JSON.parse(localStorage.getItem('pending_issues_db') || '[]');
    const allSoldiers: Soldier[] = JSON.parse(localStorage.getItem('all_soldiers_db') || '[]');

    const filteredSoldierIds = allSoldiers
      .filter(s => (selectedLevel === 'ALL' || s.unitLevel === selectedLevel) && (selectedUnit === 'ALL' || s.unitName === selectedUnit))
      .map(s => s.serviceId);

    const data = inventory.map(item => {
      const openVal = openingBalances[item.id] || 0;
      
      const inVal = importHistory.reduce((acc, record) => {
        if (new Date(record.date).getFullYear().toString() !== reportYear) return acc;
        const itemInRecord = record.items.find(ri => ri.itemId === item.id);
        return acc + (itemInRecord ? itemInRecord.actualQty : 0);
      }, 0);

      const outVal = issueHistory.reduce((acc: number, record: any) => {
        if (record.status !== 'ISSUED' && record.status !== 'FINALIZED') return acc;
        
        const matchYear = (record.budgetYear || new Date(record.date).getFullYear().toString()) === reportYear;
        const matchPeriod = reportPeriod === PERIODS[0] || record.period === reportPeriod;
        
        if (!matchYear || !matchPeriod || !filteredSoldierIds.includes(record.soldierId)) return acc;
        
        const itemInRecord = record.items.find((ri: any) => ri.id === item.id);
        return acc + (itemInRecord ? (itemInRecord.quantity || 1) : 0);
      }, 0);

      const unitStandard = item.yearlyStandard * filteredSoldierIds.length;

      return {
        ...item,
        openVal,
        inVal,
        outVal,
        unitStandard,
        currentStock: openVal + inVal - outVal,
        fulfillmentRate: unitStandard > 0 ? Math.min(100, Math.round((outVal / unitStandard) * 100)) : 0
      };
    });

    setCalculatedData(data);
  }, [inventory, reportYear, reportPeriod, selectedUnit, selectedLevel]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-[32px] border shadow-sm p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-900 text-yellow-500 rounded-2xl shadow-xl"><Activity size={28} /></div>
            <div>
              <h3 className="text-xl font-black text-black uppercase tracking-tight">Tổng hợp Quyết toán Quân trang</h3>
              <p className="text-[10px] font-black text-black/40 uppercase tracking-widest mt-1">Hệ thống báo cáo niên độ ngân sách</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
             <div className="space-y-1">
                <label className="text-[8px] font-black text-black/40 uppercase px-1">Năm ngân sách</label>
                <select value={reportYear} onChange={(e) => setReportYear(e.target.value)} className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 text-[10px] font-black text-black uppercase outline-none focus:border-emerald-900">
                  {YEARS.map(y => <option key={y} value={y} className="text-black">Năm {y}</option>)}
                </select>
             </div>
             <div className="space-y-1">
                <label className="text-[8px] font-black text-black/40 uppercase px-1">Kỳ quyết toán</label>
                <select value={reportPeriod} onChange={(e) => setReportPeriod(e.target.value)} className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 text-[10px] font-black text-black uppercase outline-none focus:border-emerald-900">
                  {PERIODS.map(p => <option key={p} value={p} className="text-black">{p}</option>)}
                </select>
             </div>
             <button className="h-fit self-end bg-emerald-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-800 shadow-lg transition-all active:scale-95">
                <Printer size={16} className="inline mr-2" /> In báo cáo
             </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
           {[
             { label: 'Năm quyết toán', value: reportYear, icon: <Calendar />, sub: reportPeriod },
             { label: 'Tỷ lệ cấp phát', value: `${Math.round(calculatedData.reduce((acc, d) => acc + d.fulfillmentRate, 0) / (calculatedData.length || 1))}%`, icon: <PieIcon />, sub: 'Theo định mức năm' },
             { label: 'Mặt hàng đủ tiêu chuẩn', value: calculatedData.filter(d => d.fulfillmentRate >= 100).length, icon: <CheckCircle2 />, sub: 'Hoàn thành 100%' },
             { label: 'Tổng tồn kho đơn vị', value: calculatedData.reduce((acc, d) => acc + d.currentStock, 0).toLocaleString(), icon: <Activity />, sub: 'Sổ sách thực tế' },
           ].map((s, i) => (
             <div key={i} className="bg-slate-50 p-6 rounded-[24px] border border-slate-100 hover:shadow-inner transition-all">
                <div className="flex items-center gap-3 mb-3 text-emerald-900">{s.icon}<span className="text-[9px] font-black uppercase opacity-60 tracking-widest">{s.label}</span></div>
                <h4 className="text-2xl font-black text-black">{s.value}</h4>
                <p className="text-[8px] font-black text-black/30 uppercase mt-1 tracking-widest">{s.sub}</p>
             </div>
           ))}
        </div>
      </div>

      <div className="bg-white rounded-[32px] border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-emerald-950 text-[10px] font-black text-emerald-400 uppercase text-center tracking-tighter">
                <th className="border border-emerald-900 px-4 py-5 w-10">STT</th>
                <th className="border border-emerald-900 px-4 py-5 text-left">Mặt hàng quân nhu</th>
                <th className="border border-emerald-900 px-4 py-5 w-24">Tồn đầu {reportYear}</th>
                <th className="border border-emerald-900 px-4 py-5 w-24">Nhập thực</th>
                <th className="border border-emerald-900 px-4 py-5 w-24 bg-emerald-900/20">Xuất ({reportPeriod})</th>
                <th className="border border-emerald-900 px-4 py-5 w-24">Định mức</th>
                <th className="border border-emerald-900 px-4 py-5 w-32">Hoàn thành</th>
                <th className="border border-emerald-900 px-4 py-5 w-24 bg-yellow-500 text-emerald-950">Tồn hiện tại</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {calculatedData.map((item, i) => (
                <tr key={i} className="text-[11px] text-center hover:bg-slate-50 transition-colors">
                  <td className="border border-slate-100 px-4 py-4 font-black text-black/40">{i + 1}</td>
                  <td className="border border-slate-100 px-4 py-4 text-left font-black text-black uppercase">{item.name}</td>
                  <td className="border border-slate-100 px-4 py-4 font-black text-black">{item.openVal}</td>
                  <td className="border border-slate-100 px-4 py-4 font-black text-blue-800">{item.inVal}</td>
                  <td className="border border-slate-100 px-4 py-4 font-black text-emerald-900 bg-emerald-50/30">{item.outVal}</td>
                  <td className="border border-slate-100 px-4 py-4 font-black text-black/40 italic">{item.unitStandard}</td>
                  <td className="border border-slate-100 px-4 py-4">
                     <div className="px-4">
                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                           <div className={`h-full ${item.fulfillmentRate >= 100 ? 'bg-emerald-600' : 'bg-orange-500'}`} style={{ width: `${item.fulfillmentRate}%` }} />
                        </div>
                        <span className="text-[8px] font-black uppercase mt-1 inline-block text-black">{item.fulfillmentRate}%</span>
                     </div>
                  </td>
                  <td className="border border-slate-100 px-4 py-4 font-black bg-yellow-50 text-emerald-950">{item.currentStock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="bg-[#1a2f12] p-6 rounded-[24px] flex items-center gap-4 text-white shadow-xl">
        <AlertCircle className="text-yellow-500" size={24} />
        <p className="text-[10px] font-black uppercase leading-relaxed tracking-wider italic">
          Báo cáo quyết toán được tổng hợp từ các phiếu xuất đã được "Xác nhận" (FINALIZED/ISSUED) trong kỳ và năm ngân sách tương ứng.
        </p>
      </div>
    </div>
  );
};

export default Reports;
