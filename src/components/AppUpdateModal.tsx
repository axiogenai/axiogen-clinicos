import React, { useEffect, useState, useRef } from 'react';
import { RefreshCw, X, ArrowRight, Lock, MessageSquare, ShieldCheck, Megaphone } from 'lucide-react';
import { supabase } from '../lib/supabase';

export interface UpdatePayload {
  projectId: string;
  version: string;
  title: string;
  changelog: string[];
  mode: 'prompt' | 'force_refresh' | 'announcement' | 'maintenance';
  pricingType?: 'free' | 'paid';
  priceAmount?: string;
  whatsappContactNumber?: string;
  badgeLabel?: string;
  descriptionText?: string;
  buttonCtaText?: string;
  customWhatsAppMessage?: string;
  autoRefreshDelaySeconds?: number;
  timestamp: number;
}

// ════════════════════════════════════════════════════════════════════════════════
// 1. GLOBAL FAILSAFE SILENT FREEZE ENGINE
// Runs at module evaluation: active on ALL pages, including Login, Doctor, & Tracker
// ════════════════════════════════════════════════════════════════════════════════

let globalOverlayElement: HTMLDivElement | null = null;
let eventBlockerBound = false;

const blockedEvents = [
  'click', 'dblclick', 'mousedown', 'mouseup', 'pointerdown', 'pointerup',
  'touchstart', 'touchend', 'touchmove', 'contextmenu', 'wheel'
];

const blockInteraction = (e: Event) => {
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  return false;
};

const blockKeyCombo = (e: KeyboardEvent) => {
  // Emergency shortcut: Ctrl + Alt + Shift + U
  if (e.ctrlKey && e.altKey && e.shiftKey && (e.code === 'KeyU' || e.key === 'U' || e.key === 'u')) {
    console.log('[Dev] Emergency unfreeze triggered by shortcut');
    setGlobalFreeze(false);
    return;
  }
  e.preventDefault();
  e.stopPropagation();
  e.stopImmediatePropagation();
  return false;
};

export function setGlobalFreeze(active: boolean) {
  if (typeof window === 'undefined') return;

  if (active) {
    try { localStorage.setItem('clinicos_maintenance_hold', 'true'); } catch {}
    if (document.body) {
      document.body.style.overflow = 'hidden';
    }

    // Inject blocker overlay if not present
    if (!globalOverlayElement && document.body) {
      globalOverlayElement = document.createElement('div');
      globalOverlayElement.id = 'clinicos-global-freeze-curtain';
      globalOverlayElement.style.cssText = `
        position: fixed !important;
        inset: 0 !important;
        width: 100vw !important;
        height: 100vh !important;
        z-index: 2147483647 !important;
        background: transparent !important;
        cursor: default !important;
        user-select: none !important;
        pointer-events: auto !important;
      `;
      globalOverlayElement.addEventListener('click', blockInteraction, true);
      globalOverlayElement.addEventListener('mousedown', blockInteraction, true);
      globalOverlayElement.addEventListener('touchstart', blockInteraction, { passive: false, capture: true });
      globalOverlayElement.addEventListener('wheel', blockInteraction, { passive: false, capture: true });
      document.body.appendChild(globalOverlayElement);
    }

    if (!eventBlockerBound) {
      window.addEventListener('keydown', blockKeyCombo, true);
      window.addEventListener('keypress', blockKeyCombo, true);
      window.addEventListener('keyup', blockKeyCombo, true);
      blockedEvents.forEach(evt => window.addEventListener(evt, blockInteraction, { passive: false, capture: true }));
      eventBlockerBound = true;
    }
  } else {
    try { localStorage.removeItem('clinicos_maintenance_hold'); } catch {}
    if (document.body) {
      document.body.style.overflow = '';
    }

    if (globalOverlayElement && globalOverlayElement.parentNode) {
      globalOverlayElement.parentNode.removeChild(globalOverlayElement);
      globalOverlayElement = null;
    }

    if (eventBlockerBound) {
      window.removeEventListener('keydown', blockKeyCombo, true);
      window.removeEventListener('keypress', blockKeyCombo, true);
      window.removeEventListener('keyup', blockKeyCombo, true);
      blockedEvents.forEach(evt => window.removeEventListener(evt, blockInteraction, true));
      eventBlockerBound = false;
    }
  }
}

