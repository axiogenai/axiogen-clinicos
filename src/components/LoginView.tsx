import { useState } from 'react';
import { Activity, Lock, Mail, UserCheck, ShieldAlert, ArrowRight } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';

interface Props {
  onSuccess: () => void;
}

export default function LoginView({ onSuccess }: Props) {
  const { login, setToast } = useClinic();
  const [email, setEmail] = useState('doctor@shinagareclinic.com');
  const [password, setPassword] = useState('doctor123');
  const [role, setRole] = useState<'doctor' | 'receptionist'>('doctor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuickRoleSelect = (selectedRole: 'doctor' | 'receptionist') => {
    setRole(selectedRole);
    if (selectedRole === 'doctor') {
      setEmail('doctor@shinagareclinic.com');
      setPassword('doctor123');
    } else {
      setEmail('reception@shinagareclinic.com');
      setPassword('reception123');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(email, password);
      setToast({
        type: 'success',
        message: `Welcome back! Logged in successfully as ${role === 'doctor' ? 'Doctor' : 'Receptionist'}.`
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f8f6f0] via-[#f2eee3] to-[#e8e2d2] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/90 backdrop-blur-md rounded-2xl shadow-xl border border-[#e4e2e1] p-8 space-y-6">
        
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-[#1a1c1a] flex items-center justify-center text-[#faf9f6] mx-auto shadow-md">
            <Activity className="w-7 h-7 text-[#faf9f6]" />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-[#1a1c1a] tracking-tight">ClinicOS</h1>
            <p className="text-xs font-semibold text-[#7c766d] mt-0.5">शिनगारे स्किन & कॉस्मेटीक क्लिनिक</p>
          </div>
          <span className="inline-block bg-[#f2eee3] text-[#4b463e] text-[10px] font-bold px-2 py-0.5 rounded border border-[#cdc6ba]">
            PRODUCTION EMR LOGIN
          </span>
        </div>

        {/* Role Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 bg-[#f2eee3]/80 p-1 rounded-xl border border-[#e4e2e1]">
          <button
            type="button"
            onClick={() => handleQuickRoleSelect('doctor')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              role === 'doctor'
                ? 'bg-gradient-to-r from-[#064e3b] to-[#047857] text-[#ecfdf5] shadow-md'
                : 'text-[#4b463e] hover:text-[#1a1c1a] hover:bg-white/60'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Doctor Login</span>
          </button>

          <button
            type="button"
            onClick={() => handleQuickRoleSelect('receptionist')}
            className={`py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              role === 'receptionist'
                ? 'bg-gradient-to-r from-[#064e3b] to-[#047857] text-[#ecfdf5] shadow-md'
                : 'text-[#4b463e] hover:text-[#1a1c1a] hover:bg-white/60'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Reception Desk</span>
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 text-red-700 text-xs p-3 rounded-lg border border-red-200 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-red-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#4b463e] mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#cdc6ba] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857] text-[#1a1c1a]"
                placeholder="doctor@shinagareclinic.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#4b463e] mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-[#cdc6ba] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#047857] text-[#1a1c1a]"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-gradient-to-r from-[#064e3b] to-[#047857] hover:from-[#022c22] hover:to-[#064e3b] text-[#ecfdf5] font-bold text-sm rounded-lg shadow-md shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating...</span>
            ) : (
              <>
                <span>Sign In to Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Preset Hints */}
        <div className="pt-2 border-t border-[#e4e2e1] text-center text-[11px] text-[#7c766d] space-y-1">
          <p className="font-semibold text-[#4b463e]">Built-in Authorized Test Accounts:</p>
          <p>👨‍⚕️ <strong>Doctor:</strong> doctor@shinagareclinic.com (pass: doctor123)</p>
          <p>📋 <strong>Reception:</strong> reception@shinagareclinic.com (pass: reception123)</p>
        </div>

      </div>
    </div>
  );
}
