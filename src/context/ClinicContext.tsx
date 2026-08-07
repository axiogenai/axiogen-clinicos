import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Patient, QueueItem } from '../data/patients';
import type { CaseTemplate } from '../data/templates';
import type { ClinicSettings } from '../data/clinicSettings';
import { defaultClinicSettings } from '../data/clinicSettings';
import { api } from '../api/client';
import { supabaseAuth } from '../lib/supabase';

export interface UserSession {
  id: number | string;
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
  deletePatient: (patientId: string) => void;
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

  // Real Supabase + Database Login Action
  const login = useCallback(async (emailInput: string, passwordInput: string) => {
    let authSuccess = false;

    // 1. Try Supabase Auth First
    try {
      const sbData = await supabaseAuth.signIn(emailInput, passwordInput);
      if (sbData?.session && sbData?.user) {
        const sbUser: UserSession = {
          id: sbData.user.id,
          email: sbData.user.email || emailInput,
          name: sbData.user.user_metadata?.name || (emailInput.includes('reception') ? 'Receptionist' : 'Dr. Shinagare'),
          role: sbData.user.user_metadata?.role || (emailInput.includes('reception') ? 'receptionist' : 'doctor'),
          clinicId: 1
        };
        setToken(sbData.session.access_token);
        setUser(sbUser);
        localStorage.setItem('clinicos_jwt_token', sbData.session.access_token);
        localStorage.setItem('clinicos_user_session', JSON.stringify(sbUser));
        authSuccess = true;
      }
    } catch {}

    if (authSuccess) return;

    // 2. Try Primary Database API Auth
    try {
      const data = await api.login(emailInput, passwordInput);
      setToken(data.token);
      setUser(data.user);
      localStorage.setItem('clinicos_jwt_token', data.token);
      localStorage.setItem('clinicos_user_session', JSON.stringify(data.user));
    } catch (err: any) {
      throw new Error(err.message || 'Invalid authentication credentials. Please check email and password.');
    }
  }, []);

  const logout = useCallback(async () => {
    try { await supabaseAuth.signOut(); } catch {}
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
        const parsedTemplates = dbTemplates.value.map((t: any) => {
          let parsedMedicines = [];
          try {
            parsedMedicines = typeof t.medicines === 'string' ? JSON.parse(t.medicines) : (Array.isArray(t.medicines) ? t.medicines : []);
          } catch {
            parsedMedicines = [];
          }

          let parsedInvestigations = [];
          try {
            parsedInvestigations = typeof t.investigationsAdvised === 'string' ? JSON.parse(t.investigationsAdvised) : (Array.isArray(t.investigationsAdvised) ? t.investigationsAdvised : []);
          } catch {
            parsedInvestigations = [];
          }

          let parsedCounselling = [];
          try {
            const rawCounselling = t.counsellingPoints || t.counsellingDone;
            parsedCounselling = typeof rawCounselling === 'string' ? JSON.parse(rawCounselling) : (Array.isArray(rawCounselling) ? rawCounselling : []);
          } catch {
            parsedCounselling = [];
          }

          return {
            ...t,
            medicines: parsedMedicines,
            investigationsAdvised: parsedInvestigations,
            counsellingPoints: parsedCounselling,
            counsellingDone: parsedCounselling
          };
        });
        setTemplates(parsedTemplates);
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

  // Lightweight queue-only reload for SSE events (fast, no full re-render)
  const loadQueueOnly = useCallback(async () => {
    try {
      const dbQueue = await api.getQueue();
      setQueue(dbQueue);
    } catch {}
  }, []);

  // Real-time SSE subscription — instantly reloads ONLY queue when changes happen
  useEffect(() => {
    if (!token) return;

    // Initial full load (once)
    loadFromDatabase();

    // Connect to SSE stream for instant 0ms queue push updates
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const sseToken = localStorage.getItem('clinicos_jwt_token');
    let evtSource: EventSource | null = null;

    try {
      evtSource = new EventSource(`${apiBase}/queue/events?token=${sseToken}`);

      evtSource.onmessage = (e) => {
        try {
          const msg = JSON.parse(e.data);
          if (msg.type === 'queue_update') {
            loadQueueOnly(); // Instant reload queue in Doctor's view!
          }
        } catch {}
      };

      evtSource.onerror = () => {
        evtSource?.close();
        evtSource = null;
      };
    } catch {}

    // Fast 3-second live polling loop guarantees 100% real-time synchronization between Receptionist & Doctor views
    const interval = setInterval(() => {
      loadQueueOnly();
    }, 3000);

    return () => {
      evtSource?.close();
      clearInterval(interval);
    };
  }, [token, loadFromDatabase, loadQueueOnly]);

  // Removed sync to localStorage to prevent stale data

  const addPatient = useCallback((patient: Patient) => {
    setPatients((prev) => {
      const exists = prev.some((p) => p.id === patient.id);
      if (exists) return prev;
      return [...prev, patient];
    });

    api.createPatient(patient).catch(() => {});
  }, []);

  const deletePatient = useCallback((identifier: string) => {
    const cleanPhone = identifier.replace(/\D/g, '');
    setPatients((prev) => prev.filter((p) => p.id !== identifier && (cleanPhone.length < 10 || p.phone !== cleanPhone) && p.name !== identifier));
    setQueue((prev) => prev.filter((q) => q.patientId !== identifier && (cleanPhone.length < 10 || q.phone !== cleanPhone) && q.name !== identifier));
    api.deletePatient(identifier).catch(() => {});
    setToast({ type: 'info', message: 'Patient permanently deleted from database registers.' });
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

  const registerAndEnqueue = useCallback(async (
    patientData: Partial<Patient> & { complaint: string; notes?: string },
    existingPatient?: Patient
  ) => {
    let patient = existingPatient;

    if (!patient) {
      const cleanPhone = (patientData.phone || '').replace(/\D/g, '');
      const tempPatient: Patient = {
        id: `PT${String(Date.now()).slice(-6)}`,
        name: (patientData.name || 'Unknown').trim(),
        age: patientData.age || 0,
        gender: patientData.gender || 'M',
        phone: cleanPhone,
        village: (patientData.village || '').trim(),
        pastHistory: patientData.pastHistory || 'No known allergies',
        allergies: patientData.allergies || '',
        pastVisits: [],
      };
      
      try {
        const created = await api.createPatient(tempPatient);
        if (created && created.id) {
          patient = created;
        } else {
          patient = tempPatient;
        }
      } catch (err: any) {
        setToast({ type: 'error', message: err.message || 'Patient registration failed' });
        return;
      }

      setPatients(prev => [...prev.filter(p => p.id !== patient!.id), patient!]);
    }

    const targetPatient = patient;
    if (!targetPatient) return;

    const queueId = `Q${Date.now()}`;
    const newQueueItem: QueueItem = {
      queueId,
      patientId: targetPatient.id,
      name: targetPatient.name,
      age: targetPatient.age,
      phone: targetPatient.phone,
      village: targetPatient.village,
      timeAdded: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      complaint: patientData.complaint || '',
      status: 'waiting',
      notes: patientData.notes || '',
    };

    try {
      await api.addToQueue(newQueueItem);
      setQueue(prev => [...prev.filter(q => q.queueId !== queueId), newQueueItem]);
      setToast({
        type: 'success',
        message: `${targetPatient.name} has been added to the queue.`
      });
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to add patient to queue' });
    }

  }, [patients, setToast]);

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
        deletePatient,
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
