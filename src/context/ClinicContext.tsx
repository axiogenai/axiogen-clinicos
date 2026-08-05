import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Patient, QueueItem } from '../data/patients';
import type { CaseTemplate } from '../data/templates';
import type { ClinicSettings } from '../data/clinicSettings';
import { defaultClinicSettings } from '../data/clinicSettings';
import { api } from '../api/client';

export interface UserSession {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'doctor' | 'receptionist';
  clinicId: number;
}

export interface ToastMessage {
  type: 'success' | 'info' | 'warning' | 'error';
  title?: string;
  message: string;
}

interface ClinicContextType {
  user: UserSession | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  patients: Patient[];
  queue: QueueItem[];
  templates: CaseTemplate[];
  clinicSettings: ClinicSettings;
  toast: ToastMessage | null;
  setToast: (toast: ToastMessage | null) => void;
  addPatient: (patient: Patient) => void;
  addToQueue: (queueItem: QueueItem) => void;
  updateQueueStatus: (queueId: string, status: QueueItem['status']) => void;
  removeFromQueue: (queueId: string) => void;
  registerAndEnqueue: (patientData: Partial<Patient> & { complaint: string; notes?: string }, existingPatient?: Patient) => void;
  addTemplate: (template: CaseTemplate) => void;
  updateTemplate: (template: CaseTemplate) => void;
  deleteTemplate: (templateId: string) => void;
  toggleFavoriteTemplate: (templateId: string) => void;
  duplicateTemplate: (templateId: string) => void;
  updateClinicSettings: (settings: ClinicSettings, showToast?: boolean) => void;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('clinicos_jwt_token');
  });

  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const storedUser = localStorage.getItem('clinicos_user_session');
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      return null;
    }
  });

  const [patients, setPatients] = useState<Patient[]>([]);

  const [queue, setQueue] = useState<QueueItem[]>([]);

  const [templates, setTemplates] = useState<CaseTemplate[]>([]);

  const [clinicSettings, setClinicSettings] = useState<ClinicSettings>(defaultClinicSettings);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Authentication Actions
  const login = useCallback(async (emailInput: string, passwordInput: string) => {
    try {
      const data = await api.login(emailInput, passwordInput);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('clinicos_jwt_token', data.token);
      localStorage.setItem('clinicos_user_session', JSON.stringify(data.user));
    } catch (err: any) {
      // Fallback for offline local dev mode
      const mockRole = emailInput.includes('reception') ? 'receptionist' : 'doctor';
      const mockUser: UserSession = {
        id: 1,
        email: emailInput,
        name: mockRole === 'doctor' ? 'डॉ. प्रमोद शिनगारे' : 'Sneha Kulkarni',
        role: mockRole,
        clinicId: 1
      };
      setToken('mock_offline_jwt_token');
      setUser(mockUser);
      localStorage.setItem('clinicos_jwt_token', 'mock_offline_jwt_token');
      localStorage.setItem('clinicos_user_session', JSON.stringify(mockUser));
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('clinicos_jwt_token');
    localStorage.removeItem('clinicos_user_session');
    setToast({ type: 'info', message: 'You have logged out.' });
  }, []);

  // Initial Database Load & Auto-polling for multi-device sync
  const loadFromDatabase = useCallback(async () => {
    try {
      const [dbPatients, dbQueue, dbTemplates, dbSettings] = await Promise.allSettled([
        api.getPatients(),
        api.getQueue(),
        api.getTemplates(),
        api.getClinicSettings(),
      ]);

      if (dbPatients.status === 'fulfilled') {
        setPatients(dbPatients.value);
      }
      if (dbQueue.status === 'fulfilled') {
        setQueue(dbQueue.value);
      }
      if (dbTemplates.status === 'fulfilled') {
        setTemplates(dbTemplates.value);
      }
      if (dbSettings.status === 'fulfilled' && dbSettings.value) {
        setClinicSettings((prev) => ({
          ...prev,
          clinicNameHi: dbSettings.value.nameHi || prev.clinicNameHi,
          clinicNameEn: dbSettings.value.nameEn || prev.clinicNameEn,
          address: dbSettings.value.address || prev.address,
          phone: dbSettings.value.phone || prev.phone,
          openingHours: dbSettings.value.openingHours || prev.openingHours,
          closedDay: dbSettings.value.closedDay || prev.closedDay,
          headerBgColor: dbSettings.value.headerBgColor || prev.headerBgColor,
          pharmacyInfo: dbSettings.value.pharmacyInfo ?? prev.pharmacyInfo,
        }));
      }
    } catch {
      // Offline mode
    }
  }, []);

  useEffect(() => {
    if (token) {
      loadFromDatabase();
      const interval = setInterval(loadFromDatabase, 30000); // 30s auto-polling
      return () => clearInterval(interval);
    }
  }, [token, loadFromDatabase]);

  // Removed sync to localStorage to prevent stale data

  const addPatient = useCallback((patient: Patient) => {
    setPatients((prev) => {
      const exists = prev.some((p) => p.id === patient.id);
      if (exists) return prev;
      return [...prev, patient];
    });

    api.createPatient(patient).catch(() => {});
  }, []);

  const addToQueue = useCallback((queueItem: QueueItem) => {
    setQueue((prev) => [...prev, queueItem]);
    api.addToQueue(queueItem).catch(() => {});
  }, []);

  const updateQueueStatus = useCallback((queueId: string, status: QueueItem['status']) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (
          item.queueId === queueId ||
          item.patientId === queueId ||
          (item.name && item.name.toLowerCase() === queueId.toLowerCase())
        ) {
          return { ...item, status };
        }
        return item;
      })
    );
    api.updateQueueStatus(queueId, status).catch(() => {});
  }, []);

  const removeFromQueue = useCallback((queueId: string) => {
    setQueue((prev) => prev.filter((item) => item.queueId !== queueId));
    api.removeFromQueue(queueId).catch(() => {});
  }, []);

  const registerAndEnqueue = useCallback((
    patientData: Partial<Patient> & { complaint: string; notes?: string },
    existingPatient?: Patient
  ) => {
    let patient = existingPatient;

    if (!patient) {
      patient = {
        id: `PT${String(patients.length + 1).padStart(4, '0')}`,
        name: patientData.name || 'Unknown',
        age: patientData.age || 0,
        gender: patientData.gender || 'M',
        phone: patientData.phone || '',
        village: patientData.village || '',
        pastHistory: patientData.pastHistory || 'No known allergies',
        allergies: patientData.allergies || '',
        pastVisits: [],
      };
      
      addPatient(patient);
    }

    const queueId = `Q${Date.now()}`;
    const newQueueItem: QueueItem = {
      queueId,
      patientId: patient.id,
      name: patient.name,
      age: patient.age,
      phone: patient.phone,
      village: patient.village,
      timeAdded: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      complaint: patientData.complaint,
      status: 'waiting',
      notes: patientData.notes || '',
    };

    addToQueue(newQueueItem);
    
    setToast({
      type: 'success',
      message: `${patient.name} has been added to the queue.`
    });

  }, [patients, addPatient, addToQueue]);

  const addTemplate = useCallback((template: CaseTemplate) => {
    setTemplates((prev) => [...prev, template]);
    api.createTemplate(template).catch(() => {});
    setToast({ type: 'success', message: `Template "${template.name}" created.` });
  }, []);

  const updateTemplate = useCallback((template: CaseTemplate) => {
    setTemplates((prev) => prev.map((t) => (t.id === template.id ? template : t)));
    api.updateTemplate(template.id, template).catch(() => {});
    setToast({ type: 'success', message: `Template "${template.name}" updated.` });
  }, []);

  const deleteTemplate = useCallback((templateId: string) => {
    setTemplates((prev) => {
      const target = prev.find((t) => t.id === templateId);
      const updated = prev.filter((t) => t.id !== templateId);
      if (target) setToast({ type: 'info', message: `Template "${target.name}" deleted.` });
      return updated;
    });
    api.deleteTemplate(templateId).catch(() => {});
  }, []);

  const toggleFavoriteTemplate = useCallback((templateId: string) => {
    setTemplates((prev) =>
      prev.map((t) => (t.id === templateId ? { ...t, isFavorite: !t.isFavorite } : t))
    );
    api.toggleFavoriteTemplate(templateId).catch(() => {});
  }, []);

  const duplicateTemplate = useCallback((templateId: string) => {
    setTemplates((prev) => {
      const original = prev.find((t) => t.id === templateId);
      if (!original) return prev;
      const duplicate: CaseTemplate = {
        ...original,
        id: `tpl_${Date.now()}`,
        name: `Copy of ${original.name}`,
        createdDate: new Date().toISOString().split('T')[0],
        updatedDate: new Date().toISOString().split('T')[0],
      };
      setToast({ type: 'success', message: `Duplicated "${original.name}" as "${duplicate.name}".` });
      return [...prev, duplicate];
    });
    api.duplicateTemplate(templateId).catch(() => {});
  }, []);

  const updateClinicSettings = useCallback((settings: ClinicSettings, showToast = false) => {
    setClinicSettings(settings);
    api.updateClinicSettings({
      nameHi: settings.clinicNameHi,
      nameEn: settings.clinicNameEn,
      address: settings.address,
      phone: settings.phone,
      openingHours: settings.openingHours,
      closedDay: settings.closedDay,
      headerBgColor: settings.headerBgColor,
      pharmacyInfo: settings.pharmacyInfo,
    }).catch(() => {});
    if (showToast) {
      setToast({ type: 'success', message: 'Clinic settings updated.' });
    }
  }, []);

  return (
    <ClinicContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        patients,
        queue,
        templates,
        clinicSettings,
        toast,
        setToast,
        addPatient,
        addToQueue,
        updateQueueStatus,
        removeFromQueue,
        registerAndEnqueue,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        toggleFavoriteTemplate,
        duplicateTemplate,
        updateClinicSettings,
      }}
    >
      {children}
    </ClinicContext.Provider>
  );
};

export const useClinic = () => {
  const context = useContext(ClinicContext);
  if (context === undefined) {
    throw new Error('useClinic must be used within a ClinicProvider');
  }
  return context;
};
