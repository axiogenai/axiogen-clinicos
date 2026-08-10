const getApiBase = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && (window.location.hostname.includes('vercel.app') || window.location.protocol === 'https:')) {
    return 'https://shinagare-clinicos.duckdns.org/api';
  }
  return '/api';
};

const API_BASE = getApiBase();

export async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('clinicos_jwt_token');

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const primaryUrl = `${API_BASE}${endpoint}`;
  try {
    const response = await fetch(primaryUrl, { ...options, headers });
    if (response.ok) {
      return await response.json();
    }
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    if (response.status !== 404) {
      throw new Error(errorData.error || `HTTP error ${response.status}`);
    }
  } catch (err: any) {
    if (err.message && !err.message.includes('404') && !err.message.includes('Failed to fetch') && !err.message.includes('NetworkError')) {
      throw err;
    }
  }

  // Fallback directly to current host origin
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const fallbackUrl = `${origin}/api${endpoint}`;
  const fallbackRes = await fetch(fallbackUrl, { ...options, headers });
  if (!fallbackRes.ok) {
    const errorData = await fallbackRes.json().catch(() => ({ error: fallbackRes.statusText }));
    throw new Error(errorData.error || `HTTP error ${fallbackRes.status}`);
  }

  return fallbackRes.json();
}

export const api = {
  // Auth
  login: (email: string, password: string) => apiRequest<{ user?: any; token?: string; requires2FA?: boolean; identifier?: string; message?: string; isMasterKey?: boolean }>('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  verifyLoginOTP: (identifier: string, otp: string) => apiRequest<{ user: any; token: string }>('/auth/login/verify-otp', { method: 'POST', body: JSON.stringify({ identifier, otp }) }),
  getMe: () => apiRequest<any>('/auth/me'),
  forgotPassword: (identifier: string) => apiRequest<{ message: string; email?: string; phone?: string; otp?: string }>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ identifier }) }),
  verifyOTP: (identifier: string, otp: string) => apiRequest<{ success: boolean; message: string }>('/auth/verify-otp', { method: 'POST', body: JSON.stringify({ identifier, otp }) }),
  resetPassword: (identifier: string, otp: string, newPassword: string) => apiRequest<{ message: string }>('/auth/reset-password', { method: 'POST', body: JSON.stringify({ identifier, otp, newPassword }) }),
  verifyPasscode: (passcode: string) => apiRequest<{ success: boolean; message: string }>('/auth/verify-passcode', { method: 'POST', body: JSON.stringify({ passcode }) }),
  forgotPasscode: () => apiRequest<{ message: string; email?: string }>('/auth/forgot-passcode', { method: 'POST' }),
  resetPasscode: (otp: string, newPasscode: string) => apiRequest<{ success: boolean; message: string }>('/auth/reset-passcode', { method: 'POST', body: JSON.stringify({ otp, newPasscode }) }),

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

  // Permanent OPD Register (Day-wise, Month-wise, Year-wise)
  getDailyRegister: (date?: string) => apiRequest<any[]>(`/register/daily${date ? `?date=${date}` : ''}`),
  getMonthlyRegister: (year?: number, month?: number) => apiRequest<any>(`/register/monthly?year=${year || new Date().getFullYear()}&month=${month || (new Date().getMonth() + 1)}`),
  getYearlyRegister: (year?: number) => apiRequest<any>(`/register/yearly?year=${year || new Date().getFullYear()}`),
  syncRegister: (date?: string) => apiRequest<any>('/register/sync', { method: 'POST', body: JSON.stringify({ date }) }),
  deleteRegisterEntry: (id: string) => apiRequest<any>(`/register/${id}`, { method: 'DELETE' }),
  clearAllRegister: () => apiRequest<any>('/register/clear-all', { method: 'DELETE' }),
};
