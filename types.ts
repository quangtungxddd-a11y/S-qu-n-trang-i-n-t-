
export enum UserRole {
  SOLDIER = 'SOLDIER',
  SUPPLY_OFFICER = 'SUPPLY_OFFICER',
  COMMANDER = 'COMMANDER'
}

export enum PersonnelType {
  SY_QUAN = 'SY_QUAN',
  QNCN = 'QNCN',
  SQDB = 'SQDB',
  CHIEN_SY = 'CHIEN_SY'
}

export enum EquipmentType {
  NIEN_HAN = 'NIEN_HAN',
  LE_PHUC = 'LE_PHUC',
  DUNG_CHUNG = 'DUNG_CHUNG',
  SSCD = 'SSCD',
  DBDV = 'DBDV',
  DOT_XUAT = 'DOT_XUAT'
}

export const UNIT_LEVELS = [
  'Tiểu đội',
  'Trung đội',
  'Đại đội (and tương đương)',
  'Tiểu đoàn (and tương đương)',
  'Trung đoàn (and tương đương)',
  'Sư đoàn (and tương đương)',
  'Quân (binh) chủng và tương đương',
  'Bộ Quốc Phòng'
] as const;

export interface UnitInfo {
  tieuDoi?: string;
  trungDoi?: string;
  daiDoi?: string;
  tieuDoan?: string;
  trungDoan?: string;
  suDoan?: string;
  quanBinhChung?: string;
  vanPhongBQP?: string;
}

export interface BodyMeasurements {
  neck?: number;
  chest?: number;
  waist?: number;
  shoulder?: number;
  armLength?: number;
  pantsLength?: number;
  hip?: number;
  height?: number;
  weight?: number;
  lastUpdated?: string;
}

export interface TransferRequest {
  type: 'INTERNAL' | 'EXTERNAL';
  lastIssuedPeriod: string;
  nextRequestPeriod: string;
  nextRequestYear: string;
  targetUnit: UnitInfo;
  targetUnitName: string;
  targetUnitLevel: string;
  requestDate: string;
  status: 'PENDING' | 'ACCEPTED';
}

export interface Soldier {
  id: string;
  fullName: string;
  birthDate: string;
  enlistmentYear: string;
  rank: string;       
  position: string;   
  personnelType?: PersonnelType; 
  unitLevel: string; 
  unitName: string;  
  unitDetail: UnitInfo; 
  unitId?: string;
  serviceId: string;  
  password?: string;
  passwordResetRequested?: boolean;
  phone: string;
  role: UserRole;
  qrCode: string;
  registrationDate: string;
  joinDate: string;
  itemSizes: Record<string, string>;
  measurements?: BodyMeasurements; 
  tailoringRequest?: boolean;      
  sizes: { 
    hat: string;
    shirt: string;
    pants: string;
    shoes: string;
  };
  pendingTransfer?: TransferRequest; // Thông tin điều chuyển
}

export interface EquipmentItem {
  id: string;
  name: string;
  type: EquipmentType;
  unit: string;      
  tenureMonths: number; 
  stock: number;
  yearlyStandard: number; 
  category: 'QUAN_AO' | 'GIAY_DEP' | 'MU_NON' | 'KHAC'; 
  price?: number; 
}

export interface IssueRecord {
  id: string;
  soldierId: string;
  itemId: string;
  issueDate: string;
  expiryDate: string;
  status: string;
  quantity: number;
  qrVerified: boolean;
}

// Thêm interface ImportRecord để fix lỗi import
export interface ImportRecord {
  id: string;
  superiorVoucherId: string;
  importVoucherId: string;
  date: string;
  items: Array<{
    itemId: string;
    itemName: string;
    unit: string;
    voucherQty: number;
    actualQty: number;
    note: string;
  }>;
}

// Thêm interface ExportRecord (thường gọi là Issue trong hệ thống) để fix lỗi import
export interface ExportRecord {
  id: string;
  soldierId?: string;
  soldierName?: string;
  soldierUnit?: string;
  soldierRank?: string;
  issuerId: string;
  issuerName: string;
  items: Array<{
    id?: string;
    name?: string;
    unit?: string;
    quantity: number;
    category?: string;
  }>;
  period: string;
  budgetYear: string;
  date: string;
  status: string;
  confirmDate?: string;
  finalizedDate?: string;
}
