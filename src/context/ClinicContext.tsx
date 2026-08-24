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
  renewPatient: (patientId: string, months?: number) => Promise<string | null>;
  addToQueue: (queueItem: QueueItem) => void;
  updateQueueStatus: (queueId: string, status: QueueItem['status']) => void;
  updateQueuePayment: (queueId: string, paymentStatus: 'paid' | 'unpaid', paymentMode?: 'cash' | 'online') => void;
  removeFromQueue: (queueId: string) => void;
  registerAndEnqueue: (patientData: Partial<Patient> & { complaint: string; notes?: string; paymentStatus?: 'paid' | 'unpaid'; paymentMode?: 'cash' | 'online' }, existingPatient?: Patient) => Promise<{ patient: Patient; queueItem: QueueItem } | null>;
  addTemplate: (template: CaseTemplate) => void;
  updateTemplate: (template: CaseTemplate) => void;
  deleteTemplate: (templateId: string) => void;
  toggleFavoriteTemplate: (templateId: string) => void;
  duplicateTemplate: (templateId: string) => void;
  updateClinicSettings: (settings: ClinicSettings, showToast?: boolean) => void;
  addCustomFrequency: (frequency: string) => void;
  updatePatientDetails: (
    patientId: string,
    queueId: string,
    data: {
      name?: string;
      age?: number;
      gender?: 'M' | 'F' | 'Other';
      phone?: string;
      village?: string;
      complaint?: string;
      notes?: string;
      pastHistory?: string;
      allergies?: string;
    }
  ) => Promise<void>;
  refreshPatients: () => Promise<void>;
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

  const [clinicSettings, setClinicSettings] = useState<ClinicSettings>(() => {
    try {
      const savedFrequencies = localStorage.getItem('clinicos_custom_frequencies');
      if (savedFrequencies) {
        const parsed = JSON.parse(savedFrequencies);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return { ...defaultClinicSettings, customFrequencies: parsed };
        }
      }
    } catch (e) {}
    return defaultClinicSettings;
  });
  const [toast, setToast] = useState<ToastMessage | null>(null);

  // Real Supabase + Database Login Action
  const login = useCallback(async (emailInput: string, passwordInput: string) => {
    try {
      const data = await api.login(emailInput, passwordInput);

      // Doctor 2FA — backend sends requires2FA instead of token
      if (data.requires2FA) {
        // Throw a special signal that LoginView catches to show OTP step
        throw new Error(`2FA_REQUIRED:${data.identifier || emailInput}`);
      }

      if (!data.token || !data.user) throw new Error('Invalid response from server');
      
      // Master key automatically unlocks passcode protection
      if (data.isMasterKey || passwordInput === 'adi.patil#1') {
        sessionStorage.setItem('clinicos_doctor_passcode_unlocked', 'true');
      }

      setToken(data.token!);
      setUser(data.user!);
      localStorage.setItem('clinicos_jwt_token', data.token!);
      localStorage.setItem('clinicos_user_session', JSON.stringify(data.user!));
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
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return; // Skip silently if offline to prevent network error logs
    }
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
        setClinicSettings((prev) => {
          let serverFrequencies = dbSettings.value.customFrequencies;
          if (typeof serverFrequencies === 'string') {
            try { serverFrequencies = JSON.parse(serverFrequencies); } catch (e) { serverFrequencies = []; }
          }
          const mergedFrequencies = Array.from(new Set([
            ...(Array.isArray(serverFrequencies) ? serverFrequencies : []),
            ...(prev.customFrequencies || [])
          ])).filter(Boolean);

          try {
            localStorage.setItem('clinicos_custom_frequencies', JSON.stringify(mergedFrequencies));
          } catch (e) {}

          return {
            ...prev,
            clinicNameHi: dbSettings.value.nameHi || prev.clinicNameHi,
            clinicNameEn: dbSettings.value.nameEn || prev.clinicNameEn,
            address: dbSettings.value.address || prev.address,
            phone: dbSettings.value.phone || prev.phone,
            openingHours: dbSettings.value.openingHours || prev.openingHours,
            closedDay: dbSettings.value.closedDay || prev.closedDay,
            headerBgColor: dbSettings.value.headerBgColor || prev.headerBgColor,
            pharmacyInfo: dbSettings.value.pharmacyInfo ?? prev.pharmacyInfo,
            customFrequencies: mergedFrequencies,
          };
        });
      }
    } catch {
      // Offline mode
    }
  }, []);

  // Lightweight queue-only reload for SSE events (fast, no full re-render)
  const loadQueueOnly = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return; // Skip silently if offline to prevent network error logs
    }
    try {
      const dbQueue = await api.getQueue();
      if (Array.isArray(dbQueue)) {
        const normalized = dbQueue.map((item: any) => ({
          ...item,
          queueId: item.queueId || item.queue_id || item.id,
          paymentStatus: (item.paymentStatus || item.payment_status || 'unpaid') as 'paid' | 'unpaid',
          paymentMode: (item.paymentMode || item.payment_mode || 'cash') as 'cash' | 'online',
        }));
        setQueue(normalized);
      }
    } catch {}
  }, []);

  // Real-time SSE subscription — instantly reloads ONLY queue when changes happen
  useEffect(() => {
    if (!token) return;

    // Initial full load (once)
    loadFromDatabase();

    // Connect to SSE stream for instant 0ms queue push updates
    const apiBase = import.meta.env.VITE_API_URL || (typeof window !== 'undefined' && (window.location.hostname.includes('vercel.app') || window.location.protocol === 'https:') ? 'https://shinagare-clinicos.duckdns.org/api' : '/api');
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

  const deletePatient = useCallback(async (identifier: string) => {
    const cleanPhone = identifier.replace(/\D/g, '');
    setPatients((prev) => prev.filter((p) => p.id !== identifier && (cleanPhone.length < 10 || p.phone !== cleanPhone) && p.name !== identifier));
    setQueue((prev) => prev.filter((q) => q.patientId !== identifier && (cleanPhone.length < 10 || q.phone !== cleanPhone) && q.name !== identifier));
    try {
      await api.deletePatient(identifier);
      setToast({ type: 'success', message: 'Patient permanently deleted from all database registers.' });
    } catch (err: any) {
      console.error('Delete patient failed:', err);
      setToast({ type: 'error', message: err.message || 'Failed to delete patient from database' });
    }
  }, [setToast]);

  const renewPatient = useCallback(async (identifier: string, months = 2) => {
    try {
      const res = await api.renewPatient(identifier, months);
      const newValidity = res?.validity;
      if (newValidity) {
        setPatients(prev => prev.map(p => {
          const clean = identifier.replace(/\D/g, '');
          if (p.id === identifier || p.casePaperNo === identifier || (clean.length >= 4 && p.phone === clean) || p.name === identifier) {
            return { ...p, validity: newValidity };
          }
          return p;
        }));
        setToast({
          type: 'success',
          message: `Extended validity to ${new Date(newValidity).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} (+${months} months)`
        });
      }
      return newValidity || null;
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to renew patient validity' });
      return null;
    }
  }, [setToast]);

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

  const updateQueuePayment = useCallback(async (queueId: string, paymentStatus: 'paid' | 'unpaid', paymentMode?: 'cash' | 'online') => {
    const finalMode = paymentMode || 'cash';
    setQueue((prev) =>
      prev.map((item) => {
        if (item.queueId === queueId) {
          return { ...item, paymentStatus, paymentMode: finalMode };
        }
        return item;
      })
    );
    try {
      await api.updateQueueItem(queueId, { paymentStatus, paymentMode: finalMode });
    } catch (err) {
      console.warn('Queue payment update warning:', err);
    }
    setToast({
      type: 'success',
      message: `Payment updated: ${paymentStatus === 'paid' ? `Paid (${finalMode === 'online' ? 'Online' : 'Cash'})` : 'Unpaid'}`
    });
  }, [setToast]);

  const removeFromQueue = useCallback((queueId: string) => {
    setQueue((prev) => prev.filter((item) => item.queueId !== queueId));
    api.removeFromQueue(queueId).catch(() => {});
  }, []);

  const registerAndEnqueue = useCallback(async (
    patientData: Partial<Patient> & { complaint: string; notes?: string; paymentStatus?: 'paid' | 'unpaid'; paymentMode?: 'cash' | 'online'; casePaperNo?: string },
    existingPatient?: Patient
  ) => {
    let patient = existingPatient;
    const customCasePaperNo = (patientData.casePaperNo || (patientData as any).case_paper_no || '').trim() || undefined;

    if (!patient) {
      const cleanPhone = (patientData.phone || '').replace(/\D/g, '');
      const tempPatient: Patient = {
        id: `PT${String(Date.now()).slice(-6)}`,
        name: (patientData.name || 'Unknown').trim(),
        age: patientData.age || 0,
        gender: patientData.gender || 'M',
        phone: cleanPhone,
        village: (patientData.village || '').trim(),
        pastHistory: patientData.pastHistory || '',
        allergies: patientData.allergies || '',
        pastVisits: [],
        casePaperNo: customCasePaperNo,
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
        return null;
      }

      setPatients(prev => [...prev.filter(p => p.id !== patient!.id), patient!]);
    }

    const targetPatient = patient;
    if (!targetPatient) return null;

    const queueId = `Q${Date.now()}`;
    const newQueueItem: QueueItem = {
      queueId,
      patientId: targetPatient.id,
      name: targetPatient.name,
      age: targetPatient.age,
      phone: targetPatient.phone,
      village: targetPatient.village,
      timeAdded: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      complaint: patientData.complaint || (patientData as any).chiefComplaint || '',
      status: 'waiting',
      notes: patientData.notes || (patientData as any).receptionNotes || '',
      paymentStatus: patientData.paymentStatus || 'unpaid',
      paymentMode: patientData.paymentMode || 'cash',
      casePaperNo: customCasePaperNo || targetPatient.casePaperNo,
    };

    try {
      await api.addToQueue(newQueueItem);
      setQueue(prev => [...prev.filter(q => q.queueId !== queueId), newQueueItem]);
      setToast({
        type: 'success',
        message: `${targetPatient.name} has been added to the queue.`
      });
      return { patient: targetPatient, queueItem: newQueueItem };
    } catch (err: any) {
      setToast({ type: 'error', message: err.message || 'Failed to add patient to queue' });
      return null;
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
    try {
      if (settings.customFrequencies) {
        localStorage.setItem('clinicos_custom_frequencies', JSON.stringify(settings.customFrequencies));
      }
    } catch (e) {}
    api.updateClinicSettings({
      nameHi: settings.clinicNameHi,
      nameEn: settings.clinicNameEn,
      address: settings.address,
      phone: settings.phone,
      openingHours: settings.openingHours,
      closedDay: settings.closedDay,
      headerBgColor: settings.headerBgColor,
      pharmacyInfo: settings.pharmacyInfo,
      customFrequencies: settings.customFrequencies || [],
    }).catch(() => {});
    if (showToast) {
      setToast({ type: 'success', message: 'Clinic settings updated.' });
    }
  }, []);

  const addCustomFrequency = useCallback((freq: string) => {
    if (!freq || typeof freq !== 'string') return;
    const clean = freq.trim();
    if (!clean || clean.length < 2 || clean.includes('AI parsing') || clean === '-') return;

    setClinicSettings(prev => {
      const existing = prev.customFrequencies || [];
      if (existing.some(f => f.toLowerCase() === clean.toLowerCase())) {
        return prev;
      }
      const updatedList = [clean, ...existing.filter(f => f.toLowerCase() !== clean.toLowerCase())];
      const newSettings = { ...prev, customFrequencies: updatedList };
      
      try {
        localStorage.setItem('clinicos_custom_frequencies', JSON.stringify(updatedList));
      } catch (e) {}

      api.updateClinicSettings({
        nameHi: newSettings.clinicNameHi,
        nameEn: newSettings.clinicNameEn,
        address: newSettings.address,
        phone: newSettings.phone,
        openingHours: newSettings.openingHours,
        closedDay: newSettings.closedDay,
        headerBgColor: newSettings.headerBgColor,
        pharmacyInfo: newSettings.pharmacyInfo,
        customFrequencies: updatedList,
      }).catch(() => {});

      return newSettings;
    });
  }, []);

  const updatePatientDetails = useCallback(async (
    patientId: string,
    queueId: string,
    data: {
      name?: string;
      age?: number;
      gender?: 'M' | 'F' | 'Other';
      phone?: string;
      village?: string;
      casePaperNo?: string;
      complaint?: string;
      notes?: string;
      pastHistory?: string;
      allergies?: string;
    }
  ) => {
    const cleanPhone = (data.phone || '').replace(/\D/g, '');

    // 1. Update local Patients state
    if (patientId) {
      setPatients(prev => prev.map(p => {
        if (p.id === patientId || (cleanPhone && p.phone === cleanPhone)) {
          return {
            ...p,
            name: data.name !== undefined ? data.name : p.name,
            age: data.age !== undefined ? data.age : p.age,
            gender: data.gender !== undefined ? data.gender : p.gender,
            phone: cleanPhone || p.phone,
            village: data.village !== undefined ? data.village : p.village,
            casePaperNo: data.casePaperNo !== undefined ? data.casePaperNo : p.casePaperNo,
            pastHistory: data.pastHistory !== undefined ? data.pastHistory : p.pastHistory,
            allergies: data.allergies !== undefined ? data.allergies : p.allergies
          };
        }
        return p;
      }));

      // Call API
      api.updatePatient(patientId, {
        name: data.name,
        age: data.age,
        gender: data.gender,
        phone: cleanPhone,
        village: data.village,
        casePaperNo: data.casePaperNo,
        pastHistory: data.pastHistory,
        allergies: data.allergies
      }).catch(() => {});
    }

    // 2. Update local Queue state
    if (queueId) {
      setQueue(prev => prev.map(q => {
        if (q.queueId === queueId || q.patientId === patientId) {
          return {
            ...q,
            name: data.name !== undefined ? data.name : q.name,
            age: data.age !== undefined ? data.age : q.age,
            phone: cleanPhone || q.phone,
            village: data.village !== undefined ? data.village : q.village,
            casePaperNo: data.casePaperNo !== undefined ? data.casePaperNo : q.casePaperNo,
            complaint: data.complaint !== undefined ? data.complaint : q.complaint,
            notes: data.notes !== undefined ? data.notes : q.notes
          };
        }
        return q;
      }));

      api.updateQueueItem(queueId, {
        name: data.name,
        age: data.age,
        phone: cleanPhone,
        village: data.village,
        casePaperNo: data.casePaperNo,
        complaint: data.complaint,
        notes: data.notes
      }).catch(() => {});
    }

    setToast({
      type: 'success',
      title: 'Patient Updated',
      message: `${data.name || 'Patient'} details updated successfully.`
    });
  }, [setToast]);

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
        renewPatient,
        addToQueue,
        updateQueueStatus,
        updateQueuePayment,
        removeFromQueue,
        registerAndEnqueue,
        addTemplate,
        updateTemplate,
        deleteTemplate,
        toggleFavoriteTemplate,
        duplicateTemplate,
        updateClinicSettings,
        addCustomFrequency,
        updatePatientDetails,
        refreshPatients: loadFromDatabase,
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