// Initialize immediately on bundle execution (works even before React components mount)
if (typeof window !== 'undefined') {
  try {
    if (localStorage.getItem('clinicos_maintenance_hold') === 'true') {
      if (document.body) {
        setGlobalFreeze(true);
      } else {
        window.addEventListener('DOMContentLoaded', () => setGlobalFreeze(true));
      }
    }
  } catch {}

  // Setup Global Realtime Channels & DB Poller
  const setupGlobalListeners = () => {
    try {
      const pChan = supabase.channel('axiogen_ota_axiogen-clinicos');
      pChan.on('broadcast', { event: 'start_maintenance' }, () => setGlobalFreeze(true));
      pChan.on('broadcast', { event: 'end_maintenance' }, () => setGlobalFreeze(false));
      pChan.on('broadcast', { event: 'force_hard_refresh' }, (r: any) => {
        if (r?.payload?.mode === 'maintenance') setGlobalFreeze(true);
      });
      pChan.subscribe();

      const gChan = supabase.channel('axiogen_ota_global');
      gChan.on('broadcast', { event: 'start_maintenance' }, () => setGlobalFreeze(true));
      gChan.on('broadcast', { event: 'end_maintenance' }, () => setGlobalFreeze(false));
      gChan.on('broadcast', { event: 'app_release_broadcast' }, (r: any) => {
        const p = r?.payload;
        if (p?.mode === 'maintenance' && (p.projectId === 'axiogen-clinicos' || p.projectId === 'all')) {
          setGlobalFreeze(true);
        }
      });
      gChan.subscribe();

      // Database poller fallback: runs every 2.5s globally
      const pollDb = async () => {
        try {
          const { data } = await supabase.from('clinics').select('sections').eq('id', 1).single();
          if (data?.sections) {
            const sections = typeof data.sections === 'string' ? JSON.parse(data.sections) : data.sections;
            const ota = sections?.ota_release;
            if (ota && ota.mode === 'maintenance') {
              setGlobalFreeze(true);
            } else {
              if (localStorage.getItem('clinicos_maintenance_hold') === 'true') {
                setGlobalFreeze(false);
              }
            }
          }
        } catch {}
      };

      pollDb();
      setInterval(pollDb, 2500);
    } catch (err) {
      console.warn('[OTA] Global listener error:', err);
    }
  };

  setupGlobalListeners();
}

// ════════════════════════════════════════════════════════════════════════════════
// 2. REACT COMPONENT: APP UPDATE MODAL (For standard visual releases)
// ════════════════════════════════════════════════════════════════════════════════

