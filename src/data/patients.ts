export interface PastVisit {
  date: string;
  diagnosis: string;
  template: string;
}

export interface Patient {
  id: string;
  name: string;
  age: number;
  gender: 'M' | 'F' | 'Other';
  phone: string;
  village: string;
  pastHistory: string;
  allergies: string;
  pastVisits: PastVisit[];
}

export interface QueueItem {
  queueId: string;
  patientId: string;
  timeAdded: string;
  complaint: string;
  status: 'waiting' | 'in-consultation' | 'completed' | 'cancelled';
  notes?: string;
  name?: string;
  age?: number;
  gender?: 'M' | 'F';
  phone?: string;
  village?: string;
}

export const patients: Patient[] = [
  {
    id: 'pat_001',
    name: 'Rajesh Patil',
    age: 34,
    gender: 'M',
    phone: '9876543210',
    village: 'Shirur',
    pastHistory: 'Hypertension',
    allergies: 'None',
    pastVisits: [
      { date: '2023-01-15', diagnosis: 'Tinea Cruris', template: 'Fungal Infection (Skin)' }
    ]
  },
  {
    id: 'pat_002',
    name: 'Sunita Deshmukh',
    age: 28,
    gender: 'F',
    phone: '9876543211',
    village: 'Baramati',
    pastHistory: 'Nil',
    allergies: 'Penicillin',
    pastVisits: [
      { date: '2023-05-22', diagnosis: 'Acne Vulgaris', template: 'Acne - Mild' }
    ]
  },
  {
    id: 'pat_003',
    name: 'Anil Kulkarni',
    age: 45,
    gender: 'M',
    phone: '9876543212',
    village: 'Junnar',
    pastHistory: 'Diabetes Mellitus Type 2',
    allergies: 'None',
    pastVisits: []
  },
  {
    id: 'pat_004',
    name: 'Priya Joshi',
    age: 22,
    gender: 'F',
    phone: '9876543213',
    village: 'Khed',
    pastHistory: 'PCOS',
    allergies: 'None',
    pastVisits: [
      { date: '2022-11-10', diagnosis: 'Androgenetic Alopecia', template: 'Hair Fall' },
      { date: '2023-03-05', diagnosis: 'Acne Vulgaris', template: 'Acne - Severe' }
    ]
  },
  {
    id: 'pat_005',
    name: 'Suresh Shinde',
    age: 52,
    gender: 'M',
    phone: '9876543214',
    village: 'Bhor',
    pastHistory: 'Asthma',
    allergies: 'Dust',
    pastVisits: []
  },
  {
    id: 'pat_006',
    name: 'Meena Pawar',
    age: 31,
    gender: 'F',
    phone: '9876543215',
    village: 'Saswad',
    pastHistory: 'Nil',
    allergies: 'Sulfa drugs',
    pastVisits: [
      { date: '2023-06-12', diagnosis: 'Atopic Dermatitis', template: 'Eczema / Dermatitis' }
    ]
  },
  {
    id: 'pat_007',
    name: 'Kiran Jadhav',
    age: 25,
    gender: 'M',
    phone: '9876543216',
    village: 'Indapur',
    pastHistory: 'Nil',
    allergies: 'None',
    pastVisits: []
  },
  {
    id: 'pat_008',
    name: 'Sneha Gaikwad',
    age: 29,
    gender: 'F',
    phone: '9876543217',
    village: 'Daund',
    pastHistory: 'Hypothyroidism',
    allergies: 'None',
    pastVisits: [
      { date: '2023-04-18', diagnosis: 'Telogen Effluvium', template: 'Hair Fall' }
    ]
  },
  {
    id: 'pat_009',
    name: 'Vikram More',
    age: 38,
    gender: 'M',
    phone: '9876543218',
    village: 'Velhe',
    pastHistory: 'Nil',
    allergies: 'None',
    pastVisits: []
  },
  {
    id: 'pat_010',
    name: 'Pooja Chavan',
    age: 19,
    gender: 'F',
    phone: '9876543219',
    village: 'Mulshi',
    pastHistory: 'Nil',
    allergies: 'None',
    pastVisits: [
      { date: '2023-07-20', diagnosis: 'Acne Vulgaris', template: 'Acne - Mild' }
    ]
  }
];

export const todayQueue: QueueItem[] = [
  {
    queueId: 'q_001',
    patientId: 'pat_002',
    timeAdded: '09:00 AM',
    complaint: 'Follow up for Acne',
    status: 'completed'
  },
  {
    queueId: 'q_002',
    patientId: 'pat_006',
    timeAdded: '09:15 AM',
    complaint: 'Itching and redness on hands',
    status: 'in-consultation'
  },
  {
    queueId: 'q_003',
    patientId: 'pat_007',
    timeAdded: '09:30 AM',
    complaint: 'Severe hair fall since 2 months',
    status: 'waiting'
  },
  {
    queueId: 'q_004',
    patientId: 'pat_010',
    timeAdded: '09:45 AM',
    complaint: 'Pimples on face',
    status: 'waiting'
  },
  {
    queueId: 'q_005',
    patientId: 'pat_001',
    timeAdded: '10:00 AM',
    complaint: 'Ringworm infection on thigh',
    status: 'waiting'
  },
  {
    queueId: 'q_006',
    patientId: 'pat_003',
    timeAdded: '10:15 AM',
    complaint: 'White patches on skin',
    status: 'waiting'
  }
];
