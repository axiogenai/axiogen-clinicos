import React, { useEffect, useState, useRef } from 'react';
import { RefreshCw, X, ArrowRight, Lock, MessageSquare, ShieldCheck, Megaphone, Check } from 'lucide-react';
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

export const AppUpdateModal: React.FC = () => {
  const [updateData, setUpdateData] = useState<UpdatePayload | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Persist freeze across page refresh via localStorage
  const [isFrozen, setIsFrozen] = useState<boolean>(() => {
    try {
      return localStorage.getItem('clinicos_maintenance_hold') === 'true';
    } catch {
      return false;
    }
  });

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

    // MAINTENANCE / FREEZE: ZERO POPUP, ZERO MODAL, FULL AUTOMATIC INPUT FREEZE
    if (payload.mode === 'maintenance') {
      try {
        localStorage.setItem('clinicos_maintenance_hold', 'true');
      } catch {}
      setIsFrozen(true);
      setUpdateData(null); // CRITICAL: NEVER show any popup/modal
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

  const unfreezeMaintenance = () => {
    try {
      localStorage.removeItem('clinicos_maintenance_hold');
    } catch {}
    setIsFrozen(false);
  };

  useEffect(() => {
    // 1. Project-specific Realtime channel
    const projectChannel = supabase.channel('axiogen_ota_axiogen-clinicos');
    
    projectChannel.on('broadcast', { event: 'start_maintenance' }, () => {
      try { localStorage.setItem('clinicos_maintenance_hold', 'true'); } catch {}
      setIsFrozen(true);
      setUpdateData(null);
    });

    projectChannel.on('broadcast', { event: 'end_maintenance' }, () => {
      unfreezeMaintenance();
    });

    projectChannel.on('broadcast', { event: 'force_hard_refresh' }, (response: any) => {
      processIncomingRelease(response?.payload);
    });

    projectChannel.subscribe();

    // 2. Global Fleet Broadcast channel
    const globalChannel = supabase.channel('axiogen_ota_global');

    globalChannel.on('broadcast', { event: 'start_maintenance' }, () => {
      try { localStorage.setItem('clinicos_maintenance_hold', 'true'); } catch {}
      setIsFrozen(true);
      setUpdateData(null);
    });

    globalChannel.on('broadcast', { event: 'end_maintenance' }, () => {
      unfreezeMaintenance();
    });

    globalChannel.on('broadcast', { event: 'app_release_broadcast' }, (response: any) => {
      const p = response?.payload;
      if (p && (p.projectId === 'axiogen-clinicos' || p.projectId === 'all')) {
        processIncomingRelease(p);
      }
    });

    globalChannel.subscribe();

    // 3. Database polling: ensures freeze / unfreeze persists across refresh & reconnect
    const checkDbRelease = async () => {
      try {
        const { data } = await supabase.from('clinics').select('sections').eq('id', 1).single();
        if (data?.sections) {
          const sectionsObj = typeof data.sections === 'string' ? JSON.parse(data.sections) : data.sections;
          const ota = sectionsObj?.ota_release;
          if (ota && ota.mode === 'maintenance') {
            try {
              localStorage.setItem('clinicos_maintenance_hold', 'true');
            } catch {}
            setIsFrozen(true);
            setUpdateData(null);
          } else {
            // DB does not have maintenance hold active: clear hold and unfreeze
            if (localStorage.getItem('clinicos_maintenance_hold') === 'true') {
              unfreezeMaintenance();
            }
            if (ota && ota.version && ota.timestamp) {
              processIncomingRelease(ota);
            }
          }
        }
      } catch (err) {
        console.warn('DB check error:', err);
      }
    };

    checkDbRelease();
    const interval = setInterval(checkDbRelease, 2500);

    return () => {
      supabase.removeChannel(projectChannel);
      supabase.removeChannel(globalChannel);
      clearInterval(interval);
    };
  }, []);

  // Complete Input Interceptor: Block 100% of mouse, touch, scroll, and keyboard events
  useEffect(() => {
    if (!isFrozen) {
      document.body.style.overflow = '';
      return;
    }

    document.body.style.overflow = 'hidden';

    // Emergency unlock shortcut: Ctrl + Alt + Shift + U
    const blockAllKeys = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.altKey && e.shiftKey && (e.code === 'KeyU' || e.key === 'U' || e.key === 'u')) {
        console.log('[Dev] Emergency unfreeze triggered by key combo');
        unfreezeMaintenance();
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };

    const blockAllInteractions = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      return false;
    };

    const blockedEvents = [
      'click', 'dblclick', 'mousedown', 'mouseup', 'pointerdown', 'pointerup',
      'touchstart', 'touchend', 'touchmove', 'contextmenu', 'wheel'
    ];

    window.addEventListener('keydown', blockAllKeys, true);
    window.addEventListener('keypress', blockAllKeys, true);
    window.addEventListener('keyup', blockAllKeys, true);
    blockedEvents.forEach(evt => window.addEventListener(evt, blockAllInteractions, { passive: false, capture: true }));

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', blockAllKeys, true);
      window.removeEventListener('keypress', blockAllKeys, true);
      window.removeEventListener('keyup', blockAllKeys, true);
      blockedEvents.forEach(evt => window.removeEventListener(evt, blockAllInteractions, true));
    };
  }, [isFrozen]);

  return (
    <>
      {/* 100% INVISIBLE FREEZE OVERLAY: ZERO POPUP, ZERO DIALOG, BLOCKS ALL CLICKS & INPUTS */}
      {isFrozen && (
        <div
          id="clinicos-maintenance-hold"
          className="fixed inset-0 z-[99999999] bg-transparent cursor-default select-none pointer-events-auto"
          style={{ pointerEvents: 'auto', userSelect: 'none' }}
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onMouseDown={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onMouseUp={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onTouchMove={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onWheel={(e) => { e.preventDefault(); e.stopPropagation(); }}
        />
      )}

      {/* Standard Release Modal (ONLY FOR REAL PRODUCT RELEASES, NEVER FOR MAINTENANCE) */}
      {!isFrozen && updateData && updateData.mode !== 'maintenance' && (
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
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border truncate ${
                      updateData.mode === 'announcement'
                        ? 'text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700'
                        : updateData.pricingType === 'paid'
                        ? 'text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700'
                        : 'text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-700'
                    }`}>
                      {updateData.badgeLabel || (updateData.mode === 'announcement' ? '📢 Clinic Notice' : (updateData.pricingType === 'paid' ? '💎 Premium Feature' : '🛡️ Free Update'))} {updateData.mode !== 'announcement' && updateData.version}
                    </span>
                    {updateData.pricingType === 'paid' && updateData.priceAmount && (
                      <span className="text-[10px] sm:text-xs font-bold font-mono text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-700">
                        ₹{updateData.priceAmount}
                      </span>
                    )}
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-zinc-50 mt-1 truncate">
                    {updateData.title || (updateData.mode === 'announcement' ? 'Notice & Greetings' : (updateData.pricingType === 'paid' ? 'Premium Features Available' : 'Maintenance Update Ready'))}
                  </h3>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                aria-label="Close modal"
                className="p-1.5 sm:p-1 text-neutral-400 hover:text-neutral-900 dark:text-zinc-400 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-[#363a47] transition-colors shrink-0 cursor-pointer"
              >
                <X className="w-4 h-4 sm:w-4 sm:h-4" />
              </button>
            </div>

            {/* Scrollable Middle Content */}
            <div className="overflow-y-auto pr-1 -mr-1 flex-1 space-y-3 sm:space-y-3.5 min-h-0">
              {updateData.descriptionText && (
                <div className={`p-3 rounded-xl border text-xs sm:text-sm leading-relaxed ${
                  updateData.mode === 'announcement'
                    ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40 text-amber-950 dark:text-amber-100'
                    : 'bg-neutral-50 dark:bg-[#2e313c] border-neutral-200 dark:border-[#383b47] text-neutral-700 dark:text-zinc-200'
                }`}>
                  {updateData.descriptionText}
                </div>
              )}

              {updateData.changelog && updateData.changelog.length > 0 && (
                <div className="bg-neutral-50 dark:bg-[#2e313c] border border-neutral-200 dark:border-[#383b47] rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-1.5 sm:space-y-2">
                  <h4 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-zinc-400">
                    {updateData.mode === 'announcement' ? 'Details & Schedule:' : (updateData.pricingType === 'paid' ? 'Included in this release:' : "What's New:")}
                  </h4>
                  <div className="space-y-1.5">
                    {updateData.changelog.map((item, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-neutral-800 dark:text-zinc-200 leading-snug">
                        <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                          updateData.mode === 'announcement'
                            ? 'text-amber-600 dark:text-amber-400'
                            : updateData.pricingType === 'paid' ? 'text-amber-600 dark:text-amber-400' : 'text-teal-600 dark:text-teal-400'
                        }`} />
                        <span className="break-words font-medium">{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Action Button */}
            <div className="pt-3 sm:pt-4 border-t border-neutral-100 dark:border-[#383b47] shrink-0">
              {updateData.mode === 'announcement' ? (
                <button
                  onClick={handleDismiss}
                  className="w-full min-h-[44px] py-2.5 sm:py-3 bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 text-black rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99]"
                >
                  <span>{updateData.buttonCtaText || 'Acknowledge / Close'}</span>
                </button>
              ) : updateData.pricingType === 'paid' ? (
                <button
                  onClick={handleWhatsAppUnlock}
                  className="w-full min-h-[44px] py-2.5 sm:py-3 bg-neutral-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] shadow-sm"
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span className="truncate">{updateData.buttonCtaText || 'Unlock via WhatsApp'} (₹{updateData.priceAmount || '4,999'})</span>
                  <ArrowRight className="w-4 h-4 shrink-0 ml-0.5" />
                </button>
              ) : (
                <button
                  onClick={() => executeHardRefresh()}
                  disabled={isUpdating}
                  className="w-full min-h-[44px] py-2.5 sm:py-3 bg-teal-700 hover:bg-teal-800 dark:bg-teal-600 dark:hover:bg-teal-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 active:scale-[0.99] shadow-sm"
                >
                  {isUpdating ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin shrink-0" />
                      <span>Updating &amp; Hard-Refreshing...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 shrink-0" />
                      <span className="truncate">{updateData.buttonCtaText || 'Update & Hard Refresh'}</span>
                      <ArrowRight className="w-4 h-4 shrink-0 ml-0.5" />
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
