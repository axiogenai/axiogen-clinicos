import React, { useEffect, useState, useRef } from 'react';
import { RefreshCw, X, CheckCircle2, ArrowRight, Lock, MessageSquare, ShieldCheck } from 'lucide-react';
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

  const executeHardRefresh = async () => {
    setIsUpdating(true);
    try {
      if ('caches' in window) {
        const cacheKeys = await caches.keys();
        await Promise.all(cacheKeys.map(k => caches.delete(k)));
      }
      if (updateData?.timestamp) {
        localStorage.setItem('clinicos_last_applied_ota_ts', String(updateData.timestamp));
      }
    } catch {}
    // Hard refresh bypassing browser cache
    window.location.reload();
  };

  const handleWhatsAppUnlock = () => {
    if (!updateData) return;
    const phone = updateData.whatsappContactNumber || '919022646272';
    const message = updateData.customWhatsAppMessage || `Hello Axiogen Team, I want to unlock the new ${updateData.version} update ("${updateData.title}") for ₹${updateData.priceAmount || '4,999'} for Shingare ClinicOS. Please provide payment details and activate our license.`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${phone}?text=${encoded}`, '_blank');
  };

  const processIncomingRelease = (payload: any) => {
    if (!payload || !payload.version || !payload.timestamp) return;

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
      executeHardRefresh();
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

    const checkDbRelease = async () => {
      try {
        const { data } = await supabase.from('clinics').select('pharmacy_info, updated_at').eq('id', 1).single();
        if (data?.pharmacy_info) {
          try {
            const parsed = typeof data.pharmacy_info === 'string' ? JSON.parse(data.pharmacy_info) : data.pharmacy_info;
            if (parsed && parsed.version) {
              processIncomingRelease(parsed);
            }
          } catch {}
        }
      } catch {}
    };

    checkDbRelease();
    const interval = setInterval(checkDbRelease, 5000);

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(globalChannel);
      clearInterval(interval);
    };
  }, []);

  if (!updateData) return null;

  const isPaid = updateData.pricingType === 'paid';
  const badge = updateData.badgeLabel || (isPaid ? '💎 Premium Feature Release' : '🛡️ Free Maintenance Update');
  const buttonText = updateData.buttonCtaText || (isPaid ? '💬 Unlock via WhatsApp' : '⚡ Update & Hard Refresh Software (Free)');
  const description = updateData.descriptionText || (
    isPaid 
      ? 'This is a premium add-on module. Unlock full access for your clinic by contacting the Axiogen development team.'
      : 'This software update is included in your Free Maintenance Plan. Click below to apply the latest clinical updates and refresh your browser.'
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#0f1115]/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className={`bg-white border rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden ${
        isPaid ? 'border-amber-300' : 'border-neutral-200'
      }`}>
        <div className="flex items-start justify-between gap-3 mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white shrink-0 ${
              isPaid
                ? 'bg-amber-500'
                : 'bg-emerald-700'
            }`}>
              {isPaid ? <Lock className="w-5 h-5 text-white" /> : <ShieldCheck className="w-6 h-6 text-white" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  isPaid
                    ? 'text-amber-800 bg-amber-50 border-amber-300'
                    : 'text-emerald-800 bg-emerald-50 border-emerald-200'
                }`}>
                  {badge} {updateData.version}
                </span>
                {isPaid && updateData.priceAmount && (
                  <span className="text-xs font-bold font-mono text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                    ₹{updateData.priceAmount}
                  </span>
                )}
              </div>
              <h3 className="text-base font-bold text-neutral-900 mt-1">
                {updateData.title || (isPaid ? 'Premium Features Available' : 'Maintenance Update Ready')}
              </h3>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 text-neutral-400 hover:text-neutral-900 rounded-lg hover:bg-neutral-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Improvements List */}
        {updateData.changelog && updateData.changelog.length > 0 && (
          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-4 mb-4 space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              {isPaid ? 'Included in this release:' : "What's New in this Maintenance Update:"}
            </h4>
            <div className="space-y-1.5">
              {updateData.changelog.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-neutral-700">
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                    isPaid ? 'text-amber-600' : 'text-emerald-700'
                  }`} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-neutral-500 leading-relaxed mb-4">
          {description}
        </p>

        {isPaid ? (
          <div className="space-y-3">
            <button
              onClick={handleWhatsAppUnlock}
              className="w-full py-3 bg-neutral-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>{buttonText} (₹{updateData.priceAmount || '4,999'})</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={executeHardRefresh}
              disabled={isUpdating}
              className="w-full py-3 bg-emerald-800 hover:bg-emerald-900 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Updating & Hard-Refreshing...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>{buttonText}</span>
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
