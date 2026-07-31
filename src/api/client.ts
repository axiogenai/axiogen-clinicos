const API_BASE = 'http://localhost:5000/api';

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('clinicos_jwt_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || `HTTP error ${response.status}`);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) => apiRequest<{ user: any; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getMe: () => apiRequest<any>('/auth/me'),

  // Patients
  getPatients: () => apiRequest<any[]>('/patients'),
  searchPatients: (q: string) => apiRequest<any[]>(`/patients/search?q=${encodeURIComponent(q)}`),
  createPatient: (patient: any) => apiRequest<any>('/patients', { method: 'POST', body: JSON.stringify(patient) }),
  updatePatient: (id: string, patient: any) => apiRequest<any>(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(patient) }),
  deletePatient: (id: string) => apiRequest<any>(`/patients/${id}`, { method: 'DELETE' }),

  // Queue
  getQueue: () => apiRequest<any[]>('/queue'),
  getQueueStats: () => apiRequest<any>('/queue/stats'),
  addToQueue: (queueItem: any) => apiRequest<any>('/queue', { method: 'POST', body: JSON.stringify(queueItem) }),
  updateQueueStatus: (queueId: string, status: string) => apiRequest<any>(`/queue/${queueId}`, { method: 'PUT', body: JSON.stringify({ status }) }),
  removeFromQueue: (queueId: string) => apiRequest<any>(`/queue/${queueId}`, { method: 'DELETE' }),

  // Medicines
  getMedicines: () => apiRequest<any[]>('/medicines'),
  searchMedicines: (q: string) => apiRequest<any[]>(`/medicines/search?q=${encodeURIComponent(q)}`),
  createMedicine: (med: any) => apiRequest<any>('/medicines', { method: 'POST', body: JSON.stringify(med) }),
  bulkImportMedicines: (medicines: any[]) => apiRequest<any>('/medicines/bulk', { method: 'POST', body: JSON.stringify({ medicines }) }),

  // Templates
  getTemplates: () => apiRequest<any[]>('/templates'),
  createTemplate: (template: any) => apiRequest<any>('/templates', { method: 'POST', body: JSON.stringify(template) }),
  updateTemplate: (id: string, template: any) => apiRequest<any>(`/templates/${id}`, { method: 'PUT', body: JSON.stringify(template) }),
  deleteTemplate: (id: string) => apiRequest<any>(`/templates/${id}`, { method: 'DELETE' }),
  duplicateTemplate: (id: string) => apiRequest<any>(`/templates/${id}/duplicate`, { method: 'POST' }),
  toggleFavoriteTemplate: (id: string) => apiRequest<any>(`/templates/${id}/favorite`, { method: 'PUT' }),

  // Case Papers
  getCasePapers: (patientId?: string) => apiRequest<any[]>(`/case-papers${patientId ? `?patientId=${patientId}` : ''}`),
  createCasePaper: (data: any) => apiRequest<any>('/case-papers', { method: 'POST', body: JSON.stringify(data) }),

  // Clinic Settings
  getClinicSettings: () => apiRequest<any>('/clinic/settings'),
  updateClinicSettings: (settings: any) => apiRequest<any>('/clinic/settings', { method: 'PUT', body: JSON.stringify(settings) }),

  // WhatsApp Background Automation
  getWhatsAppStatus: () => apiRequest<any>('/whatsapp/status'),
  triggerAutoWhatsApp: (date?: string) => apiRequest<any>('/whatsapp/trigger-auto-send', { method: 'POST', body: JSON.stringify({ date }) }),
  updateWhatsAppSettings: (autoScheduleEnabled: boolean) => apiRequest<any>('/whatsapp/settings', { method: 'POST', body: JSON.stringify({ autoScheduleEnabled }) }),
};

