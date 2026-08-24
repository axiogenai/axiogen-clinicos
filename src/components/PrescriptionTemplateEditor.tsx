import { useState, useRef } from 'react';
import { 
  Layout, 
  User, 
  Columns, 
  Footprints, 
  Sliders, 
  Printer, 
  Eye, 
  Save, 
  X, 
  Sparkles,
  Upload,
  Trash2
} from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import PrintTemplate from './PrintTemplate';
import { defaultClinicSettings } from '../data/clinicSettings';
import type { ClinicSettings, DoctorInfo } from '../data/clinicSettings';

interface Props {
  onClose: () => void;
}

type SubTab = 'header' | 'patient_info' | 'left_column' | 'footer' | 'general' | 'print';

export default function PrescriptionTemplateEditor({ onClose }: Props) {
  const { clinicSettings, updateClinicSettings, setToast } = useClinic();
  const [settings, setSettings] = useState<ClinicSettings>(() => ({
    ...defaultClinicSettings,
    ...(clinicSettings || {}),
    doctors: (clinicSettings?.doctors && clinicSettings.doctors.length >= 2)
      ? clinicSettings.doctors
      : defaultClinicSettings.doctors
  }));
  const [activeTab, setActiveTab] = useState<SubTab>('header');
  const [showFieldTags, setShowFieldTags] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Mock patient and case paper for live preview rendering
  const samplePatient = {
    id: 'PT0001',
    name: 'राजेश पाटील',
    age: 34,
    gender: 'M',
    phone: '9876543210',
    village: 'शिराळा, सांगली',
    pastHistory: 'DM / HTN (Controlled)',
    allergies: '',
  };

  const sampleCasePaper = {
    patientId: 'PT0001',
    date: new Date().toISOString().split('T')[0],
    templateId: 'tpl_1',
    complaint: 'Severe Ringworm Infection on thigh & arms since 2 weeks',
    pastHistory: 'Diabetes Mellitus type 2',
    allergies: '',
    medicines: [
      { medicineId: 'm1', name: 'Tab. Itraconazole 200mg', dosage: '200mg', frequency: '1-0-1 (BD) After Meals', duration: '14 Days' },
      { medicineId: 'm2', name: 'Luliconazole 1% Cream', dosage: '1%', frequency: 'Apply 1-0-1 (BD) Clean & Dry area', duration: '21 Days' },
      { medicineId: 'm3', name: 'Tab. Levocetirizine 5mg', dosage: '5mg', frequency: '0-0-1 (HS) At Bedtime', duration: '10 Days' },
      { medicineId: 'm4', name: 'Ketoconazole Soap 2%', dosage: '2%', frequency: 'Use during morning bath daily', duration: '30 Days' },
    ],
    investigationsAdvised: ['CBC', 'LFT', 'BSL(R)'],
    counsellingDone: [
      'Avoid sharing towels or soap with family members',
      'Wear loose cotton clothing and keep affected skin dry',
      'Complete full 14 days anti-fungal course even if rash fades',
    ],
    followUpDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
  };

  const doc1 = settings?.doctors?.[0] || defaultClinicSettings.doctors[0];
  const doc2 = settings?.doctors?.[1] || defaultClinicSettings.doctors[1];

  const handleUpdateDoctor = (index: 0 | 1, key: keyof DoctorInfo, value: string) => {
    setSettings((prev) => {
      const updatedDocs = [...(prev.doctors || defaultClinicSettings.doctors)];
      if (!updatedDocs[index]) {
        updatedDocs[index] = { id: `doc_${index + 1}`, name: '', title: '', regNo: '' };
      }
      updatedDocs[index] = { ...updatedDocs[index], [key]: value };
      return { ...prev, doctors: updatedDocs };
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Logo file size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setSettings((prev) => ({
        ...prev,
        logoUrl: reader.result as string,
      }));
      setToast({ type: 'success', message: 'Clinic logo updated.' });
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setSettings((prev) => ({
      ...prev,
      logoUrl: undefined,
    }));
    setToast({ type: 'info', message: 'Clinic logo removed.' });
  };

  const handleSave = () => {
    updateClinicSettings(settings);
    setToast({ type: 'success', message: 'Prescription template layout saved successfully.' });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md flex flex-col z-50 overflow-hidden font-sans text-slate-900">
      
      {/* Hidden File Input for Logo */}
      <input 
        type="file"
        ref={fileInputRef}
        onChange={handleLogoUpload}
        accept="image/png, image/jpeg, image/jpg, image/webp, image/svg+xml"
        className="hidden"
      />

      {/* ── TOP HEADER BAR ── */}
      <div className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
            <Layout className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 tracking-tight leading-none">Prescription Template Editor</h1>
            <div className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-2">
              <span>Template: <strong className="text-slate-800">Acne & General Dermatology Template</strong></span>
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded border border-indigo-100">LIVE PREVIEW MODE</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowFieldTags(!showFieldTags)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1.5 ${
              showFieldTags ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Show Field Tags</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 border border-slate-200"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Test</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md shadow-indigo-200 transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Save className="w-4 h-4" />
            <span>Save Template</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── MAIN 3-COLUMN WORKSPACE ── */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* COLUMN 1: Left Navigation Sidebar (18% width) */}
        <div className="w-64 bg-slate-50 border-r border-slate-200 flex flex-col justify-between shrink-0 p-4">
          <div className="space-y-1">
            <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-3 mb-2">
              Template Sections
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('header')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                activeTab === 'header'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <Layout className="w-4 h-4" />
              <span>Header & Branding</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('patient_info')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                activeTab === 'patient_info'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <User className="w-4 h-4" />
              <span>Patient Info Bar</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('left_column')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                activeTab === 'left_column'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <Columns className="w-4 h-4" />
              <span>Left Case Paper Column</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('footer')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                activeTab === 'footer'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <Footprints className="w-4 h-4" />
              <span>Footer & Warnings</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('general')}
              className={`w-full px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2.5 ${
                activeTab === 'general'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'text-slate-600 hover:bg-slate-200/60 hover:text-slate-900'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>General Settings</span>
            </button>
          </div>

          {/* Quick Tips Box */}
          <div className="bg-indigo-50/80 border border-indigo-100 rounded-xl p-3 text-[11px] text-indigo-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-indigo-700">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Quick Tips</span>
            </div>
            <ul className="space-y-1 text-slate-600 pl-1 list-disc list-inside">
              <li>Edit fields in the middle form</li>
              <li>Upload custom clinic logo</li>
              <li>Real-time updates in preview</li>
            </ul>
          </div>
        </div>

        {/* COLUMN 2: Center Controls Form Panel (38% width) */}
        <div className="w-96 bg-white border-r border-slate-200 p-6 overflow-y-auto shrink-0 space-y-6">
          
          {/* TAB 1: HEADER & BRANDING */}
          {activeTab === 'header' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Edit Header & Branding</h2>
                <p className="text-xs text-slate-500 mt-0.5">Customize clinic details, doctor info and header design.</p>
              </div>

              {/* Clinic Names */}
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Clinic / Hospital Name
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                    value={settings.clinicNameHi}
                    onChange={(e) => setSettings({ ...settings, clinicNameHi: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                    Clinic Subtitle (English)
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                    value={settings.clinicNameEn}
                    onChange={(e) => setSettings({ ...settings, clinicNameEn: e.target.value })}
                  />
                </div>
              </div>

              {/* ── CLINIC LOGO CONTROL (MATCHING SCREENSHOT) ── */}
              <div className="pt-3 border-t border-slate-100 space-y-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Clinic Logo
                </label>
                
                <div className="flex items-center gap-4">
                  {/* Logo Preview Tile */}
                  <div className="w-16 h-16 rounded-xl border border-slate-200 bg-slate-50 p-2 flex items-center justify-center shrink-0 shadow-sm overflow-hidden">
                    {settings.logoUrl ? (
                      <img src={settings.logoUrl} alt="Clinic Logo" className="w-full h-full object-contain" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-purple-800 to-pink-600 flex items-center justify-center text-white">
                        <svg viewBox="0 0 24 24" fill="currentColor" className="w-7 h-7">
                          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8 0-2.38 1.04-4.52 2.7-6 .19 1.62.9 3.09 2.05 4.2.14-1.97.94-3.75 2.25-5.1.84.97 1.45 2.15 1.75 3.45.69-.96 1.62-1.74 2.72-2.25C15.9 7.7 16 9.32 16 11c0 2.21-.89 4.21-2.34 5.66A7.95 7.95 0 0 1 12 20z"/>
                        </svg>
                      </div>
                    )}
                  </div>

                  {/* Upload & Remove Action Buttons */}
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3.5 py-1.5 border border-indigo-200 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 bg-white shadow-sm"
                      >
                        <Upload className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Change Logo</span>
                      </button>

                      {settings.logoUrl && (
                        <button
                          type="button"
                          onClick={handleRemoveLogo}
                          className="px-3.5 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 bg-white"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-red-500" />
                          <span>Remove</span>
                        </button>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-medium">
                      Recommended: PNG, JPG (Max 2MB)
                    </div>
                  </div>
                </div>
              </div>

              {/* Left Doctor Details */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Left Doctor Details
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    value={doc1.name}
                    onChange={(e) => handleUpdateDoctor(0, 'name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Qualifications</label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    value={doc1.title}
                    onChange={(e) => handleUpdateDoctor(0, 'title', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Reg. No.</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                      value={doc1.regNo}
                      onChange={(e) => handleUpdateDoctor(0, 'regNo', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Specialty</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                      value={doc1.specialty || ''}
                      onChange={(e) => handleUpdateDoctor(0, 'specialty', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Right Doctor Details */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div className="text-xs font-bold uppercase tracking-wider text-indigo-600">
                  Right Doctor Details
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Name</label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500"
                    value={doc2.name}
                    onChange={(e) => handleUpdateDoctor(1, 'name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Qualifications</label>
                  <input
                    type="text"
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    value={doc2.title}
                    onChange={(e) => handleUpdateDoctor(1, 'title', e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Reg. No.</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                      value={doc2.regNo}
                      onChange={(e) => handleUpdateDoctor(1, 'regNo', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Specialty</label>
                    <input
                      type="text"
                      className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                      value={doc2.specialty || ''}
                      onChange={(e) => handleUpdateDoctor(1, 'specialty', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Timings & Address */}
              <div className="space-y-3 pt-3 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Opening Timings</label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    value={settings.openingHours}
                    onChange={(e) => setSettings({ ...settings, openingHours: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Address Bar Text (Green Bar)</label>
                  <textarea
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={2}
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Address Strip Color</label>
                  <input
                    type="color"
                    className="w-full h-10 p-1 border border-slate-300 rounded-lg cursor-pointer"
                    value={settings.headerBgColor}
                    onChange={(e) => setSettings({ ...settings, headerBgColor: e.target.value })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: PATIENT INFO */}
          {activeTab === 'patient_info' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Patient Info Bar Settings</h2>
                <p className="text-xs text-slate-500 mt-0.5">Customize patient demographics fields and language labels.</p>
              </div>

              <div className="space-y-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600" />
                  <span>Show Patient Name & Date Line</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input type="checkbox" defaultChecked className="w-4 h-4 rounded text-indigo-600" />
                  <span>Show Village & Age/Sex Line</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: LEFT COLUMN CASE PAPER */}
          {activeTab === 'left_column' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Left Column Case Paper</h2>
                <p className="text-xs text-slate-500 mt-0.5">Show or hide clinical history, investigations checklist, and counselling boxes.</p>
              </div>

              <div className="space-y-3 text-xs font-semibold text-slate-800">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.sections.showPastHistory}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sections: { ...settings.sections, showPastHistory: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span>Past History (DM/HTN/Thyroid/Autoimmune)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.sections.showDrugHistory}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sections: { ...settings.sections, showDrugHistory: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span>Drug History & Allergy History</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.sections.showInvestigations}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sections: { ...settings.sections, showInvestigations: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span>Investigations Advised Checklist (CBC, LFT, BSL)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.sections.showCounselling}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sections: { ...settings.sections, showCounselling: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span>Patient Counselling Documentation Box</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.sections.showWarnings}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        sections: { ...settings.sections, showWarnings: e.target.checked },
                      })
                    }
                    className="w-4 h-4 rounded text-indigo-600"
                  />
                  <span>Warning Explained Red Box</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 4: FOOTER */}
          {activeTab === 'footer' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">Footer & Warnings Settings</h2>
                <p className="text-xs text-slate-500 mt-0.5">Customize high-risk drug warnings and pharmacy medical line.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                  Pharmacy Line (At Bottom)
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"
                  value={settings.pharmacyInfo}
                  onChange={(e) => setSettings({ ...settings, pharmacyInfo: e.target.value })}
                />
              </div>
            </div>
          )}

          {/* TAB 5: GENERAL SETTINGS */}
          {activeTab === 'general' && (
            <div className="space-y-5">
              <div>
                <h2 className="text-base font-bold text-slate-900">General Print Settings</h2>
                <p className="text-xs text-slate-500 mt-0.5">Configure page dimensions and font typography.</p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">Target Page Format</label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500 bg-white font-semibold">
                  <option value="A4">Standard A4 Paper (210mm x 297mm)</option>
                  <option value="A5">Compact A5 Letterhead</option>
                </select>
              </div>
            </div>
          )}

        </div>

        {/* COLUMN 3: Right Live Preview Panel (44% width) */}
        <div className="flex-1 bg-slate-200/80 p-6 overflow-y-auto flex justify-center">
          <div className="w-[210mm] min-h-[297mm] bg-white shadow-2xl p-0 rounded border border-slate-300 relative overflow-hidden">
            
            {showFieldTags && (
              <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded shadow">
                FIELD TAGS ACTIVE
              </div>
            )}

            <PrintTemplate
              patient={samplePatient as any}
              casePaper={sampleCasePaper as any}
              clinicSettings={settings}
            />
          </div>
        </div>

      </div>

    </div>
  );
}
