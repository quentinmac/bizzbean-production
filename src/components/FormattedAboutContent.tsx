import React from 'react';
import { ChevronRight } from 'lucide-react';

interface FormattedAboutContentProps {
  content?: string;
  isDark?: boolean;
  className?: string;
}

interface Block {
  type: 'heading' | 'subheading' | 'paragraph' | 'bullet_list';
  text?: string;
  items?: string[];
}

export function parseFormattedContent(rawText: string): Block[] {
  if (!rawText || !rawText.trim()) return [];

  const lines = rawText.split('\n');
  const blocks: Block[] = [];
  let currentParagraphLines: string[] = [];
  let currentBulletItems: string[] = [];

  const flushParagraph = () => {
    if (currentParagraphLines.length > 0) {
      blocks.push({
        type: 'paragraph',
        text: currentParagraphLines.join(' ').trim(),
      });
      currentParagraphLines = [];
    }
  };

  const flushBullets = () => {
    if (currentBulletItems.length > 0) {
      blocks.push({
        type: 'bullet_list',
        items: [...currentBulletItems],
      });
      currentBulletItems = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Blank line indicates paragraph break
    if (!line) {
      flushParagraph();
      flushBullets();
      continue;
    }

    // Check for Heading (#, ##, ###, #### or line ending in : when short, or [HEADING])
    const isMarkdownH12 = /^#{1,2}\s+(.+)$/.test(line);
    const isMarkdownH34 = /^#{3,4}\s+(.+)$/.test(line);
    const isTagHeading = /^\[(HEADING|HEADER|TITLE)\]\s*(.+)$/i.test(line);
    const isColonHeading = line.length <= 60 && line.endsWith(':') && !line.startsWith('http') && !line.startsWith('•') && !line.startsWith('-') && !line.startsWith('*');

    if (isMarkdownH12 || isTagHeading) {
      flushParagraph();
      flushBullets();
      const headingText = isMarkdownH12
        ? line.replace(/^#{1,2}\s+/, '')
        : isTagHeading
        ? line.replace(/^\[(HEADING|HEADER|TITLE)\]\s*/i, '')
        : line;
      blocks.push({ type: 'heading', text: headingText });
      continue;
    }

    if (isMarkdownH34 || isColonHeading) {
      flushParagraph();
      flushBullets();
      const subHeadingText = isMarkdownH34 ? line.replace(/^#{3,4}\s+/, '') : line;
      blocks.push({ type: 'subheading', text: subHeadingText });
      continue;
    }

    // Check for Bullet points (- , * , • , – , or 1. , 2. )
    const bulletMatch = line.match(/^(\s*[-*•–]|\d+\.)\s+(.+)$/);
    if (bulletMatch) {
      flushParagraph();
      currentBulletItems.push(bulletMatch[2]);
      continue;
    }

    // Regular line -> accumulate into paragraph
    flushBullets();
    currentParagraphLines.push(line);
  }

  flushParagraph();
  flushBullets();
  return blocks;
}

export const renderInlineFormatting = (text: string) => {
  // Parse **bold** and `code`
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="font-mono text-[10px] px-1 py-0.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[#C59B63] mx-0.5"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={idx}>{part}</span>;
  });
};

export const FormattedAboutContent: React.FC<FormattedAboutContentProps> = ({
  content = '',
  isDark = false,
  className = '',
}) => {
  const blocks = parseFormattedContent(content);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-2.5 text-xs ${className}`}>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <div key={index} className="pt-1.5 first:pt-0">
              <h4 className="text-xs sm:text-sm font-bold tracking-wide text-slate-900 dark:text-white uppercase font-sans flex items-center gap-1.5">
                <span className="w-1.5 h-3.5 bg-[#C59B63] rounded-xs inline-block shrink-0" />
                <span>{block.text}</span>
              </h4>
            </div>
          );
        }

        if (block.type === 'subheading') {
          return (
            <div key={index} className="pt-1 first:pt-0">
              <h5 className="text-[11px] font-bold uppercase tracking-wider text-[#C59B63] dark:text-[#D4A373] font-mono flex items-center gap-1">
                <ChevronRight className="w-3 h-3 text-[#C59B63] shrink-0" />
                <span>{block.text}</span>
              </h5>
            </div>
          );
        }

        if (block.type === 'paragraph') {
          return (
            <p
              key={index}
              className={`leading-relaxed text-xs ${
                isDark ? 'text-slate-300' : 'text-slate-700'
              }`}
            >
              {renderInlineFormatting(block.text || '')}
            </p>
          );
        }

        if (block.type === 'bullet_list') {
          return (
            <ul key={index} className="space-y-1.5 my-1.5 pl-0.5">
              {block.items?.map((item, itemIdx) => (
                <li
                  key={itemIdx}
                  className={`flex items-start gap-2 text-xs leading-relaxed ${
                    isDark ? 'text-slate-300' : 'text-slate-700'
                  }`}
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-[#C59B63] mt-1.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    {renderInlineFormatting(item)}
                  </div>
                </li>
              ))}
            </ul>
          );
        }

        return null;
      })}
    </div>
  );
};
