
export enum Language {
  HINDI = 'hi-IN',
  ENGLISH = 'en-US',
}

export enum View {
  HOME,
  DIAGNOSIS,
  MEDICINE_LOOKUP,
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
