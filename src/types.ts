export type BankType = 'BTN' | 'SeaBank';
export type StatusType = 'Berhasil' | 'Pending' | 'Ditolak';

export interface Customer {
  id: string;
  name: string;
  phone: string;
  bank: BankType;
  registrationDate: string; // YYYY-MM-DD
  status: StatusType;
  notes: string;
  userId: string;
  createdAt: string; // ISO String
  photoUrl?: string; // Base64 or URL image
  documents?: string[]; // Array of up to 3 Base64 or URL documents
}

export interface MonthlyTarget {
  id: string;
  userId: string;
  month: string; // YYYY-MM
  target: number;
}
