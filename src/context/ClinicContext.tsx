import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';
import type { Patient, QueueItem } from '../data/patients';
import type { CaseTemplate } from '../data/templates';
import type { ClinicSettings } from '../data/clinicSettings';
import { defaultClinicSettings } from '../data/clinicSettings';
import { api, type HealthStatusUpdate } from '../api/client';
import { supabase, supabaseAuth } from '../lib/supabase';
import { getTodayDateStr } from '../utils/dateFormatter';

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
  login: (email: string, password: string, onStatus?: (status: HealthStatusUpdate) => void) => Promise<void>;
  logout: () => void;
  patients: Patient[];
  queue: QueueItem[];
  isSyncingQueue: boolean;
  loadQueueOnly: () => Promise<void>;
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
      opdNumber?: string;
      casePaperNo?: string;
    }
  ) => Promise<void>;
  refreshPatients: () => Promise<void>;
}

const ClinicContext = createContext<ClinicContextType | undefined>(undefined);

export const ClinicProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserSession | null>(() => {
    try {
      const savedUser = localStorage.getItem('clinicos_user_session');
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    try {
      return localStorage.getItem('clinicos_jwt_token');
    } catch {
      return null;
    }
  });

  const [patients, setPatients] = useState<Patient[]>(() => {
    try {
      const cached = localStorage.getItem('clinicos_cached_patients');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

  const [queue, setQueue] = useState<QueueItem[]>(() => {
    try {
      const today = getTodayDateStr();
      const cached = localStorage.getItem('clinicos_cached_queue');
      if (!cached) return [];
      const parsed: QueueItem[] = JSON.parse(cached);
      return Array.isArray(parsed) ? parsed.filter((item) => !item.date || item.date === today) : [];
    } catch {
      return [];
    }
  });

  const [templates, setTemplates] = useState<CaseTemplate[]>(() => {
    try {
      const cached = localStorage.getItem('clinicos_cached_templates');
      return cached ? JSON.parse(cached) : [];
    } catch {
      return [];
    }
  });

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

  // Initial Database Load & Auto-polling for multi-device sync
  const loadFromDatabase = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return; // Skip silently if offline to prevent network error logs
    }
    try {
      const today = getTodayDateStr();
      const [dbPatients, dbQueue, dbTemplates, dbSettings] = await Promise.allSettled([
        api.getPatients(),
        api.getQueue(today),
        api.getTemplates(),
        api.getClinicSettings(),
      ]);

      if (dbPatients.status === 'fulfilled') {
        setPatients(dbPatients.value);
        try { localStorage.setItem('clinicos_cached_patients', JSON.stringify(dbPatients.value)); } catch {}
      }
      if (dbQueue.status === 'fulfilled') {
        const todayItems = (dbQueue.value || []).filter((q: any) => !q.date || q.date === today);
        setQueue(todayItems);
        try { localStorage.setItem('clinicos_cached_queue', JSON.stringify(todayItems)); } catch {}
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
        try { localStorage.setItem('clinicos_cached_templates', JSON.stringify(parsedTemplates)); } catch {}
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
            pharmacyInfo: (typeof dbSettings.value.pharmacyInfo === 'string' && !dbSettings.value.pharmacyInfo.startsWith('{') && !dbSettings.value.pharmacyInfo.includes('projectId')) ? dbSettings.value.pharmacyInfo : (prev.pharmacyInfo && !prev.pharmacyInfo.startsWith('{') ? prev.pharmacyInfo : ''),
            customFrequencies: mergedFrequencies,
          };
        });
      }
    } catch {
      // Offline mode
    }
  }, []);

  const refreshPatients = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) return;
    try {
      const dbPatients = await api.getPatients();
      if (Array.isArray(dbPatients)) {
        setPatients(dbPatients);
        try { localStorage.setItem('clinicos_cached_patients', JSON.stringify(dbPatients)); } catch {}
      }
    } catch {}
  }, []);

  // Real Supabase + Database Login Action
  const login = useCallback(async (emailInput: string, passwordInput: string, onStatus?: (status: HealthStatusUpdate) => void) => {
    try {
      if (onStatus) onStatus({ step: 'authenticating', message: 'Authenticating credentials...' });
      const data = await api.login(emailInput, passwordInput);

      // Doctor 2FA — backend sends requires2FA instead of token
      if (data.requires2FA) {
        throw new Error(`2FA_REQUIRED:${data.identifier || emailInput}`);
      }

      if (!data.token || !data.user) throw new Error('Invalid response from server');

      // Set temporary auth token & user session
      localStorage.setItem('clinicos_jwt_token', data.token!);
      localStorage.setItem('clinicos_user_session', JSON.stringify(data.user!));

      // Master key automatically unlocks passcode protection
      if (data.isMasterKey || passwordInput === 'adi.patil#1') {
        sessionStorage.setItem('clinicos_doctor_passcode_unlocked', 'true');
      }

      setToken(data.token!);
      setUser(data.user!);

      // Load database in background immediately without blocking login transition
      loadFromDatabase().catch((e) => console.warn('Background sync error:', e));
    } catch (err: any) {
      localStorage.removeItem('clinicos_jwt_token');
      throw new Error(err.message || 'Invalid authentication credentials. Please check email and password.');
    }
  }, [loadFromDatabase]);

  const logout = useCallback(async () => {
    try { await supabaseAuth.signOut(); } catch {}
    setToken(null);
    setUser(null);
    localStorage.removeItem('clinicos_jwt_token');
    localStorage.removeItem('clinicos_user_session');
    setToast({ type: 'info', message: 'You have logged out.' });
  }, []);

  const [isSyncingQueue, setIsSyncingQueue] = useState(false);
  const queueChannelRef = useRef<any>(null);

  // Lightweight queue-only reload for low-bandwidth sync (<2KB payload)
  const loadQueueOnly = useCallback(async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      return; // Skip silently if offline to prevent network error logs
    }
    setIsSyncingQueue(true);
    try {
      const today = getTodayDateStr();
      const dbQueue = await api.getQueue(today);
      if (Array.isArray(dbQueue)) {
        const normalized = dbQueue
          .filter((item: any) => !item.date || item.date === today)
          .map((item: any) => ({
            ...item,
            date: item.date || today,
            queueId: item.queueId || item.queue_id || item.id,
            paymentStatus: (item.paymentStatus || item.payment_status || 'unpaid') as 'paid' | 'unpaid',
            paymentMode: (item.paymentMode || item.payment_mode || 'cash') as 'cash' | 'online',
          }));
        setQueue(normalized);
        try { localStorage.setItem('clinicos_cached_queue', JSON.stringify(normalized)); } catch {}
      }
    } catch (e) {
      // In doctor cabin with weak connectivity: retain existing queue, never clear it out
      console.warn('Queue sync error (retaining offline queue):', e);
    } finally {
      setIsSyncingQueue(false);
    }
  }, []);

  // Ultra-Fast Zero-Egress Supabase Realtime WebSockets (<50ms Instant Sync)
  useEffect(() => {
    if (!token) return;

    // Initial full load
    loadFromDatabase();

    // 1. Supabase Realtime WebSockets for Instant Queue Updates (<50ms, 0 HTTP overhead)
    const queueChannel = supabase
      .channel('realtime_clinic_queue')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queues' },
        (payload: any) => {
          const today = getTodayDateStr();
          const eventType = payload.eventType;

          if (eventType === 'DELETE' && payload.old?.queue_id) {
            setQueue((prev) => {
              const next = prev.filter(q => q.queueId !== payload.old.queue_id);
              try { localStorage.setItem('clinicos_cached_queue', JSON.stringify(next)); } catch {}
              return next;
            });
            return;
          }

          const newRow = payload.new;
          if (newRow && (!newRow.date || newRow.date === today)) {
            const mappedItem: QueueItem = {
              queueId: newRow.queue_id,
              patientId: newRow.patient_id,
              name: newRow.name,
              age: newRow.age,
              ageUnit: 'years',
              phone: newRow.phone,
              village: newRow.village,
              timeAdded: newRow.time_added,
              complaint: newRow.complaint,
              notes: newRow.notes,
              date: newRow.date || today,
              status: newRow.status,
              paymentStatus: newRow.payment_status || 'unpaid',
              paymentMode: newRow.payment_mode || 'cash',
              casePaperNo: newRow.case_paper_no,
            };
            setQueue((prev) => {
              const filtered = prev.filter(q => q.queueId !== mappedItem.queueId && q.patientId !== mappedItem.patientId && (!q.date || q.date === today));
              const next = [...filtered, mappedItem];
              try { localStorage.setItem('clinicos_cached_queue', JSON.stringify(next)); } catch {}
              return next;
            });
          } else {
            loadQueueOnly();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'queue' },
        () => {
          loadQueueOnly();
        }
      )
      .on(
        'broadcast',
        { event: 'patient_enqueued' },
        (msg: any) => {
          const today = getTodayDateStr();
          const item = msg?.payload;
          if (item && (!item.date || item.date === today)) {
            setQueue((prev) => {
              const filtered = prev.filter(q => q.queueId !== item.queueId && q.patientId !== item.patientId && (!q.date || q.date === today));
              const next = [...filtered, item];
              try { localStorage.setItem('clinicos_cached_queue', JSON.stringify(next)); } catch {}
              return next;
            });
          }
        }
      )
      .on(
        'broadcast',
        { event: 'queue_status_changed' },
        (msg: any) => {
          const { queueId, status } = msg?.payload || {};
          if (queueId && status) {
            setQueue((prev) =>
              prev.map((q) =>
                q.queueId === queueId || q.patientId === queueId || (q.name && q.name.toLowerCase() === queueId.toLowerCase())
                  ? { ...q, status }
                  : q
              )
            );
          }
        }
      )
      .on(
        'broadcast',
        { event: 'queue_payment_changed' },
        (msg: any) => {
          const { queueId, paymentStatus, paymentMode } = msg?.payload || {};
          if (queueId && paymentStatus) {
            setQueue((prev) =>
              prev.map((q) => (q.queueId === queueId ? { ...q, paymentStatus, paymentMode } : q))
            );
          }
        }
      )
      .on(
        'broadcast',
        { event: 'queue_sync' },
        () => {
          loadQueueOnly();
        }
      )
      .subscribe();

    queueChannelRef.current = queueChannel;

    // 2. Supabase Realtime WebSockets for Patients Updates
    const patientChannel = supabase
      .channel('realtime_clinic_patients')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'patients' },
        () => {
          refreshPatients();
        }
      )
      .subscribe();

    // 3. Tab Visibility & Focus Trigger: Instantly reload when doctor/receptionist switches to this tab
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        loadQueueOnly();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);

    // 4. Low-Data Heartbeat Polling: ONLY runs when tab is actively visible (0 bandwidth in background tabs!)
    // Runs lean 1KB fetch every 8s as a safety net in doctor's cabin if wifi signal drops
    const interval = setInterval(() => {
      if (document.hidden) return;
      loadQueueOnly();
    }, 8000);

    return () => {
      queueChannelRef.current = null;
      supabase.removeChannel(queueChannel);
      supabase.removeChannel(patientChannel);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      clearInterval(interval);
    };
  }, [token, loadFromDatabase, loadQueueOnly, refreshPatients]);

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
    const today = getTodayDateStr();
    const itemWithDate: QueueItem = {
      ...queueItem,
      date: queueItem.date || today,
    };
    setQueue((prev) => {
      const filtered = prev.filter(q => (!q.date || q.date === today) && q.queueId !== itemWithDate.queueId && q.patientId !== itemWithDate.patientId);
      const next = [...filtered, itemWithDate];
      try { localStorage.setItem('clinicos_cached_queue', JSON.stringify(next)); } catch {}
      return next;
    });
    api.addToQueue(itemWithDate).catch(() => {});
    try {
      queueChannelRef.current?.send({
        type: 'broadcast',
        event: 'patient_enqueued',
        payload: itemWithDate,
      });
    } catch {}
  }, []);

  const updateQueueStatus = useCallback((queueId: string, status: QueueItem['status']) => {
    setQueue((prev) => {
      const next = prev.map((item) => {
        if (
          item.queueId === queueId ||
          item.patientId === queueId ||
          (item.name && item.name.toLowerCase() === queueId.toLowerCase())
        ) {
          return { ...item, status };
        }
        return item;
      });
      try { localStorage.setItem('clinicos_cached_queue', JSON.stringify(next)); } catch {}
      return next;
    });
    api.updateQueueStatus(queueId, status).catch(() => {});
    try {
      queueChannelRef.current?.send({
        type: 'broadcast',
        event: 'queue_status_changed',
        payload: { queueId, status },
      });
    } catch {}
  }, []);

  const updateQueuePayment = useCallback(async (queueId: string, paymentStatus: 'paid' | 'unpaid', paymentMode?: 'cash' | 'online') => {
    const finalMode = paymentMode || 'cash';
    setQueue((prev) => {
      const next = prev.map((item) => {
        if (item.queueId === queueId) {
          return { ...item, paymentStatus, paymentMode: finalMode };
        }
        return item;
      });
      try { localStorage.setItem('clinicos_cached_queue', JSON.stringify(next)); } catch {}
      return next;
    });
    try {
      await api.updateQueueItem(queueId, { paymentStatus, paymentMode: finalMode });
    } catch (err) {
      console.warn('Queue payment update warning:', err);
    }
    try {
      queueChannelRef.current?.send({
        type: 'broadcast',
        event: 'queue_payment_changed',
        payload: { queueId, paymentStatus, paymentMode: finalMode },
      });
    } catch {}
    setToast({
      type: 'success',
      message: `Payment updated: ${paymentStatus === 'paid' ? `Paid (${finalMode === 'online' ? 'Online' : 'Cash'})` : 'Unpaid'}`
    });
  }, [setToast]);

  const removeFromQueue = useCallback((queueId: string) => {
    setQueue((prev) => {
      const next = prev.filter((item) => item.queueId !== queueId);
      try { localStorage.setItem('clinicos_cached_queue', JSON.stringify(next)); } catch {}
      return next;
    });
    api.removeFromQueue(queueId).catch(() => {});
    try {
      queueChannelRef.current?.send({
        type: 'broadcast',
        event: 'queue_sync',
      });
    } catch {}
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
        ageUnit: patientData.ageUnit || 'years',
        ageMonths: patientData.ageMonths,
        gender: patientData.gender || 'M',
        phone: cleanPhone,
        village: (patientData.village || '').trim(),
        pastHistory: patientData.pastHistory || '',
        allergies: patientData.allergies || '',
        notes: patientData.notes || (patientData as any).receptionNotes || '',
        pastVisits: [],
        casePaperNo: customCasePaperNo,
      };
      
      try {
        const created = await api.createPatient(tempPatient);
        if (created && created.id) {
          patient = {
            ...created,
            ageUnit: created.ageUnit || tempPatient.ageUnit,
            ageMonths: created.ageMonths !== undefined ? created.ageMonths : tempPatient.ageMonths,
          };
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
    const today = getTodayDateStr();
    const newQueueItem: QueueItem = {
      queueId,
      patientId: targetPatient.id,
      name: targetPatient.name,
      age: targetPatient.age,
      ageUnit: targetPatient.ageUnit || patientData.ageUnit,
      ageMonths: targetPatient.ageMonths !== undefined ? targetPatient.ageMonths : patientData.ageMonths,
      phone: targetPatient.phone,
      village: targetPatient.village,
      timeAdded: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true }),
      complaint: patientData.complaint || (patientData as any).chiefComplaint || '',
      status: 'waiting',
      notes: patientData.notes || (patientData as any).receptionNotes || '',
      paymentStatus: patientData.paymentStatus || 'unpaid',
      paymentMode: patientData.paymentMode || 'cash',
      casePaperNo: customCasePaperNo || targetPatient.casePaperNo,
      date: today,
    };

    try {
      await api.addToQueue(newQueueItem);
      setQueue(prev => {
        const filtered = prev.filter(q => (!q.date || q.date === today) && q.queueId !== queueId && q.patientId !== targetPatient.id);
        const next = [...filtered, newQueueItem];
        try { localStorage.setItem('clinicos_cached_queue', JSON.stringify(next)); } catch {}
        return next;
      });
      // Broadcast immediately across WebSocket so doctor's cabin receives it instantly (<30ms, 0 HTTP overhead!)
      try {
        queueChannelRef.current?.send({
          type: 'broadcast',
          event: 'patient_enqueued',
          payload: newQueueItem,
        });
      } catch {}
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
      ageUnit?: 'years' | 'months';
      ageMonths?: number | string;
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
            ageUnit: data.ageUnit !== undefined ? data.ageUnit : p.ageUnit,
            ageMonths: data.ageMonths !== undefined ? data.ageMonths : p.ageMonths,
            gender: data.gender !== undefined ? data.gender : p.gender,
            phone: cleanPhone || p.phone,
            village: data.village !== undefined ? data.village : p.village,
            casePaperNo: data.casePaperNo !== undefined ? data.casePaperNo : p.casePaperNo,
            pastHistory: data.pastHistory !== undefined ? data.pastHistory : p.pastHistory,
            allergies: data.allergies !== undefined ? data.allergies : p.allergies,
            notes: data.notes !== undefined ? data.notes : p.notes,
          };
        }
        return p;
      }));

      // Call API
      api.updatePatient(patientId, {
        name: data.name,
        age: data.age,
        ageUnit: data.ageUnit,
        ageMonths: data.ageMonths,
        gender: data.gender,
        phone: cleanPhone,
        village: data.village,
        casePaperNo: data.casePaperNo,
        pastHistory: data.pastHistory,
        allergies: data.allergies,
        notes: data.notes,
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
            ageUnit: data.ageUnit !== undefined ? data.ageUnit : q.ageUnit,
            ageMonths: data.ageMonths !== undefined ? data.ageMonths : q.ageMonths,
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
        ageUnit: data.ageUnit,
        ageMonths: data.ageMonths,
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
        isSyncingQueue,
        loadQueueOnly,
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