export const AppUpdateModal: React.FC = () => {
  const [updateData, setUpdateData] = useState<UpdatePayload | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const lastHandledTimestampRef = useRef<number>(0);

  const executeHardRefresh = async (overrideTimestamp?: number) => {
    const reloadGuardKey = 'clinicos_ota_reload_guard';
    const lastReloadTime = Number(sessionStorage.getItem(reloadGuardKey) || '0');
    if (Date.now() - lastReloadTime < 10000) {
      return;
    }
    sessionStorage.setItem(reloadGuardKey, String(Date.now()));

    const tsToSave = overrideTimestamp || updateData?.timestamp;
    if (tsToSave) {
      localStorage.setItem('clinicos_last_applied_ota_ts', String(tsToSave));
    }

    setIsUpdating(true);
    try {
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(k => caches.delete(k)));
      }
    } catch {}

    setTimeout(() => {
      window.location.reload();
    }, 150);
  };

  const handleWhatsAppUnlock = () => {
    if (!updateData) return;
    const phone = updateData.whatsappContactNumber || '918010127704';
    const message = updateData.customWhatsAppMessage || `Hello Axiogen Team, I want to unlock the new ${updateData.version} update ("${updateData.title}") for ₹${updateData.priceAmount || '4,999'} for Shingare ClinicOS. Please provide payment details and activate our license.`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  const processIncomingRelease = (payload: any) => {
    if (!payload) return;

    if (payload.mode === 'maintenance') {
      setGlobalFreeze(true);
      setUpdateData(null);
      return;
    }

    if (!payload.version || !payload.timestamp) return;

    const lastApplied = Number(localStorage.getItem('clinicos_last_applied_ota_ts') || '0');
    const dismissed = Number(localStorage.getItem('clinicos_dismissed_ota_ts') || '0');

    if (payload.timestamp <= lastApplied || payload.timestamp <= dismissed) {
      return;
    }

    if (payload.timestamp <= lastHandledTimestampRef.current) {
      return;
    }

    lastHandledTimestampRef.current = payload.timestamp;

    if (payload.mode === 'force_refresh') {
      const ageMs = Date.now() - payload.timestamp;
      const isFresh = ageMs >= 0 && ageMs < 60000;
      localStorage.setItem('clinicos_last_applied_ota_ts', String(payload.timestamp));

      if (isFresh) {
        executeHardRefresh(payload.timestamp);
      }
    } else {
      setUpdateData(payload);
    }
  };

  const handleDismiss = () => {
    if (updateData?.timestamp) {
      localStorage.setItem('clinicos_dismissed_ota_ts', String(updateData.timestamp));
    }
    setUpdateData(null);
  };

  useEffect(() => {
    const projectChannel = supabase.channel('axiogen_ota_axiogen-clinicos');
    projectChannel.on('broadcast', { event: 'force_hard_refresh' }, (response: any) => {
      processIncomingRelease(response?.payload);
    });
    projectChannel.subscribe();

    const globalChannel = supabase.channel('axiogen_ota_global');
    globalChannel.on('broadcast', { event: 'app_release_broadcast' }, (response: any) => {
      const p = response?.payload;
      if (p && (p.projectId === 'axiogen-clinicos' || p.projectId === 'all')) {
        processIncomingRelease(p);
      }
    });
    globalChannel.subscribe();

    const checkDb = async () => {
      try {
        const { data } = await supabase.from('clinics').select('sections').eq('id', 1).single();
        if (data?.sections) {
          const sectionsObj = typeof data.sections === 'string' ? JSON.parse(data.sections) : data.sections;
          const ota = sectionsObj?.ota_release;
          if (ota && ota.mode !== 'maintenance' && ota.version && ota.timestamp) {
            processIncomingRelease(ota);
          }
        }
      } catch {}
    };

    checkDb();

    return () => {
      supabase.removeChannel(projectChannel);
      supabase.removeChannel(globalChannel);
    };
  }, []);

  if (!updateData || updateData.mode === 'maintenance') {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0f1115]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className={`bg-white dark:bg-[#262932] border rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col p-4 sm:p-6 shadow-2xl relative overflow-hidden transition-colors ${
        updateData.mode === 'announcement'
          ? 'border-amber-400 dark:border-amber-600/60'
          : (updateData.pricingType === 'paid' ? 'border-amber-300 dark:border-amber-700/60' : 'border-neutral-200 dark:border-[#383b47]')
      }`}>
        
        {/* Header */}
        <div className="flex items-start justify-between gap-2.5 sm:gap-3 mb-3 sm:mb-4 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm ${
              updateData.mode === 'announcement'
                ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white'
                : (updateData.pricingType === 'paid' ? 'bg-amber-500' : 'bg-teal-700 dark:bg-teal-600')
            }`}>
              {updateData.mode === 'announcement' ? (
                <Megaphone className="w-5 h-5 text-white" />
              ) : updateData.pricingType === 'paid' ? (
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              ) : (
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  updateData.mode === 'announcement'
                    ? 'text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700'
                    : (updateData.pricingType === 'paid'
                        ? 'text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/60 border-amber-300 dark:border-amber-700'
                        : 'text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-700')
                }`}>
                  {updateData.badgeLabel || (updateData.mode === 'announcement' ? '✨ Festive Greetings' : (updateData.pricingType === 'paid' ? '💎 Premium Feature' : '🛡️ Maintenance Release'))} {updateData.version}
                </span>
                {updateData.pricingType === 'paid' && updateData.priceAmount && (
                  <span className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-900/40 px-2 py-0.5 rounded-md border border-amber-300 dark:border-amber-700/60">
                    ₹{updateData.priceAmount}
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-white mt-1 leading-snug line-clamp-2">
                {updateData.title}
              </h3>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#343844] transition-colors shrink-0 cursor-pointer"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description Body */}
        {updateData.descriptionText && (
          <div className="mb-3 sm:mb-4 px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-neutral-50 dark:bg-[#1f222b] border border-neutral-200/80 dark:border-[#383b47] text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed shrink-0">
            {updateData.descriptionText}
          </div>
        )}

        {/* Changelog Items */}
        {updateData.changelog && updateData.changelog.length > 0 && (
          <div className="flex-1 overflow-y-auto pr-1 mb-3 sm:mb-4 space-y-1.5 min-h-[70px] max-h-[160px] sm:max-h-[220px]">
            <div className="text-[10px] font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-1 sticky top-0 bg-white dark:bg-[#262932] py-0.5">
              What's New in this Update:
            </div>
            {updateData.changelog.map((item, index) => (
              <div
                key={index}
                className="flex items-start gap-2 text-xs text-neutral-700 dark:text-neutral-300 bg-neutral-50 dark:bg-[#1e2028] p-2 sm:p-2.5 rounded-xl border border-neutral-100 dark:border-[#343844]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 dark:bg-teal-400 mt-1.5 shrink-0" />
                <span className="leading-snug">{item}</span>
              </div>
            ))}
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-2 sm:pt-3 border-t border-neutral-100 dark:border-[#383b47] flex flex-col sm:flex-row items-center gap-2 sm:gap-3 shrink-0">
          {updateData.pricingType === 'paid' ? (
            <>
              <button
                onClick={handleWhatsAppUnlock}
                className="w-full sm:flex-1 py-2 sm:py-2.5 px-3 sm:px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl text-xs transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageSquare className="w-4 h-4 text-emerald-100" />
                <span>{updateData.buttonCtaText || 'Unlock via WhatsApp'}</span>
              </button>
              <button
                onClick={handleDismiss}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Dismiss
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => executeHardRefresh()}
                disabled={isUpdating}
                className={`w-full sm:flex-1 py-2 sm:py-2.5 px-3 sm:px-4 font-semibold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                  updateData.mode === 'announcement'
                    ? 'bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold'
                    : 'bg-teal-700 hover:bg-teal-600 text-white'
                }`}
              >
                {isUpdating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Applying Hard-Refresh...</span>
                  </>
                ) : (
                  <>
                    <span>{updateData.buttonCtaText || (updateData.mode === 'announcement' ? '🙏 Close Notice' : '⚡ Hard-Refresh Now')}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <button
                onClick={handleDismiss}
                className="w-full sm:w-auto px-3 sm:px-4 py-2 sm:py-2.5 text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Later
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
