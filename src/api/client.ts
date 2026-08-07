const API_BASE = import.meta.env.VITE_API_URL || '/api';

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
  forgotPassword: (identifier: string) => apiRequest<{ message: string; email?: string; phone?: string; otp?: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ identifier }) }),
  verifyOTP: (identifier: string, otp: string) => apiRequest<{ success: boolean; message: string }>('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ identifier, otp }) }),
  resetPassword: (identifier: string, otp: string, newPassword: string) => apiRequest<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ identifier, otp, newPassword }) }),

  // Patients
  getPatients: () => apiRequest<any[]>('/patients'),
  searchPatients: (q: string) => apiRequest<any[]>(`/patients/search?q=${encodeURIComponent(q)}`),
  createPatient: (patient: any) => apiRequest<any>('/patients', { method: 'POST', body: JSON.stringify(patient) }),
  updatePatient: (id: string, patient: any) => apiRequest<any>(`/patients/${id}`, { method: 'PUT', body: JSON.stringify(patient) }),
  deletePatient: (id: string) => apiRequest<any>(`/patients/${id}`, { method: 'DELETE' }),

  // Queue
  getQueue: (date?: string) => apiRequest<any[]>(`/queue${date ? `?date=${date}` : ''}`),
  getQueueStats: (date?: string) => apiRequest<any>(`/queue/stats${date ? `?date=${date}` : ''}`),
  addToQueue: (queueItem: any) => apiRequest<any>('/queue', { method: 'POST', body: JSON.stringify(queueItem) }),
  updateQueueStatus: (queueId: string, status: string) => apiRequest<any>(`/queue/${queueId}`, { method: 'PUT', body: JSON.stringify({ status }) }),
  removeFromQueue: (queueId: string) => apiRequest<any>(`/queue/${queueId}`, { method: 'DELETE' }),
  autoBackupQueue: (date: string, items: any[]) => apiRequest<any>('/queue/auto-backup', { method: 'POST', body: JSON.stringify({ date, items }) }),

  // Medicines
  getMedicines: () => apiRequest<any[]>('/medicines'),
  searchMedicines: (q: string) => apiRequest<any[]>(`/medicines/search?q=${encodeURIComponent(q)}`),
  createMedicine: (med: any) => apiRequest<any>('/medicines', { method: 'POST', body: JSON.stringify(med) }),
  bulkImportMedicines: (medicines: any[]) => apiRequest<any>('/medicines/bulk', { method: 'POST', body: JSON.stringify({ medicines }) }),
  getMedicineCount: () => apiRequest<{ count: number }>('/medicines/count'),

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
  triggerFestivalWhatsApp: (date?: string) => apiRequest<any>('/whatsapp/trigger-festival', { method: 'POST', body: JSON.stringify({ date }) }),
  updateWhatsAppSettings: (autoScheduleEnabled: boolean) => apiRequest<any>('/whatsapp/settings', { method: 'POST', body: JSON.stringify({ autoScheduleEnabled }) }),
  disconnectWhatsApp: () => apiRequest<any>('/whatsapp/disconnect', { method: 'POST' }),
  restartWhatsApp: () => apiRequest<any>('/whatsapp/restart', { method: 'POST' }),
  sendSingleWhatsApp: (phone: string, message?: string, patientName?: string, followUpDate?: string) => apiRequest<any>('/whatsapp/send-single', { method: 'POST', body: JSON.stringify({ phone, message, patientName, followUpDate }) }),

  // Groq AI Translation
  translateText: (text: string, targetLang: string) => apiRequest<{ translatedText: string }>('/clinic/translate', { method: 'POST', body: JSON.stringify({ text, targetLang }) }),
};

