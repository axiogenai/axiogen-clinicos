import { Star, Pill, FlaskConical, Lightbulb, Trash2, Edit3, Eye, Copy } from 'lucide-react';
import type { CaseTemplate } from '../data/templates';

interface TemplateCardProps {
  template: CaseTemplate;
  onEdit: () => void;
  onDelete: () => void;
  onToggleFavorite: () => void;
  onDuplicate: () => void;
  onPreview: () => void;
}

export default function TemplateCard({
  template,
  onEdit,
  onDelete,
  onToggleFavorite,
  onDuplicate,
  onPreview,
}: TemplateCardProps) {
  return (
    <div className="bg-[#faf9f6] rounded-2xl border border-[#e4e2e1] p-5 shadow-sm hover:shadow-md hover:border-[#cdc6ba] transition-all flex flex-col justify-between group">
      <div>
        {/* Header with Title & Favorite Star */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 
            onClick={onEdit}
            className="font-serif font-bold text-lg text-[#1a1c1a] group-hover:text-[#047857] transition-colors cursor-pointer leading-snug"
          >
            {template.name}
          </h3>
          <button
            type="button"
            onClick={onToggleFavorite}
            className="p-1 rounded-lg hover:bg-[#f2eee3] transition-colors"
            title={template.isFavorite ? 'Remove from Favorites' : 'Mark as Favorite'}
          >
            <Star className={`w-4 h-4 ${
              template.isFavorite ? 'text-amber-500 fill-amber-500' : 'text-[#cdc6ba] hover:text-amber-500'
            }`} />
          </button>
        </div>

        {/* Description */}
        {template.description && (
          <p className="text-xs text-[#7c766d] mb-4 line-clamp-2 leading-relaxed">{template.description}</p>
        )}

        {/* Badges / Metrics */}
        <div className="flex flex-wrap gap-2 mb-4 text-xs">
          <span className="bg-[#f8f6f0] text-[#4b463e] font-semibold px-2.5 py-1 rounded-lg border border-[#e4e2e1] flex items-center gap-1.5">
            <Pill className="w-3.5 h-3.5 text-[#047857]" />
            <span>{template.medicines.length} Medicine{template.medicines.length === 1 ? '' : 's'}</span>
          </span>
          <span className="bg-[#fefce8] text-[#854d0e] font-semibold px-2.5 py-1 rounded-lg border border-[#fef08a] flex items-center gap-1.5">
            <FlaskConical className="w-3.5 h-3.5 text-[#854d0e]" />
            <span>{template.investigationsAdvised?.length || 0} Test{(template.investigationsAdvised?.length || 0) === 1 ? '' : 's'}</span>
          </span>
          {(template.counsellingPoints?.length || 0) > 0 && (
            <span className="bg-[#f0fdf4] text-[#166534] font-semibold px-2.5 py-1 rounded-lg border border-[#bbf7d0] flex items-center gap-1.5">
              <Lightbulb className="w-3.5 h-3.5 text-[#166534]" />
              <span>{template.counsellingPoints.length} Advice</span>
            </span>
          )}
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="pt-4 border-t border-[#e4e2e1] flex items-center justify-between text-xs gap-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onEdit}
            className="bg-[#f2eee3] hover:bg-[#e8e2d2] text-[#1a1c1a] font-bold px-3 py-1.5 rounded-xl border border-[#cdc6ba] transition-all flex items-center gap-1 shadow-sm"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#4b463e]" />
            <span>Edit</span>
          </button>
          <button
            type="button"
            onClick={onPreview}
            className="bg-[#ecfdf5] hover:bg-[#d1fae5] text-[#047857] font-bold px-3 py-1.5 rounded-xl border border-[#a7f3d0] transition-all flex items-center gap-1 shadow-sm"
          >
            <Eye className="w-3.5 h-3.5 text-[#065f46]" />
            <span>Preview</span>
          </button>
          <button
            type="button"
            onClick={onDuplicate}
            className="bg-[#f8f6f0] hover:bg-[#f2eee3] text-[#4b463e] font-bold px-2.5 py-1.5 rounded-xl border border-[#e4e2e1] transition-all flex items-center gap-1 shadow-sm"
            title="Duplicate Template"
          >
            <Copy className="w-3.5 h-3.5 text-[#7c766d]" />
            <span>Copy</span>
          </button>
        </div>

        <button
          type="button"
          onClick={onDelete}
          className="bg-[#fff1f2] hover:bg-[#ffe4e6] text-[#e11d48] p-1.5 rounded-xl border border-[#fecdd3] transition-all shadow-sm"
          title="Delete Template"
        >
          <Trash2 className="w-3.5 h-3.5 text-[#e11d48]" />
        </button>
      </div>
    </div>
  );
}
