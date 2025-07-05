
export enum Language {
  HINDI = 'hi-IN',
  ENGLISH = 'en-US',
}

export enum View {
  HOME,
  DIAGNOSIS,
  MEDICINE_LOOKUP,
  HISTORY,
}

export interface MedicineInfo {
  name: string;
  symptoms: string;
  potency?: string;
  dosage?: string;
}

export interface QueryResult {
  medicines?: MedicineInfo[];
  symptoms?: string[];
  medicineName?: string;
}

export interface HistoryItem {
  id: number;
  type: View.DIAGNOSIS | View.MEDICINE_LOOKUP;
  transcript: string;
  result: QueryResult;
  language: Language;
  timestamp: string;
}
