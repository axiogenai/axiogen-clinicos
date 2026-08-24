import { useState, useMemo } from 'react';
import { Search, FolderOpen } from 'lucide-react';
import type { CaseTemplate } from '../data/templates';
import TemplateCard from './TemplateCard';

interface TemplateListProps {
  templates: CaseTemplate[];
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onDuplicate: (id: string) => void;
  onPreview: (id: string) => void;
}

type SortOption = 'favorites' | 'recent' | 'az';

export default function TemplateList({
  templates,
  onEdit,
  onDelete,
  onToggleFavorite,
  onDuplicate,
  onPreview,
}: TemplateListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('favorites');

  const filteredAndSortedTemplates = useMemo(() => {
    let result = templates.filter(
      (t) =>
        t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.description?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    result.sort((a, b) => {
      if (sortBy === 'favorites') {
        if (a.isFavorite && !b.isFavorite) return -1;
        if (!a.isFavorite && b.isFavorite) return 1;
        return a.name.localeCompare(b.name);
      } else if (sortBy === 'az') {
        return a.name.localeCompare(b.name);
      } else {
        return 0; 
      }
    });

    return result;
  }, [templates, searchQuery, sortBy]);

  return (
    <div className="space-y-6">
      {/* Filter & Sort Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#faf9f6] p-4 rounded-2xl border border-[#e4e2e1] shadow-sm">
        <div className="flex items-center gap-3 w-full sm:max-w-lg">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[#7c766d] absolute left-3.5 top-3" />
            <input
              type="text"
              className="block w-full pl-10 pr-4 py-2 border border-[#cdc6ba] rounded-xl text-xs bg-white text-[#1a1c1a] placeholder-[#7c766d] focus:outline-none focus:ring-2 focus:ring-[#047857] transition-all font-semibold"
              placeholder="Search templates by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Dynamic Total Protocol Template Count */}
          <div className="px-3 py-2 rounded-xl bg-[#ecfdf5] border border-[#a7f3d0] text-[#047857] text-xs font-bold whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-xs">
            <span className="text-[11px] text-[#065f46] font-semibold">Total:</span>
            <span className="text-sm font-black text-[#047857]">{templates.length}</span>
            <span className="text-[11px] text-[#047857] font-semibold">{templates.length === 1 ? 'Template' : 'Templates'}</span>
          </div>
        </div>

        <div className="w-full sm:w-auto flex items-center gap-2 justify-end">
          <span className="text-xs font-bold text-[#7c766d] uppercase tracking-wider">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="block w-full sm:w-44 px-3 py-2 text-xs font-bold text-[#1a1c1a] bg-white border border-[#cdc6ba] focus:outline-none focus:ring-2 focus:ring-[#047857] rounded-xl"
          >
            <option value="favorites">★ Favorites First</option>
            <option value="recent">Recently Created</option>
            <option value="az">Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Template Card Grid */}
      {filteredAndSortedTemplates.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              template={template}
              onEdit={() => onEdit(template.id)}
              onDelete={() => onDelete(template.id)}
              onToggleFavorite={() => onToggleFavorite(template.id)}
              onDuplicate={() => onDuplicate(template.id)}
              onPreview={() => onPreview(template.id)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-[#faf9f6] rounded-2xl border border-dashed border-[#cdc6ba] p-8">
          <FolderOpen className="mx-auto h-12 w-12 text-[#7c766d] mb-3" />
          <h3 className="text-base font-serif font-bold text-[#1a1c1a]">No templates found</h3>
          <p className="mt-1 text-xs text-[#7c766d]">
            {searchQuery ? 'Try adjusting your search query.' : 'Get started by creating a new template.'}
          </p>
        </div>
      )}
    </div>
  );
}
