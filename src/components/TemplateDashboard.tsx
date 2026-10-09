import { useState } from 'react';
import { Plus, Layout, Database } from 'lucide-react';
import { useClinic } from '../context/ClinicContext';
import type { CaseTemplate } from '../data/templates';
import TemplateList from './TemplateList';
import TemplateEditor from './TemplateEditor';
import TemplatePreview from './TemplatePreview';
import PrescriptionTemplateEditor from './PrescriptionTemplateEditor';
import MedicineImportModal from './MedicineImportModal';
import ConfirmModal from './ConfirmModal';

interface TemplateDashboardProps {
  onUseTemplateInEMR?: (templateId: string) => void;
}

export default function TemplateDashboard({ onUseTemplateInEMR }: TemplateDashboardProps) {
  const { templates, addTemplate, updateTemplate, deleteTemplate, toggleFavoriteTemplate, duplicateTemplate } = useClinic();

  const [view, setView] = useState<'list' | 'editor' | 'preview'>('list');
  const [selectedTemplate, setSelectedTemplate] = useState<CaseTemplate | null>(null);
  const [isFullLayoutEditorOpen, setIsFullLayoutEditorOpen] = useState(false);
  const [isMedicineImportOpen, setIsMedicineImportOpen] = useState(false);
  const [confirmDeleteTemplate, setConfirmDeleteTemplate] = useState<{ id: string; name: string } | null>(null);

  const handleCreateNew = () => {
    const newTpl: CaseTemplate = {
      id: `tpl_${Date.now()}`,
      name: '',
      description: '',
      medicines: [],
      investigationsAdvised: [],
      counsellingPoints: [],
      isFavorite: false,
      createdDate: new Date().toISOString().split('T')[0],
      updatedDate: new Date().toISOString().split('T')[0],
    };
    setSelectedTemplate(newTpl);
    setView('editor');
  };

  const handleEdit = (id: string) => {
    const tpl = templates.find((t) => t.id === id);
    if (tpl) {
      setSelectedTemplate(tpl);
      setView('editor');
    }
  };

  const handlePreview = (id: string) => {
    const tpl = templates.find((t) => t.id === id);
    if (tpl) {
      setSelectedTemplate(tpl);
      setView('preview');
    }
  };

  const handleSave = (templateData: CaseTemplate) => {
    const exists = templates.some((t) => t.id === templateData.id);
    if (exists) {
      updateTemplate(templateData);
    } else {
      addTemplate(templateData);
    }
    setView('list');
    setSelectedTemplate(null);
  };

  const handleDelete = (id: string) => {
    const tpl = templates.find((t) => t.id === id);
    setConfirmDeleteTemplate({
      id,
      name: tpl?.name || 'this template'
    });
  };

  return (
    <div className="space-y-6">


      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#faf9f6] dark:bg-[#121214] p-5 rounded-2xl border border-[#e4e2e1] dark:border-[#27272a] shadow-sm">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#1a1c1a] dark:text-[#f4f4f5]">Prescription Protocol & Layout Builder</h2>
          <p className="text-xs text-[#7c766d] dark:text-[#a1a1aa] mt-0.5">
            Customize clinic header details, bulk import medicines via CSV/Excel, and 1-click clinical protocol templates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsMedicineImportOpen(true)}
            className="px-3.5 py-2.5 bg-gradient-to-r from-[#064e3b] to-[#047857] hover:from-[#022c22] hover:to-[#064e3b] text-white rounded-xl font-bold text-xs shadow-md shadow-emerald-950/20 transition-all flex items-center gap-1.5"
          >
            <Database className="w-4 h-4 text-emerald-100" />
            <span>Import Medicines (CSV/Excel)</span>
          </button>

          <button
            onClick={() => setIsFullLayoutEditorOpen(true)}
            className="px-4 py-2.5 bg-[#f2eee3] hover:bg-[#e8e2d2] dark:bg-[#18181b] dark:hover:bg-[#222226] text-[#1a1c1a] dark:text-[#f4f4f5] border border-[#cdc6ba] dark:border-[#27272a] rounded-xl font-bold text-xs shadow-sm transition-all flex items-center gap-2"
          >
            <Layout className="w-4 h-4 text-[#047857] dark:text-emerald-400" />
            <span>Edit Full Layout & Header</span>
          </button>

          {view === 'list' && (
            <button
              onClick={handleCreateNew}
              className="px-5 py-2.5 bg-zinc-900 hover:bg-zinc-800 dark:bg-zinc-100 dark:hover:bg-zinc-200 text-white dark:text-zinc-950 rounded-xl font-bold text-xs shadow-md shadow-black/20 transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus className="w-4 h-4 text-white dark:text-zinc-950" />
              <span>Create Protocol Template</span>
            </button>
          )}
        </div>
      </div>

      {/* Main View Area */}
      {view === 'list' && (
        <TemplateList
          templates={templates}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onToggleFavorite={toggleFavoriteTemplate}
          onDuplicate={duplicateTemplate}
          onPreview={handlePreview}
        />
      )}

      {view === 'editor' && selectedTemplate && (
        <TemplateEditor
          template={selectedTemplate}
          onSave={handleSave}
          onCancel={() => {
            setView('list');
            setSelectedTemplate(null);
          }}
          onPreview={() => setView('preview')}
        />
      )}

      {view === 'preview' && selectedTemplate && (
        <TemplatePreview
          template={selectedTemplate}
          onBack={() => {
            setView('list');
            setSelectedTemplate(null);
          }}
          onUseInEMR={onUseTemplateInEMR ? () => onUseTemplateInEMR(selectedTemplate.id) : undefined}
        />
      )}

      {/* Full Prescription Layout Builder Modal */}
      {isFullLayoutEditorOpen && (
        <PrescriptionTemplateEditor onClose={() => setIsFullLayoutEditorOpen(false)} />
      )}

      {/* Bulk Medicine Import Modal */}
      {isMedicineImportOpen && (
        <MedicineImportModal onClose={() => setIsMedicineImportOpen(false)} />
      )}

      {/* Modern In-App Confirm Delete Modal */}
      <ConfirmModal
        isOpen={Boolean(confirmDeleteTemplate)}
        title="Delete Protocol Template"
        message={`Are you sure you want to delete template "${confirmDeleteTemplate?.name}"?`}
        confirmText="Delete Template"
        isDestructive={true}
        onConfirm={() => {
          if (confirmDeleteTemplate) {
            deleteTemplate(confirmDeleteTemplate.id);
            setConfirmDeleteTemplate(null);
          }
        }}
        onCancel={() => setConfirmDeleteTemplate(null)}
      />
    </div>
  );
}
