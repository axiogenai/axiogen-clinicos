import React, { useEffect, useState, useRef } from 'react';
import { ArrowUpCircle, RefreshCw, X, CheckCircle2, ArrowRight, Lock, MessageSquare } from 'lucide-react';
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

    // Check if user already dismissed or applied this exact release timestamp
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
    // 1. Listen for Realtime WebSockets Broadcast
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

    // 2. Poll Database fallback every 5 seconds (guarantees update arrival)
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
  const badge = updateData.badgeLabel || (isPaid ? '💎 Premium Feature Release' : '🚀 New Version');
  const buttonText = updateData.buttonCtaText || (isPaid ? '💬 Unlock via WhatsApp' : '⚡ Update & Hard Refresh Software Now');
  const description = updateData.descriptionText || (
    isPaid 
      ? 'This is a premium add-on module. Unlock full access for your clinic by contacting the Axiogen development team.'
      : 'Click below to apply the latest clinical updates and refresh your browser. Your ongoing work is securely saved.'
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#1a1c1a]/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`bg-white border rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative overflow-hidden ${
        isPaid ? 'border-amber-300' : 'border-[#a7f3d0]'
      }`}>
        {/* Glow Header */}
        <div className={`absolute -top-10 -right-10 w-40 h-40 rounded-full blur-2xl pointer-events-none ${
          isPaid ? 'bg-amber-400/20' : 'bg-emerald-400/20'
        }`} />
        
        <div className="flex items-start justify-between gap-3 mb-4 relative z-10">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-lg ${
              isPaid
                ? 'bg-gradient-to-br from-amber-600 to-orange-500 shadow-amber-950/20'
                : 'bg-gradient-to-br from-[#064e3b] to-[#047857] shadow-emerald-950/20'
            }`}>
              {isPaid ? <Lock className="w-6 h-6 text-amber-100" /> : <ArrowUpCircle className="w-6 h-6 text-[#a7f3d0]" />}
            </div>
            <div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                  isPaid
                    ? 'text-amber-800 bg-amber-50 border-amber-300'
                    : 'text-[#047857] bg-[#ecfdf5] border-[#a7f3d0]'
                }`}>
                  {badge} {updateData.version}
                </span>
                {isPaid && updateData.priceAmount && (
                  <span className="text-xs font-bold font-mono text-amber-900 bg-amber-100 px-2 py-0.5 rounded-md border border-amber-200">
                    ₹{updateData.priceAmount}
                  </span>
                )}
              </div>
              <h3 className="text-base font-serif font-bold text-[#1a1c1a] mt-1">
                {updateData.title || (isPaid ? 'Premium Features Available' : 'Software Update Ready')}
              </h3>
            </div>
          </div>

          <button
            onClick={handleDismiss}
            className="p-1 text-[#7c766d] hover:text-[#1a1c1a] rounded-lg hover:bg-[#f2eee3] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Improvements List */}
        {updateData.changelog && updateData.changelog.length > 0 && (
          <div className="bg-[#faf9f6] border border-[#e4e2e1] rounded-2xl p-4 mb-4 space-y-2">
            <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#7c766d]">
              {isPaid ? 'What you get with this upgrade:' : "What's New in this update:"}
            </h4>
            <div className="space-y-1.5">
              {updateData.changelog.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-[#4b463e]">
                  <CheckCircle2 className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${
                    isPaid ? 'text-amber-600' : 'text-[#047857]'
                  }`} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-[#7c766d] leading-relaxed mb-4">
          {description}
        </p>

        {isPaid ? (
          <div className="space-y-3">
            <button
              onClick={handleWhatsAppUnlock}
              className="w-full py-3.5 bg-gradient-to-r from-amber-600 via-orange-500 to-amber-600 hover:from-amber-700 hover:to-orange-600 text-white rounded-2xl text-xs font-bold transition-all shadow-xl shadow-amber-950/20 flex items-center justify-center gap-2 cursor-pointer"
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
              className="w-full py-3.5 bg-gradient-to-r from-[#064e3b] to-[#047857] hover:from-[#022c22] hover:to-[#064e3b] text-[#ecfdf5] rounded-2xl text-xs font-bold transition-all shadow-xl shadow-emerald-950/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUpdating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Updating ClinicOS & Hard-Refreshing...</span>
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
