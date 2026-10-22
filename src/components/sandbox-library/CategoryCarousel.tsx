import React, { useRef, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
} from 'lucide-react';
import { JournalCategory } from '../../types/sandboxLibrary';

interface CategoryCarouselProps {
  categories: JournalCategory[];
  selectedCategory: string;
  onSelectCategory: (categoryId: string) => void;
  onAddCategory?: (name: string, color?: string) => void;
  onDeleteCategory?: (id: string) => void;
  totalDocCount: number;
  categoryDocCounts: Record<string, number>;
  theme?: 'light' | 'dark';
}

export const CategoryCarousel: React.FC<CategoryCarouselProps> = ({
  categories,
  selectedCategory,
  onSelectCategory,
  onAddCategory,
  onDeleteCategory,
  totalDocCount,
  categoryDocCounts,
  theme = 'dark'
}) => {
  const isDark = theme === 'dark';
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatColor, setNewCatColor] = useState('gold');

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -260 : 260,
        behavior: 'smooth'
      });
    }
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim() || !onAddCategory) return;
    onAddCategory(newCatName.trim(), newCatColor);
    setNewCatName('');
    setIsAdding(false);
  };

  return (
    <div className="relative py-2 px-1">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`text-[11px] font-mono font-bold uppercase tracking-wider ${
            isDark ? 'text-slate-400' : 'text-slate-500'
          }`}>
            Knowledge Vault Sections
          </span>
          <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
            isDark
              ? 'bg-[#161C30] text-[#D4A373] border-[#252E4A]'
              : 'bg-[#F4EFE6] text-[#C59B63] border-[#E8E2D8]'
          }`}>
            {categories.length} Topics
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setIsAdding(!isAdding)}
            className={`flex items-center gap-1 text-[11px] font-mono font-bold tracking-wider uppercase px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
              isDark
                ? 'text-[#D4A373] hover:text-white hover:bg-[#C59B63]/15'
                : 'text-[#C59B63] hover:text-[#12172A] hover:bg-[#C59B63]/15'
            }`}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Section</span>
          </button>
          <button
            onClick={() => scroll('left')}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer border ${
              isDark
                ? 'bg-[#161C30] hover:bg-[#1E2548] text-slate-300 border-[#252E4A]'
                : 'bg-white hover:bg-slate-100 text-slate-600 border-[#E8E2D8]'
            }`}
            title="Scroll left"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => scroll('right')}
            className={`w-7 h-7 flex items-center justify-center rounded-lg transition-colors cursor-pointer border ${
              isDark
                ? 'bg-[#161C30] hover:bg-[#1E2548] text-slate-300 border-[#252E4A]'
                : 'bg-white hover:bg-slate-100 text-slate-600 border-[#E8E2D8]'
            }`}
            title="Scroll right"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {isAdding && (
        <form
          onSubmit={handleCreate}
          className={`mb-3 p-3 rounded-xl flex items-center gap-3 border shadow-md ${
            isDark
              ? 'bg-[#161C30] border-[#252E4A]'
              : 'bg-white border-[#E8E2D8]'
          }`}
        >
          <input
            type="text"
            value={newCatName}
            onChange={(e) => setNewCatName(e.target.value)}
            placeholder="New section name (e.g. Franchising, Tax Models)..."
            className={`flex-1 text-xs px-3 py-1.5 rounded-lg border focus:outline-none focus:ring-1 focus:ring-[#C59B63] ${
              isDark
                ? 'bg-[#101424] text-slate-100 border-[#252E4A] placeholder-slate-500'
                : 'bg-[#FAF8F5] text-slate-800 border-[#E8E2D8] placeholder-slate-400'
            }`}
            autoFocus
          />
          <div className="flex items-center gap-1">
            {['gold', 'sky', 'emerald', 'amber', 'rose', 'purple'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewCatColor(c)}
                className={`w-4 h-4 rounded-full border transition-transform ${
                  newCatColor === c ? 'ring-2 ring-[#C59B63] scale-110' : 'opacity-70'
                } ${
                  c === 'gold' ? 'bg-[#C59B63]' :
                  c === 'sky' ? 'bg-sky-400' :
                  c === 'emerald' ? 'bg-emerald-400' :
                  c === 'amber' ? 'bg-amber-400' :
                  c === 'rose' ? 'bg-rose-400' : 'bg-purple-400'
                }`}
              />
            ))}
          </div>
          <button
            type="submit"
            className="px-3.5 py-1.5 bg-[#C59B63] hover:bg-[#D4A373] text-[#12172A] font-bold text-xs rounded-lg cursor-pointer transition-colors shadow-xs"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => setIsAdding(false)}
            className={`p-1 rounded-lg cursor-pointer transition-colors ${
              isDark ? 'text-slate-400 hover:text-white' : 'text-slate-400 hover:text-slate-700'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      <div ref={scrollRef} className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth pb-1">
        <button
          onClick={() => onSelectCategory('ALL')}
          className={`flex-shrink-0 flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
            selectedCategory === 'ALL'
              ? isDark
                ? 'bg-gradient-to-r from-[#C59B63] to-[#D4A373] text-[#12172A] border-[#D4A373] shadow-md shadow-[#C59B63]/25 font-black'
                : 'bg-[#12172A] text-white border-[#12172A] shadow-md shadow-black/10 font-black'
              : isDark
              ? 'bg-[#161C30]/80 hover:bg-[#1E2548] text-slate-300 border-[#252E4A] hover:border-[#5584B4]'
              : 'bg-white hover:bg-[#F4EFE6] text-slate-700 border-[#E8E2D8] hover:border-[#C59B63]'
          }`}
        >
          <span>All Documents</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
            selectedCategory === 'ALL'
              ? isDark ? 'bg-black/20 text-[#12172A]' : 'bg-white/20 text-white'
              : isDark ? 'bg-[#101424] text-slate-400' : 'bg-[#EAE3D4] text-slate-600'
          }`}>
            {totalDocCount}
          </span>
        </button>

        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.name;
          const count = categoryDocCounts[cat.name] || 0;
          return (
            <div key={cat.id} className="flex-shrink-0 group relative">
              <button
                onClick={() => onSelectCategory(cat.name)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                  isSelected
                    ? isDark
                      ? 'bg-gradient-to-r from-[#C59B63] to-[#D4A373] text-[#12172A] border-[#D4A373] shadow-md shadow-[#C59B63]/25 font-black'
                      : 'bg-[#12172A] text-white border-[#12172A] shadow-md shadow-black/10 font-black'
                    : isDark
                    ? 'bg-[#161C30]/80 hover:bg-[#1E2548] text-slate-300 border-[#252E4A] hover:border-[#5584B4]'
                    : 'bg-white hover:bg-[#F4EFE6] text-slate-700 border-[#E8E2D8] hover:border-[#C59B63]'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${
                  cat.color === 'emerald' ? 'bg-emerald-400' :
                  cat.color === 'amber' ? 'bg-amber-400' :
                  cat.color === 'rose' ? 'bg-rose-400' :
                  cat.color === 'purple' ? 'bg-purple-400' :
                  cat.color === 'cyan' ? 'bg-cyan-400' :
                  cat.color === 'indigo' ? 'bg-indigo-400' :
                  cat.color === 'gold' ? 'bg-[#C59B63]' : 'bg-sky-400'
                }`} />
                <span>{cat.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold ${
                  isSelected
                    ? isDark ? 'bg-black/20 text-[#12172A]' : 'bg-white/20 text-white'
                    : isDark ? 'bg-[#101424] text-slate-400' : 'bg-[#EAE3D4] text-slate-600'
                }`}>
                  {count}
                </span>
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};
