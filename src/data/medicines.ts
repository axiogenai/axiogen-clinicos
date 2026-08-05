export interface Medicine {
  id: string;
  name: string;
  strength: string;
  form: 'Tablet' | 'Capsule' | 'Cream' | 'Ointment' | 'Gel' | 'Lotion' | 'Shampoo' | 'Solution' | 'Drops' | 'Injection' | 'Syrup' | 'Powder' | 'Soap';
  defaultFrequency: string;
  defaultDuration: string;
}

export const medicines: Medicine[] = [];
