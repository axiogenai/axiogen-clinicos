export interface Medicine {
  id: string;
  name: string;
  strength?: string;
  form?: string;
  brand?: string;
  category?: string;
  defaultFrequency?: string;
  defaultDuration?: string;
}

export const medicines: Medicine[] = [];
