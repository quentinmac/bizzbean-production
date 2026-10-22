import React, { useState } from 'react';
import { Type, List, AlignLeft, Eye, Edit3, RotateCcw } from 'lucide-react';
import { FormattedAboutContent } from './FormattedAboutContent';

interface AboutPanelTextEditorProps {
  value: string;
  onChange: (val: string) => void;
  label?: string;
  placeholder?: string;
  isDark?: boolean;
  rows?: number;
  defaultTemplate?: string;
}

export const AboutPanelTextEditor: React.FC<AboutPanelTextEditorProps> = ({
  value,
  onChange,
  label,
  placeholder = 'Enter content...',
  isDark = false,
  rows = 4,
  defaultTemplate,
}) => {
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  const insertSnippet = (prefix: string, placeholderText: string, suffix: string = '') => {
    const currentVal = value || '';
    const needsPrefixNewline = currentVal.length > 0 && !currentVal.endsWith('\n');
    const newContent = `${currentVal}${needsPrefixNewline ? '\n' : ''}${prefix}${placeholderText}${suffix}`;
    onChange(newContent);
  };

  const handleAddHeading = () => {
    insertSnippet('### ', 'New Section Heading', '\n');
  };

  const handleAddParagraph = () => {
    const currentVal = value || '';
    const needsDoubleBreak = currentVal.length > 0 ? (currentVal.endsWith('\n\n') ? '' : currentVal.endsWith('\n') ? '\n' : '\n\n') : '';
    onChange(`${currentVal}${needsDoubleBreak}Write new paragraph text here discussing strategic context and operational depth.`);
  };

  const handleAddBullet = () => {
    insertSnippet('• ', 'Key bullet point or strategic deliverable', '\n');
  };

  const handleResetToTemplate = () => {
    if (defaultTemplate) {
      onChange(defaultTemplate);
    }
  };

  return (
    <div className="space-y-2">
      {/* Editor Toolbar with Heading, Paragraph, and Bullet buttons */}
      <div className="flex flex-wrap items-center justify-between gap-1.5 pb-1 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase mr-1">Insert:</span>

          <button
            type="button"
            onClick={handleAddHeading}
            className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold flex items-center gap-1 transition-colors ${
              isDark
                ? 'bg-[#1E2548] text-amber-300 hover:bg-[#283260] border border-[#2B385E]'
                : 'bg-[#F4EFE6] text-amber-900 hover:bg-[#EAE2D5] border border-[#D8CEBC]'
            }`}
            title="Add a heading (### Heading)"
          >
            <Type className="w-3 h-3 text-[#C59B63]" />
            <span>+ Heading</span>
          </button>

          <button
            type="button"
            onClick={handleAddParagraph}
            className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold flex items-center gap-1 transition-colors ${
              isDark
                ? 'bg-[#1E2548] text-slate-200 hover:bg-[#283260] border border-[#2B385E]'
                : 'bg-[#F4EFE6] text-slate-800 hover:bg-[#EAE2D5] border border-[#D8CEBC]'
            }`}
            title="Add a paragraph"
          >
            <AlignLeft className="w-3 h-3 text-sky-400" />
            <span>+ Paragraph</span>
          </button>

          <button
            type="button"
            onClick={handleAddBullet}
            className={`px-2 py-0.5 rounded text-[11px] font-mono font-semibold flex items-center gap-1 transition-colors ${
              isDark
                ? 'bg-[#1E2548] text-emerald-300 hover:bg-[#283260] border border-[#2B385E]'
                : 'bg-[#F4EFE6] text-emerald-900 hover:bg-[#EAE2D5] border border-[#D8CEBC]'
            }`}
            title="Add a bullet point (• Bullet item)"
          >
            <List className="w-3 h-3 text-emerald-400" />
            <span>+ Bullet</span>
          </button>
        </div>

        {/* View Toggle & Reset */}
        <div className="flex items-center gap-1">
          {defaultTemplate && (
            <button
              type="button"
              onClick={handleResetToTemplate}
              className="px-1.5 py-0.5 text-[10px] font-mono text-slate-400 hover:text-amber-400 flex items-center gap-1 transition-colors"
              title="Reset to default formatted template"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Template</span>
            </button>
          )}

          <div className="flex rounded-md overflow-hidden border border-slate-200 dark:border-slate-700 text-[10px] font-mono">
            <button
              type="button"
              onClick={() => setActiveTab('edit')}
              className={`px-2 py-0.5 flex items-center gap-1 ${
                activeTab === 'edit'
                  ? 'bg-[#C59B63] text-black font-bold'
                  : isDark
                  ? 'bg-[#101424] text-slate-400 hover:text-white'
                  : 'bg-white text-slate-600 hover:text-black'
              }`}
            >
              <Edit3 className="w-2.5 h-2.5" />
              <span>Edit</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('preview')}
              className={`px-2 py-0.5 flex items-center gap-1 ${
                activeTab === 'preview'
                  ? 'bg-[#C59B63] text-black font-bold'
                  : isDark
                  ? 'bg-[#101424] text-slate-400 hover:text-white'
                  : 'bg-white text-slate-600 hover:text-black'
              }`}
            >
              <Eye className="w-2.5 h-2.5" />
              <span>Preview</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor Body */}
      {activeTab === 'edit' ? (
        <div className="relative">
          <textarea
            rows={rows}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={`w-full px-3 py-2 rounded-lg border font-mono text-xs focus:outline-none transition-colors ${
              isDark
                ? 'bg-[#0A0D14] border-[#252E4A] text-white focus:border-[#C59B63]'
                : 'bg-[#FAF8F5] border-[#D8CEBC] text-slate-900 focus:border-[#12172A]'
            }`}
          />
          <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between mt-1 px-1">
            <span>Syntax: <code className="text-[#C59B63]">### Heading</code> · <code className="text-sky-400">Blank line = Paragraph</code> · <code className="text-emerald-400">• Bullet</code></span>
            <span>{value ? `${value.length} chars` : 'empty'}</span>
          </div>
        </div>
      ) : (
        <div
          className={`p-3 rounded-lg border min-h-[90px] max-h-56 overflow-y-auto ${
            isDark ? 'bg-[#0A0D14] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
          }`}
        >
          {value ? (
            <FormattedAboutContent content={value} isDark={isDark} />
          ) : (
            <span className="text-xs text-slate-400 italic">No content to preview</span>
          )}
        </div>
      )}
    </div>
  );
};
