
import React from 'react';
import { 
  LayoutDashboard,
  PackagePlus, 
  Package, 
  Users, 
  ClipboardList, 
  FilePieChart, 
  Settings,
  QrCode,
  SlidersHorizontal,
  HelpCircle
} from 'lucide-react';

export const RANKS = [
  'Binh nhì', 'Binh nhất', 'Hạ sĩ', 'Trung sĩ', 'Thượng sĩ',
  'Thiếu úy', 'Trung úy', 'Thượng úy', 'Đại úy',
  'Thiếu tá', 'Trung tá', 'Thượng tá', 'Đại tá',
  'Thiếu tướng', 'Trung tướng', 'Thượng tướng', 'Đại tướng'
];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Bàn làm việc', icon: <LayoutDashboard size={20} />, roles: ['SUPPLY_OFFICER', 'COMMANDER'] },
  { id: 'personal', label: 'Cá nhân', icon: <ClipboardList size={20} />, roles: ['SOLDIER', 'SUPPLY_OFFICER', 'COMMANDER'] },
  { id: 'reception', label: 'Tiếp nhận quân trang', icon: <PackagePlus size={20} />, roles: ['SOLDIER', 'SUPPLY_OFFICER', 'COMMANDER'] },
  { id: 'inventory', label: 'Kho quân trang', icon: <Package size={20} />, roles: ['SUPPLY_OFFICER', 'COMMANDER'] },
  { id: 'soldiers', label: 'Quản lý quân nhân', icon: <Users size={20} />, roles: ['SUPPLY_OFFICER', 'COMMANDER'] },
  { id: 'issuance', label: 'Cấp phát quân trang', icon: <QrCode size={20} />, roles: ['SUPPLY_OFFICER'] },
  { id: 'reports', label: 'Báo cáo quyết toán', icon: <FilePieChart size={20} />, roles: ['SUPPLY_OFFICER', 'COMMANDER'] },
  { id: 'guide', label: 'Hướng dẫn SD', icon: <HelpCircle size={20} />, roles: ['SOLDIER', 'SUPPLY_OFFICER', 'COMMANDER'] },
  { id: 'settings', label: 'Cấu hình hệ thống', icon: <SlidersHorizontal size={20} />, roles: ['SUPPLY_OFFICER'] },
];

export const THEME_COLORS = {
  armyGreen: '#2D4F1E',
  armyGold: '#D4AF37',
  danger: '#DC2626',
  success: '#16A34A'
};
