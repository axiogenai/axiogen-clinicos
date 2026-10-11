import React, { useEffect, useState, useRef } from 'react';
import { RefreshCw, X, ArrowRight, Lock, MessageSquare, ShieldCheck, Megaphone, Check } from 'lucide-react';
import { supabase } from '../lib/supabase';

export interface UpdatePayload {
  projectId: string;
  version: string;
  title: string;
  changelog: string[];
  mode: 'prompt' | 'force_refresh' | 'announcement';
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
  const lastHandledTimestampRef = useRef<number>(0);

  const executeHardRefresh = async (overrideTimestamp?: number) => {
    // 1. Loop protection guard: prevent multiple reloads within 10 seconds
    const reloadGuardKey = 'clinicos_ota_reload_guard';
    const lastReloadTime = Number(sessionStorage.getItem(reloadGuardKey) || '0');
    if (Date.now() - lastReloadTime < 10000) {
      console.warn('[OTA] Suppressing auto-refresh loop: Page reloaded less than 10s ago.');
      return;
    }
    sessionStorage.setItem(reloadGuardKey, String(Date.now()));

    // 2. Synchronously mark timestamp as applied BEFORE reloading
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

    // 3. Small debounce before reload to allow localStorage write to complete
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
    if (!payload || !payload.version || !payload.timestamp) return;

    const lastApplied = Number(localStorage.getItem('clinicos_last_applied_ota_ts') || '0');
    const dismissed = Number(localStorage.getItem('clinicos_dismissed_ota_ts') || '0');

    // Skip if already applied or dismissed
    if (payload.timestamp <= lastApplied || payload.timestamp <= dismissed) {
      return;
    }

    if (payload.timestamp <= lastHandledTimestampRef.current) {
      return;
    }

    lastHandledTimestampRef.current = payload.timestamp;

    if (payload.mode === 'force_refresh') {
      // Loop protection: only auto-refresh if broadcast is FRESH (sent within last 60 seconds)
      const ageMs = Date.now() - payload.timestamp;
      const isFresh = ageMs >= 0 && ageMs < 60000;

      // Synchronously mark applied so subsequent DB polls NEVER loop
      localStorage.setItem('clinicos_last_applied_ota_ts', String(payload.timestamp));

      if (isFresh) {
        executeHardRefresh(payload.timestamp);
      } else {
        console.log('[OTA] Stale force-refresh broadcast (>60s old) acknowledged without reloading.');
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
    // 1. Realtime WebSockets listener
    const channel = supabase.channel('axiogen_ota_axiogen-clinicos');
    channel.on('broadcast', { event: 'force_hard_refresh' }, (response: any) => {
      processIncomingRelease(response?.payload);
    }).subscribe();

    const globalChannel = supabase.channel('axiogen_ota_global');
    globalChannel.on('broadcast', { event: 'app_release_broadcast' }, (response: any) => {
      const p = response?.payload;
      if (p && (p.projectId === 'axiogen-clinicos' || p.projectId === 'all')) {
        processIncomingRelease(p);
      }
    }).subscribe();

    // 2. Cloud Database polling fallback (reads sections.ota_release safely)
    const checkDbRelease = async () => {
      try {
        const { data } = await supabase.from('clinics').select('sections').eq('id', 1).single();
        if (data?.sections) {
          const sectionsObj = typeof data.sections === 'string' ? JSON.parse(data.sections) : data.sections;
          if (sectionsObj && sectionsObj.ota_release && sectionsObj.ota_release.version) {
            processIncomingRelease(sectionsObj.ota_release);
          }
        }
      } catch {}
    };

    checkDbRelease();
    const interval = setInterval(checkDbRelease, 4000);

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(globalChannel);
      clearInterval(interval);
    };
  }, []);

  if (!updateData) return null;

