import { useState } from 'react';
import { Stethoscope, Phone, Mail, ShieldCheck, ArrowRight, Calendar, CheckCircle2, Clock, Zap } from 'lucide-react';
import logoHd from '../assets/logo-hd.png';

export default function ComingSoonLandingPage() {
  const [emailSubscribed, setEmailSubscribed] = useState(false);
  const [subscriberEmail, setSubscriberEmail] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (subscriberEmail.trim()) {
      setEmailSubscribed(true);
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] text-[#1a1c1a] font-sans selection:bg-[#047857] selection:text-white flex flex-col items-center justify-between relative overflow-hidden p-6 sm:p-12">
      
      {/* Subtle Background Aesthetic Glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-gradient-to-b from-[#ecfdf5]/80 via-[#f5f5f0]/40 to-transparent blur-3xl pointer-events-none rounded-full" />

      {/* ── Centered Logo & Brand Mark ── */}
      <div className="relative z-10 pt-4 sm:pt-6 flex flex-col items-center justify-center text-center">
        <img 
          src={logoHd} 
          alt="Shingare Skin Clinic Logo" 
          className="h-16 sm:h-20 w-auto object-contain drop-shadow-md mb-3" 
        />
        <h1 className="text-2xl sm:text-4xl font-serif font-bold text-[#1a1c1a] tracking-tight leading-none">
          Shingare Skin & Hair Clinic
        </h1>
        <p className="text-xs sm:text-sm text-[#047857] tracking-widest font-bold mt-1.5 uppercase">
          Dermatology & Aesthetic Medicine
        </p>
        
        {/* Made with love link */}
        <div className="mt-2 flex items-center gap-1.5 text-xs text-[#78716c]">
          <span>Made with ❤️ by</span>
          <a
            href="https://team.axiogen.in"
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-[#047857] hover:underline"
          >
            team.axiogen.in
          </a>
        </div>

        {/* Status Pill Badge */}
        <div className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-[#ecfdf5] border-2 border-[#10b981]/35 text-[#047857] text-xs sm:text-sm font-extrabold tracking-widest uppercase shadow-md mt-6">
          <Clock className="w-4 h-4 sm:w-4.5 h-4.5 text-[#047857]" />
          <span>Official Clinic Website • Launching Soon</span>
        </div>
      </div>

      {/* ── Main Hero & Coming Soon Content ── */}
      <main className="relative z-10 max-w-4xl mx-auto mt-8 mb-12 flex flex-col items-center justify-center text-center">

        {/* Main Headline */}
        <h2 className="text-4xl sm:text-6xl font-serif font-bold text-[#1a1c1a] tracking-tight leading-[1.15] max-w-3xl">
          Advanced Dermatology & <span className="text-[#047857]">Radiant Skin Care</span>
        </h2>

        <p className="mt-6 text-base sm:text-lg text-[#57534e] max-w-2xl font-normal leading-relaxed">
          Dr. Pramod Shingare’s premier skin, hair, and laser clinic is crafting a brand-new digital patient portal for seamless online appointments and dermatological care.
        </p>

        {/* Notify / Subscribe Box */}
        <div className="mt-8 w-full max-w-md">
          {emailSubscribed ? (
            <div className="p-4 rounded-2xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#047857] flex items-center justify-center gap-2 text-sm font-bold shadow-md">
              <CheckCircle2 className="w-5 h-5 text-[#047857]" />
              <span>Thank you! We’ll notify you when our site launches.</span>
            </div>
          ) : (
            <form onSubmit={handleSubscribe} className="flex flex-col sm:flex-row items-center gap-2 bg-white p-2 rounded-2xl border border-[#e7e5e4] shadow-xl">
              <input
                type="email"
                required
                value={subscriberEmail}
                onChange={(e) => setSubscriberEmail(e.target.value)}
                placeholder="Enter your email for launch updates..."
                className="w-full px-4 py-3 bg-transparent text-sm text-[#1a1c1a] placeholder-[#a8a29e] focus:outline-none"
              />
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-3 bg-[#047857] hover:bg-[#065f46] text-white font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer active:scale-95"
              >
                <span>Get Notified</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>

        {/* ── Key Clinical Specializations Grid ── */}
        <div className="mt-16 w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 text-left">
          
          <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-md hover:shadow-lg transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] flex items-center justify-center text-[#047857] mb-3">
              <Stethoscope className="w-5 h-5" />
            </div>
            <h3 className="text-base font-serif font-bold text-[#1a1c1a] mb-1">Clinical Dermatology</h3>
            <p className="text-xs text-[#78716c] leading-relaxed">
              Acne, Eczema, Psoriasis, Rosacea & Fungal treatment.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-md hover:shadow-lg transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#fffbeb] border border-[#fde68a] flex items-center justify-center text-[#b45309] mb-3">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="text-base font-serif font-bold text-[#1a1c1a] mb-1">Aesthetic & Laser</h3>
            <p className="text-xs text-[#78716c] leading-relaxed">
              Laser scar reduction, peels & skin rejuvenation.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-md hover:shadow-lg transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#f0f9ff] border border-[#bae6fd] flex items-center justify-center text-[#0284c7] mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-serif font-bold text-[#1a1c1a] mb-1">Trichology & Hair</h3>
            <p className="text-xs text-[#78716c] leading-relaxed">
              PRP therapy, hair loss care & targeted regrowth.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#e7e5e4] shadow-md hover:shadow-lg transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#fdf2f8] border border-[#fbcfe8] flex items-center justify-center text-[#db2777] mb-3">
              <Calendar className="w-5 h-5" />
            </div>
            <h3 className="text-base font-serif font-bold text-[#1a1c1a] mb-1">Digital Prescriptions</h3>
            <p className="text-xs text-[#78716c] leading-relaxed">
              WhatsApp prescription delivery & reminders.
            </p>
          </div>

        </div>

        {/* ── Doctor Info Banner ── */}
        <div className="mt-12 w-full p-6 sm:p-8 rounded-3xl bg-white border border-[#e7e5e4] shadow-xl flex flex-col sm:flex-row items-center justify-between gap-6 text-left">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#047857] text-white font-bold flex items-center justify-center text-xl shadow-md shrink-0">
              PS
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#047857] bg-[#ecfdf5] px-2 py-0.5 rounded border border-[#a7f3d0]">
                Lead Consultant
              </span>
              <h3 className="text-lg font-serif font-bold text-[#1a1c1a] mt-1">Dr. Pramod Shingare</h3>
              <p className="text-xs text-[#78716c]">M.D. (Dermatology, Venereology & Leprosy) • Consultant Cosmetologist</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5 text-xs text-[#44403c]">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-[#047857]" />
              <span className="font-bold text-[#1a1c1a]">+91 9561896943</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-[#047857]" />
              <span>shingare.pramod17@gmail.com</span>
            </div>
          </div>
        </div>

      </main>

      {/* ── Footer ── */}
      <footer className="relative z-10 w-full max-w-4xl mx-auto pt-6 border-t border-[#e7e5e4] text-center text-xs text-[#78716c]">
        <p>© {new Date().getFullYear()} Shingare Skin & Hair Clinic. All rights reserved.</p>
      </footer>

    </div>
  );
}
