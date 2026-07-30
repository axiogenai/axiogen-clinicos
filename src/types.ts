export interface CasePaperMedicine {
  medicineId: string;
  name: string;
  dosage: string;
  frequency: string;
  duration: string;
}

export interface CasePaper {
  patientId: string;
  date: string;
  templateId: string;
  complaint: string;
  pastHistory: string;
  allergies: string;
  medicines: CasePaperMedicine[];
  investigationsAdvised: string[];
  counsellingDone: string[];
  followUpDate: string;
}