  const isAnnouncement = updateData.mode === 'announcement';
  const isPaid = updateData.pricingType === 'paid';
  const badge = updateData.badgeLabel || (
    isAnnouncement
      ? '📢 Clinic Notice & Greetings'
      : (isPaid ? '💎 Premium Feature Release' : '🛡️ Free Maintenance Update')
  );
  const buttonText = updateData.buttonCtaText || (
    isAnnouncement
      ? 'Acknowledge / Close'
      : (isPaid ? '💬 Unlock via WhatsApp' : '⚡ Update & Hard Refresh Software (Free)')
  );
  const description = updateData.descriptionText || (
    isPaid 
      ? 'This is a premium add-on module. Unlock full access for your clinic by contacting the Axiogen development team.'
      : 'This software update is included in your Free Maintenance Plan. Click below to apply the latest clinical updates and refresh your browser.'
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#0f1115]/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div className={`bg-white dark:bg-[#262932] border rounded-2xl sm:rounded-3xl max-w-md w-full max-h-[92vh] sm:max-h-[88vh] flex flex-col p-4 sm:p-6 shadow-2xl relative overflow-hidden transition-colors ${
        isAnnouncement
          ? 'border-amber-400 dark:border-amber-600/60'
          : (isPaid ? 'border-amber-300 dark:border-amber-700/60' : 'border-neutral-200 dark:border-[#383b47]')
      }`}>
        
        {/* Header - Fixed Top */}
        <div className="flex items-start justify-between gap-2.5 sm:gap-3 mb-3 sm:mb-4 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className={`w-9 h-9 sm:w-11 sm:h-11 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shrink-0 shadow-sm ${
              isAnnouncement
                ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white'
                : (isPaid ? 'bg-amber-500' : 'bg-teal-700 dark:bg-teal-600')
            }`}>
              {isAnnouncement ? (
                <Megaphone className="w-5 h-5 text-white" />
              ) : isPaid ? (
                <Lock className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              ) : (
                <ShieldCheck className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border truncate ${
                  isAnnouncement
                    ? 'text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700'
                    : isPaid
                    ? 'text-amber-800 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 border-amber-300 dark:border-amber-700'
                    : 'text-teal-800 dark:text-teal-200 bg-teal-50 dark:bg-teal-950/50 border-teal-200 dark:border-teal-700'
                }`}>
                  {badge} {!isAnnouncement && updateData.version}
                </span>
                {isPaid && updateData.priceAmount && (
                  <span className="text-[10px] sm:text-xs font-bold font-mono text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-700">
                    ₹{updateData.priceAmount}
                  </span>
                )}
              </div>
              <h3 className="text-sm sm:text-base font-bold text-neutral-900 dark:text-zinc-50 mt-1 truncate">
                {updateData.title || (isAnnouncement ? 'Notice & Greetings' : (isPaid ? 'Premium Features Available' : 'Maintenance Update Ready'))}
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
          
          {/* Main Description */}
          {description && (
            <div className={`p-3 rounded-xl border text-xs sm:text-sm leading-relaxed ${
              isAnnouncement
                ? 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40 text-amber-950 dark:text-amber-100'
                : 'bg-neutral-50 dark:bg-[#2e313c] border-neutral-200 dark:border-[#383b47] text-neutral-700 dark:text-zinc-200'
            }`}>
              {description}
            </div>
          )}

          {/* Improvements / Points List */}
          {updateData.changelog && updateData.changelog.length > 0 && (
            <div className="bg-neutral-50 dark:bg-[#2e313c] border border-neutral-200 dark:border-[#383b47] rounded-xl sm:rounded-2xl p-3 sm:p-4 space-y-1.5 sm:space-y-2">
              <h4 className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider text-neutral-500 dark:text-zinc-400">
                {isAnnouncement ? 'Details & Schedule:' : (isPaid ? 'Included in this release:' : "What's New in this Maintenance Update:")}
              </h4>
              <div className="space-y-1.5">
                {updateData.changelog.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-neutral-800 dark:text-zinc-200 leading-snug">
                    <Check className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                      isAnnouncement
                        ? 'text-amber-600 dark:text-amber-400'
                        : isPaid ? 'text-amber-600 dark:text-amber-400' : 'text-teal-600 dark:text-teal-400'
                    }`} />
                    <span className="break-words font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Action Button - Fixed Bottom */}
        <div className="pt-3 sm:pt-4 border-t border-neutral-100 dark:border-[#383b47] shrink-0">
          {isAnnouncement ? (
            <button
              onClick={handleDismiss}
              className="w-full min-h-[44px] py-2.5 sm:py-3 bg-amber-500 hover:bg-amber-600 dark:bg-amber-500 dark:hover:bg-amber-400 text-black rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-sm active:scale-[0.99]"
            >
              <span>{buttonText}</span>
            </button>
          ) : isPaid ? (
            <button
              onClick={handleWhatsAppUnlock}
              className="w-full min-h-[44px] py-2.5 sm:py-3 bg-neutral-900 hover:bg-black dark:bg-white dark:hover:bg-zinc-200 text-white dark:text-black rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] shadow-sm"
            >
              <MessageSquare className="w-4 h-4 shrink-0" />
              <span className="truncate">{buttonText} (₹{updateData.priceAmount || '4,999'})</span>
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
                  <span className="truncate">{buttonText}</span>
                  <ArrowRight className="w-4 h-4 shrink-0 ml-0.5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
