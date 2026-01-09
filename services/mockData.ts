
import { EquipmentType, EquipmentItem } from '../types';

export const MOCK_UNITS = [
  { id: 'u1', name: 'Sư đoàn 3', level: 'Sư đoàn (và tương đương)' },
  { id: 'u2', name: 'Trung đoàn 2', level: 'Trung đoàn (và tương đương)', parentId: 'u1' },
  { id: 'u3', name: 'Tiểu đoàn 1', level: 'Tiểu đoàn (và tương đương)', parentId: 'u2' },
  { id: 'u4', name: 'Đại đội 1', level: 'Đại đội (và tương đương)', parentId: 'u3' },
];

export const MOCK_EQUIPMENT: EquipmentItem[] = [
  // --- QUÂN TRANG LỄ PHỤC ---
  { id: 'LP-01', name: 'Lễ phục mùa đông (Bộ)', type: EquipmentType.LE_PHUC, unit: 'Bộ', tenureMonths: 60, stock: 100, yearlyStandard: 0.2, category: 'QUAN_AO', price: 1850000 },
  { id: 'LP-02', name: 'Lễ phục mùa hè (Bộ)', type: EquipmentType.LE_PHUC, unit: 'Bộ', tenureMonths: 60, stock: 100, yearlyStandard: 0.2, category: 'QUAN_AO', price: 1200000 },
  { id: 'LP-03', name: 'Giày lễ phục (Đôi)', type: EquipmentType.LE_PHUC, unit: 'Đôi', tenureMonths: 24, stock: 200, yearlyStandard: 0.5, category: 'GIAY_DEP', price: 550000 },
  { id: 'LP-04', name: 'Cấp hiệu đồng bộ lễ phục (Đôi)', type: EquipmentType.LE_PHUC, unit: 'Đôi', tenureMonths: 60, stock: 150, yearlyStandard: 0.2, category: 'KHAC', price: 85000 },

  // --- QUÂN TRANG THƯỜNG XUYÊN ---
  { id: 'TX-01', name: 'Quân phục đông (Suất)', type: EquipmentType.NIEN_HAN, unit: 'Suất', tenureMonths: 24, stock: 500, yearlyStandard: 0.5, category: 'QUAN_AO', price: 850000 },
  { id: 'TX-02', name: 'Quân phục hè (Bộ)', type: EquipmentType.NIEN_HAN, unit: 'Bộ', tenureMonths: 12, stock: 1000, yearlyStandard: 1, category: 'QUAN_AO', price: 450000 },
  { id: 'TX-03', name: 'Áo sơ mi dài tay (Cái)', type: EquipmentType.NIEN_HAN, unit: 'Cái', tenureMonths: 12, stock: 800, yearlyStandard: 2, category: 'QUAN_AO', price: 210000 },
  { id: 'TX-04', name: 'Áo ấm (Cái)', type: EquipmentType.NIEN_HAN, unit: 'Cái', tenureMonths: 36, stock: 300, yearlyStandard: 0.33, category: 'QUAN_AO', price: 650000 },
  { id: 'TX-05', name: 'Áo khoác quân sự (Cái)', type: EquipmentType.NIEN_HAN, unit: 'Cái', tenureMonths: 36, stock: 300, yearlyStandard: 0.33, category: 'QUAN_AO', price: 950000 },
  { id: 'TX-06', name: 'Mũ kê pi đồng bộ (Cái)', type: EquipmentType.NIEN_HAN, unit: 'Cái', tenureMonths: 60, stock: 100, yearlyStandard: 0.2, category: 'MU_NON', price: 250000 },
  { id: 'TX-07', name: 'Mũ cứng (Cái)', type: EquipmentType.DUNG_CHUNG, unit: 'Cái', tenureMonths: 24, stock: 600, yearlyStandard: 0.5, category: 'MU_NON', price: 85000 },
  { id: 'TX-08', name: 'Cara vát (Cái)', type: EquipmentType.NIEN_HAN, unit: 'Cái', tenureMonths: 60, stock: 300, yearlyStandard: 0.2, category: 'KHAC', price: 45000 },
  { id: 'TX-09', name: 'Bít tất (Đôi)', type: EquipmentType.NIEN_HAN, unit: 'Đôi', tenureMonths: 4, stock: 5000, yearlyStandard: 6, category: 'KHAC', price: 12000 },
  { id: 'TX-10', name: 'Dây lưng nhỏ (Cái)', type: EquipmentType.NIEN_HAN, unit: 'Cái', tenureMonths: 24, stock: 600, yearlyStandard: 0.5, category: 'KHAC', price: 125000 },
  { id: 'TX-11', name: 'Cấp hiệu thường xuyên đồng bộ (Đôi)', type: EquipmentType.NIEN_HAN, unit: 'Đôi', tenureMonths: 24, stock: 400, yearlyStandard: 0.5, category: 'KHAC', price: 45000 },
  { id: 'TX-12', name: 'Phù hiệu thường xuyên đồng bộ (Đôi)', type: EquipmentType.NIEN_HAN, unit: 'Đôi', tenureMonths: 24, stock: 400, yearlyStandard: 0.5, category: 'KHAC', price: 25000 },

  // --- QUÂN TRANG DÃ CHIẾN ---
  { id: 'DC-01', name: 'Ghệt dã chiến (Đôi)', type: EquipmentType.SSCD, unit: 'Đôi', tenureMonths: 12, stock: 400, yearlyStandard: 1, category: 'GIAY_DEP', price: 450000 },
  { id: 'DC-02', name: 'Giày vải cao cổ (Đôi)', type: EquipmentType.NIEN_HAN, unit: 'Đôi', tenureMonths: 6, stock: 1200, yearlyStandard: 2, category: 'GIAY_DEP', price: 180000 },
  { id: 'DC-03', name: 'Dây lưng dệt (Cái)', type: EquipmentType.NIEN_HAN, unit: 'Cái', tenureMonths: 12, stock: 800, yearlyStandard: 1, category: 'KHAC', price: 75000 },
  { id: 'DC-04', name: 'Mũ mềm dã chiến (Cái)', type: EquipmentType.NIEN_HAN, unit: 'Cái', tenureMonths: 6, stock: 1000, yearlyStandard: 2, category: 'MU_NON', price: 35000 },
  { id: 'DC-05', name: 'Quân trang dã chiến (Bộ)', type: EquipmentType.SSCD, unit: 'Bộ', tenureMonths: 12, stock: 800, yearlyStandard: 1, category: 'QUAN_AO', price: 550000 },
  { id: 'DC-06', name: 'Mũ chống rét + Quân hiệu (Cái)', type: EquipmentType.NIEN_HAN, unit: 'Cái', tenureMonths: 36, stock: 300, yearlyStandard: 0.33, category: 'MU_NON', price: 120000 },
];
