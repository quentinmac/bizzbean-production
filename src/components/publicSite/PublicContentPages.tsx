import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Mail,
  Play,
  Search,
  Shield,
  X,
} from 'lucide-react';
import { CmsArticle, CmsVideo } from '../../data/cmsConsoleData';
import { LibraryItem } from '../../types';
import { slugifyArticleTitle } from '../../shared/seoRoutes';
import {
  DEFAULT_WHO_ARE_WE,
  DEFAULT_WHAT_WE_DO,
  DEFAULT_WHERE_ARE_WE_GOING,
  DEFAULT_HOW_SOLUTIONS_ENABLE_GROWTH,
} from '../../data/aboutDefaults';
import { PUBLIC_SITE_IMAGES } from './publicSiteData';
import { PublicBreadcrumb } from './PublicSolutionsPages';

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

function renderMarkdownSections(raw: string) {
  const lines = String(raw || '').split('\n');
  const elements: React.ReactNode[] = [];
  let bullets: string[] = [];

  const flushBullets = (keyPrefix: string) => {
    if (bullets.length === 0) return;
    elements.push(
      <ul key={`${keyPrefix}-ul`} className="space-y-2 pl-5 list-disc text-slate-700 dark:text-slate-300 text-base leading-relaxed">
        {bullets.map((b, i) => (
          <li key={i}>{b}</li>
        ))}
      </ul>
    );
    bullets = [];
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();
    if (!trimmed) {
      flushBullets(`empty-${idx}`);
      return;
    }
    if (trimmed.startsWith('### ')) {
      flushBullets(`h3-${idx}`);
      elements.push(
        <h3
          key={`h3-${idx}`}
          className="text-xl font-bold text-[#12172A] dark:text-white pt-4"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          {trimmed.slice(4)}
        </h3>
      );
    } else if (trimmed.startsWith('## ')) {
      flushBullets(`h2-${idx}`);
      elements.push(
        <h2
          key={`h2-${idx}`}
          className="text-2xl font-bold text-[#12172A] dark:text-white pt-5"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          {trimmed.slice(3)}
        </h2>
      );
    } else if (trimmed.startsWith('• ') || trimmed.startsWith('- ')) {
      bullets.push(trimmed.slice(2));
    } else {
      flushBullets(`p-${idx}`);
      elements.push(
        <p key={`p-${idx}`} className="text-base text-slate-700 dark:text-slate-300 leading-relaxed">
          {trimmed}
        </p>
      );
    }
  });
  flushBullets('end');
  return elements;
}

/* ========================================================================= */
/* SHARED ARTICLES & VIDEOS SWITCHER BAR                                     */
/* ========================================================================= */
const ArticlesVideosTabs: React.FC<{
  active: 'articles' | 'videos';
  articleCount: number;
  videoCount: number;
  onNavigate: (path: string) => void;
}> = ({ active, articleCount, videoCount, onNavigate }) => {
  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <div className="flex items-center gap-6 border-b border-[#E6DFD2] dark:border-[#222B45] mb-8">
      <a
        href="/articles"
        onClick={(e) => handleLink(e, '/articles')}
        className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
          active === 'articles'
            ? 'border-[#2E5E88] dark:border-[#7EB2E2] text-[#12172A] dark:text-white'
            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        Articles <span className="font-mono text-xs text-slate-400 ml-1 tabular-nums">({articleCount})</span>
      </a>
      <a
        href="/videos"
        onClick={(e) => handleLink(e, '/videos')}
        className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
          active === 'videos'
            ? 'border-[#2E5E88] dark:border-[#7EB2E2] text-[#12172A] dark:text-white'
            : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
      >
        Videos <span className="font-mono text-xs text-slate-400 ml-1 tabular-nums">({videoCount})</span>
      </a>
    </div>
  );
};

/* ========================================================================= */
/* 1. ARTICLES & VIDEOS INDEX PAGE (/articles)                               */
/* ========================================================================= */
export const PublicArticlesIndexPage: React.FC<{
  cmsArticles: CmsArticle[];
  cmsVideos: CmsVideo[];
  onNavigate: (path: string) => void;
}> = ({ cmsArticles, cmsVideos, onNavigate }) => {
  const [query, setQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [playingVideo, setPlayingVideo] = useState<CmsVideo | null>(null);

  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(path);
  };

  const categories = useMemo(() => {
    const set = new Set<string>();
    (cmsArticles || []).forEach((a) => {
      if (a.category) set.add(a.category.toLowerCase());
    });
    return ['all', ...Array.from(set)];
  }, [cmsArticles]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (cmsArticles || []).filter((art) => {
      if (selectedCategory !== 'all' && (art.category || '').toLowerCase() !== selectedCategory) {
        return false;
      }
      if (!q) return true;
      return (
        art.title.toLowerCase().includes(q) ||
        (art.summary || '').toLowerCase().includes(q) ||
        (art.author || '').toLowerCase().includes(q)
      );
    });
  }, [cmsArticles, query, selectedCategory]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <PublicBreadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Articles & Videos' }]}
        onNavigate={onNavigate}
      />

      <div className="max-w-3xl mb-8">
        <p className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373] mb-3">
          Articles & Videos
        </p>
        <h1
          className="text-4xl sm:text-5xl font-bold tracking-tight text-[#12172A] dark:text-white"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Practical writing and masterclass videos on finance and operations.
        </h1>
        <p className="mt-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          Read our executive briefs on business touch-points, budgeting, and capital readiness, or
          watch curated talks directly alongside them.
        </p>
      </div>

      <ArticlesVideosTabs
        active="articles"
        articleCount={(cmsArticles || []).length}
        videoCount={(cmsVideos || []).length}
        onNavigate={onNavigate}
      />

      {/* Search & Category Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-[#E6DFD2] dark:border-[#222B45]">
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider cursor-pointer transition-colors ${
                selectedCategory === cat
                  ? 'bg-[#12172A] dark:bg-white text-white dark:text-slate-950 font-semibold'
                  : 'bg-white dark:bg-[#111626] border border-[#E0D7C8] dark:border-[#242E49] text-slate-600 dark:text-slate-300 hover:border-[#2E5E88]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="h-4 w-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search articles..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#DFD7C8] dark:border-[#242E49] bg-white dark:bg-[#111626] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2E5E88]/40"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="py-16 text-center rounded-xl border border-[#E6DFD2] dark:border-[#242E49] bg-white dark:bg-[#111626]">
          <p className="text-base font-medium text-slate-700 dark:text-slate-300">
            No articles match your search.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setSelectedCategory('all');
            }}
            className="mt-3 text-sm font-semibold text-[#2E5E88] hover:underline cursor-pointer"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((art) => {
            const slug = slugifyArticleTitle(art.title);
            const path = `/articles/${slug}`;
            const hasSafeImage =
              art.imageUrl &&
              art.imageUrl.trim() !== '' &&
              !art.imageUrl.includes('images.unsplash.com');

            return (
              <a
                key={art.id}
                href={path}
                onClick={(e) => handleLink(e, path)}
                className="group rounded-xl border border-[#E6DFD2] dark:border-[#242E49] bg-white dark:bg-[#111626] overflow-hidden flex flex-col justify-between hover:border-[#2E5E88] dark:hover:border-[#7EB2E2] transition-colors"
              >
                <div>
                  {hasSafeImage && (
                    <div className="aspect-[16/9] overflow-hidden border-b border-[#EDE7DC] dark:border-[#222B45] bg-[#FAF8F5] dark:bg-[#0D111C]">
                      <img
                        src={art.imageUrl}
                        alt={art.title}
                        className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                      />
                    </div>
                  )}
                  <div className="p-6">
                    <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      {art.category || 'Strategy'} · {art.readTime || '4 min read'}
                    </p>
                    <h2
                      className="text-xl font-bold text-[#12172A] dark:text-white mt-2 capitalize group-hover:text-[#2E5E88] dark:group-hover:text-[#7EB2E2] transition-colors"
                      style={{ fontFamily: "'Outfit', sans-serif" }}
                    >
                      {art.title}
                    </h2>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-2.5 line-clamp-3 leading-relaxed">
                      {art.summary}
                    </p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-3 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 border-t border-[#F1ECE2] dark:border-[#1E263D]">
                  <span>{art.author || 'the bizzbean channel'}</span>
                  <span className="font-semibold text-[#2E5E88] dark:text-[#7EB2E2] inline-flex items-center gap-1">
                    Read <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      )}

      {/* Companion Featured Videos Strip */}
      {cmsVideos && cmsVideos.length > 0 && (
        <section className="mt-16 pt-12 border-t border-[#E6DFD2] dark:border-[#222B45]">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373] mb-2">
                Featured Videos
              </p>
              <h2
                className="text-2xl sm:text-3xl font-bold tracking-tight text-[#12172A] dark:text-white"
                style={{ fontFamily: "'Outfit', sans-serif" }}
              >
                Watch curated talks alongside the articles.
              </h2>
            </div>
            <a
              href="/videos"
              onClick={(e) => handleLink(e, '/videos')}
              className="text-sm font-semibold text-[#2E5E88] dark:text-[#7EB2E2] hover:underline shrink-0"
            >
              Browse all {cmsVideos.length} videos →
            </a>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cmsVideos.slice(0, 3).map((vid) => {
              const ytId = extractYouTubeId(vid.youtubeUrl);
              const thumb = ytId
                ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
                : PUBLIC_SITE_IMAGES.sandboxLibrary;
              return (
                <button
                  key={vid.id}
                  type="button"
                  onClick={() => setPlayingVideo(vid)}
                  className="group text-left rounded-xl border border-[#E6DFD2] dark:border-[#242E49] bg-white dark:bg-[#111626] overflow-hidden hover:border-[#2E5E88] transition-colors flex flex-col cursor-pointer"
                >
                  <div className="relative aspect-video w-full bg-[#12172A] overflow-hidden">
                    <img
                      src={thumb}
                      alt={vid.title}
                      className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                      <span className="h-11 w-11 rounded-full bg-[#12172A]/85 text-white flex items-center justify-center shadow-lg">
                        <Play className="h-4 w-4 fill-white ml-0.5" />
                      </span>
                    </div>
                  </div>
                  <div className="p-5 flex-1 flex flex-col justify-between">
                    <div>
                      <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        {vid.category || 'Masterclass'} · {vid.duration || 'Video'}
                      </p>
                      <h3 className="text-base font-bold text-[#12172A] dark:text-white mt-1.5 capitalize group-hover:text-[#2E5E88] dark:group-hover:text-[#7EB2E2]">
                        {vid.title}
                      </h3>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-2.5">{vid.author}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {/* Inline Video Player Modal */}
      {playingVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setPlayingVideo(null)}
        >
          <div
            className="w-full max-w-4xl rounded-2xl overflow-hidden bg-[#101424] border border-[#252E4A] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-[#252E4A] flex items-center justify-between text-white">
              <div>
                <h3 className="text-sm font-bold capitalize">{playingVideo.title}</h3>
                <p className="text-xs text-slate-400">
                  {playingVideo.author} · {playingVideo.duration}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPlayingVideo(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                aria-label="Close video player"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="aspect-video bg-black">
              {extractYouTubeId(playingVideo.youtubeUrl) ? (
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeId(playingVideo.youtubeUrl)}?autoplay=1`}
                  title={playingVideo.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 text-sm p-6">
                  Video preview unavailable for this link.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ========================================================================= */
/* 2. INDIVIDUAL ARTICLE DETAIL PAGE (/articles/<slug>)                      */
/* ========================================================================= */
export const PublicArticleDetailPage: React.FC<{
  slug: string;
  cmsArticles: CmsArticle[];
  onNavigate: (path: string) => void;
  onOpenDesk: (target?: { stageId?: string; solutionId?: string }) => void;
}> = ({ slug, cmsArticles, onNavigate, onOpenDesk }) => {
  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(path);
  };

  const article = useMemo(() => {
    const clean = slug.toLowerCase().trim();
    return (cmsArticles || []).find(
      (a) => slugifyArticleTitle(a.title) === clean || a.id.toLowerCase() === clean
    );
  }, [cmsArticles, slug]);

  const related = useMemo(() => {
    return (cmsArticles || [])
      .filter((a) => a.id !== article?.id)
      .slice(0, 3);
  }, [cmsArticles, article]);

  if (!article) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16 text-center space-y-4">
        <h1 className="text-3xl font-bold text-[#12172A] dark:text-white">Article not found</h1>
        <p className="text-slate-600 dark:text-slate-400">
          The article you requested could not be located. Browse our full collection below.
        </p>
        <a
          href="/articles"
          onClick={(e) => handleLink(e, '/articles')}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#2E5E88] text-white text-sm font-semibold"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Articles
        </a>
      </div>
    );
  }

  const hasSafeImage =
    article.imageUrl &&
    article.imageUrl.trim() !== '' &&
    !article.imageUrl.includes('images.unsplash.com');

  const bodyText =
    article.content && article.content.trim().length > 0
      ? article.content
      : `${article.summary}\n\nInside bizz-DESK, this topic connects directly to how business owners structure assumptions, verify margins, and review monthly financial outcomes against plan.`;

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <PublicBreadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Articles', href: '/articles' },
          { label: article.title },
        ]}
        onNavigate={onNavigate}
      />

      <a
        href="/articles"
        onClick={(e) => handleLink(e, '/articles')}
        className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-[#2E5E88] dark:text-[#7EB2E2] hover:underline mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Back to all articles
      </a>

      <header className="space-y-4 pb-8 border-b border-[#E6DFD2] dark:border-[#222B45]">
        <p className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373]">
          {article.category || 'Strategy'} · {article.readTime || '4 min read'} · By{' '}
          {article.author || 'the bizzbean channel'}
        </p>

        <h1
          className="text-3xl sm:text-5xl font-bold tracking-tight text-[#12172A] dark:text-white capitalize leading-tight"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          {article.title}
        </h1>

        {article.summary && (
          <p className="text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            {article.summary}
          </p>
        )}
      </header>

      {hasSafeImage && (
        <div className="my-8 rounded-2xl overflow-hidden border border-[#E0D7C8] dark:border-[#242E49] bg-white dark:bg-[#111626]">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full max-h-[540px] object-contain bg-[#FAF8F5] dark:bg-[#0D111C]"
          />
        </div>
      )}

      <div className="py-6 space-y-5 max-w-none">{renderMarkdownSections(bodyText)}</div>

      {/* Contextual Action Box */}
      <div className="mt-10 rounded-2xl border border-[#E0D7C8] dark:border-[#242E49] bg-[#F4EFE6] dark:bg-[#111626] p-7 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div>
          <p className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373]">
            Apply This Inside bizz-DESK
          </p>
          <h2
            className="text-xl font-bold text-[#12172A] dark:text-white mt-1"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Put these principles into your own numbers.
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Open bizz-DESK to test your pricing, build a 3-statement model, or run a What-If
            profit simulation.
          </p>
        </div>
        <button
          type="button"
          onClick={() => onOpenDesk({ stageId: 'fund-ability', solutionId: 'bizzmodel' })}
          className="px-5 py-2.5 rounded-lg bg-[#2E5E88] hover:bg-[#234C70] text-white text-sm font-semibold shrink-0 cursor-pointer"
        >
          Open bizz-DESK
        </button>
      </div>

      {/* Related Articles */}
      {related.length > 0 && (
        <div className="mt-14 pt-10 border-t border-[#E6DFD2] dark:border-[#222B45]">
          <div className="flex items-center justify-between mb-6">
            <h2
              className="text-2xl font-bold text-[#12172A] dark:text-white"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              Continue Reading
            </h2>
            <a
              href="/articles"
              onClick={(e) => handleLink(e, '/articles')}
              className="text-sm font-semibold text-[#2E5E88] dark:text-[#7EB2E2] hover:underline"
            >
              All articles →
            </a>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {related.map((rel) => {
              const relPath = `/articles/${slugifyArticleTitle(rel.title)}`;
              return (
                <a
                  key={rel.id}
                  href={relPath}
                  onClick={(e) => handleLink(e, relPath)}
                  className="rounded-xl border border-[#E6DFD2] dark:border-[#242E49] bg-white dark:bg-[#111626] p-5 hover:border-[#2E5E88] transition-colors"
                >
                  <p className="text-[11px] font-mono uppercase text-slate-500">
                    {rel.category || 'Strategy'} · {rel.readTime || '4 min read'}
                  </p>
                  <h3 className="text-base font-bold text-[#12172A] dark:text-white mt-2 capitalize">
                    {rel.title}
                  </h3>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </article>
  );
};

/* ========================================================================= */
/* 3. SANDBOX LIBRARY PAGE (/library)                                        */
/* ========================================================================= */
export const PublicLibraryPage: React.FC<{
  libraryItems: LibraryItem[];
  onNavigate: (path: string) => void;
  onDownloadBook: () => void;
  onOpenLibraryItem: (item: LibraryItem) => void;
  onOpenDesk: (target?: { stageId?: string; solutionId?: string }) => void;
}> = ({ libraryItems, onNavigate, onDownloadBook, onOpenLibraryItem, onOpenDesk }) => {
  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <PublicBreadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Sandbox Library' }]}
        onNavigate={onNavigate}
      />

      {/* Header + Getting to Value Spotlight */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-14 border-b border-[#E6DFD2] dark:border-[#222B45] items-center">
        <div className="lg:col-span-7 space-y-5">
          <p className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373]">
            Sandbox Library
          </p>
          <h1
            className="text-4xl sm:text-5xl font-bold tracking-tight text-[#12172A] dark:text-white"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Reference guides, checklists, and our foundational book.
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Explore curated entrepreneurship resources, download a free copy of{' '}
            <strong className="text-slate-900 dark:text-white">Getting to Value</strong>, or browse
            our articles and masterclass videos.
          </p>
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              type="button"
              onClick={onDownloadBook}
              className="px-6 py-3 rounded-lg bg-[#2E5E88] hover:bg-[#234C70] text-white text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <BookOpen className="h-4 w-4" />
              <span>Download Getting to Value (Free)</span>
            </button>
            <a
              href="/articles"
              onClick={(e) => handleLink(e, '/articles')}
              className="px-5 py-3 rounded-lg border border-[#D4C9B6] dark:border-[#2B3654] text-sm font-semibold text-slate-900 dark:text-white hover:bg-white dark:hover:bg-[#161D30]"
            >
              Read Articles
            </a>
            <a
              href="/videos"
              onClick={(e) => handleLink(e, '/videos')}
              className="px-5 py-3 rounded-lg border border-[#D4C9B6] dark:border-[#2B3654] text-sm font-semibold text-slate-900 dark:text-white hover:bg-white dark:hover:bg-[#161D30]"
            >
              Watch Videos
            </a>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-2xl overflow-hidden border border-[#E0D7C8] dark:border-[#242E49]">
            <img
              src={PUBLIC_SITE_IMAGES.sandboxLibrary}
              alt="bizzbean Sandbox Library desk and reference books"
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
        </div>
      </div>

      {/* Curated Library Shelf */}
      <div className="py-12">
        <div className="flex items-center justify-between mb-8">
          <h2
            className="text-2xl sm:text-3xl font-bold text-[#12172A] dark:text-white"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Curated Library Shelf
          </h2>
          <button
            type="button"
            onClick={() => onOpenDesk({ solutionId: 'sandbox-library' })}
            className="text-sm font-semibold text-[#2E5E88] dark:text-[#7EB2E2] hover:underline cursor-pointer"
          >
            Open inside bizz-DESK →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(libraryItems || []).map((item) => (
            <div
              key={item.id}
              className="rounded-xl border border-[#E6DFD2] dark:border-[#242E49] bg-white dark:bg-[#111626] p-6 flex flex-col justify-between"
            >
              <div>
                <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  {item.type} · {item.date || 'Reference'}
                </p>
                <h3
                  className="text-lg font-bold text-[#12172A] dark:text-white mt-2"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  {item.title}
                </h3>
                {item.contentSnippet && (
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    {item.contentSnippet}
                  </p>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-[#EDE7DC] dark:border-[#222B45]">
                <button
                  type="button"
                  onClick={() => onOpenLibraryItem(item)}
                  className="text-xs font-semibold text-[#2E5E88] dark:text-[#7EB2E2] hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  Inspect resource <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* 4. VIDEOS HUB (/videos)                                                   */
/* ========================================================================= */
export const PublicVideosPage: React.FC<{
  cmsVideos: CmsVideo[];
  articleCount: number;
  onNavigate: (path: string) => void;
}> = ({ cmsVideos, articleCount, onNavigate }) => {
  const [selectedVideo, setSelectedVideo] = useState<CmsVideo | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const categories = useMemo(() => {
    const set = new Set<string>();
    (cmsVideos || []).forEach((v) => {
      if (v.category) set.add(v.category.toLowerCase());
    });
    return ['all', ...Array.from(set)];
  }, [cmsVideos]);

  const filtered = useMemo(() => {
    return (cmsVideos || []).filter((v) => {
      if (selectedCategory !== 'all' && (v.category || '').toLowerCase() !== selectedCategory) {
        return false;
      }
      return true;
    });
  }, [cmsVideos, selectedCategory]);

  const activeYtId = selectedVideo ? extractYouTubeId(selectedVideo.youtubeUrl) : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <PublicBreadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Articles & Videos', href: '/articles' },
          { label: 'Videos' },
        ]}
        onNavigate={onNavigate}
      />

      <div className="max-w-3xl mb-8">
        <p className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373] mb-3">
          Articles & Videos
        </p>
        <h1
          className="text-4xl sm:text-5xl font-bold tracking-tight text-[#12172A] dark:text-white"
          style={{ fontFamily: "'Outfit', sans-serif" }}
        >
          Curated business and financial literacy videos.
        </h1>
        <p className="mt-4 text-base text-slate-600 dark:text-slate-400 leading-relaxed">
          Watch essential talks on capital allocation, value creation, pitching, and economic
          cycles selected for bizzbean founders.
        </p>
      </div>

      <ArticlesVideosTabs
        active="videos"
        articleCount={articleCount}
        videoCount={(cmsVideos || []).length}
        onNavigate={onNavigate}
      />

      <div className="flex flex-wrap items-center gap-2 pb-6 mb-8 border-b border-[#E6DFD2] dark:border-[#222B45]">
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono uppercase tracking-wider cursor-pointer transition-colors ${
              selectedCategory === cat
                ? 'bg-[#12172A] dark:bg-white text-white dark:text-slate-950 font-semibold'
                : 'bg-white dark:bg-[#111626] border border-[#E0D7C8] dark:border-[#242E49] text-slate-600 dark:text-slate-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.map((vid) => {
          const ytId = extractYouTubeId(vid.youtubeUrl);
          const thumb = ytId
            ? `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`
            : PUBLIC_SITE_IMAGES.sandboxLibrary;

          return (
            <button
              key={vid.id}
              type="button"
              onClick={() => setSelectedVideo(vid)}
              className="group text-left rounded-xl border border-[#E6DFD2] dark:border-[#242E49] bg-white dark:bg-[#111626] overflow-hidden hover:border-[#2E5E88] transition-colors flex flex-col cursor-pointer"
            >
              <div className="relative aspect-video w-full bg-[#12172A] overflow-hidden">
                <img
                  src={thumb}
                  alt={vid.title}
                  className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-black/25 group-hover:bg-black/15 transition-colors flex items-center justify-center">
                  <span className="h-12 w-12 rounded-full bg-[#12172A]/85 text-white flex items-center justify-center shadow-lg">
                    <Play className="h-5 w-5 fill-white ml-0.5" />
                  </span>
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    {vid.category || 'Masterclass'} · {vid.duration || 'Video'}
                  </p>
                  <h2 className="text-base font-bold text-[#12172A] dark:text-white mt-2 capitalize group-hover:text-[#2E5E88] dark:group-hover:text-[#7EB2E2]">
                    {vid.title}
                  </h2>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-3">{vid.author}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Inline Video Player Modal */}
      {selectedVideo && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedVideo(null)}
        >
          <div
            className="w-full max-w-4xl rounded-2xl overflow-hidden bg-[#101424] border border-[#252E4A] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-3.5 border-b border-[#252E4A] flex items-center justify-between text-white">
              <div>
                <h3 className="text-sm font-bold capitalize">{selectedVideo.title}</h3>
                <p className="text-xs text-slate-400">
                  {selectedVideo.author} · {selectedVideo.duration}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedVideo(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white cursor-pointer"
                aria-label="Close video player"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="aspect-video bg-black">
              {activeYtId ? (
                <iframe
                  src={`https://www.youtube.com/embed/${activeYtId}?autoplay=1`}
                  title={selectedVideo.title}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-300 text-sm p-6">
                  Video preview unavailable for this link.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ========================================================================= */
/* 5. ABOUT PAGE (/about)                                                    */
/* ========================================================================= */
export const PublicAboutPage: React.FC<{
  onNavigate: (path: string) => void;
  onOpenDesk: () => void;
  onDownloadBook: () => void;
}> = ({ onNavigate, onOpenDesk, onDownloadBook }) => {
  const handleLink = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    onNavigate(path);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <PublicBreadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'About bizzbean' }]}
        onNavigate={onNavigate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 pb-14 border-b border-[#E6DFD2] dark:border-[#222B45] items-center">
        <div className="lg:col-span-7 space-y-5">
          <p className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373]">
            About bizzbean
          </p>
          <h1
            className="text-4xl sm:text-5xl font-bold tracking-tight text-[#12172A] dark:text-white leading-tight"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Built by entrepreneurs to turn business ambition into financial proof.
          </h1>
          <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
            Founded by <strong className="text-slate-900 dark:text-white">Quentin G. McCullough</strong>,
            bizzbean distills decades of practical business management, turnaround work, and
            3-statement financial modelling into clear software and plain-English education.
          </p>
          <div className="flex flex-wrap items-center gap-3.5 pt-2">
            <button
              type="button"
              onClick={onOpenDesk}
              className="px-6 py-3 rounded-lg bg-[#2E5E88] hover:bg-[#234C70] text-white text-sm font-semibold cursor-pointer"
            >
              Open bizz-DESK
            </button>
            <button
              type="button"
              onClick={onDownloadBook}
              className="px-6 py-3 rounded-lg border border-[#D4C9B6] dark:border-[#2B3654] text-sm font-semibold text-slate-900 dark:text-white hover:bg-white dark:hover:bg-[#161D30] cursor-pointer"
            >
              Download Getting to Value
            </button>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="rounded-2xl overflow-hidden border border-[#E0D7C8] dark:border-[#242E49]">
            <img
              src={PUBLIC_SITE_IMAGES.founderStrategy}
              alt="Founders collaborating on financial strategy and planning"
              className="w-full aspect-[4/3] object-cover"
            />
          </div>
        </div>
      </div>

      {/* Four Pillar Editorial Blocks */}
      <div className="py-14 grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { label: '01 · Who We Are', content: DEFAULT_WHO_ARE_WE },
          { label: '02 · What We Do', content: DEFAULT_WHAT_WE_DO },
          { label: '03 · How Solutions Enable Growth', content: DEFAULT_HOW_SOLUTIONS_ENABLE_GROWTH },
          { label: '04 · Where We Are Going', content: DEFAULT_WHERE_ARE_WE_GOING },
        ].map((block) => (
          <section
            key={block.label}
            className="rounded-xl border border-[#E6DFD2] dark:border-[#242E49] bg-white dark:bg-[#111626] p-7 space-y-3"
          >
            <p className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373]">
              {block.label}
            </p>
            <div className="space-y-3">{renderMarkdownSections(block.content)}</div>
          </section>
        ))}
      </div>

      <div className="pt-8 border-t border-[#E6DFD2] dark:border-[#222B45] flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Have questions about enterprise onboarding, workshops, or university programmes?
        </p>
        <a
          href="/contact"
          onClick={(e) => handleLink(e, '/contact')}
          className="text-sm font-semibold text-[#2E5E88] dark:text-[#7EB2E2] hover:underline inline-flex items-center gap-1.5"
        >
          Contact our team <ArrowRight className="h-4 w-4" />
        </a>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* 6. CONTACT PAGE (/contact)                                                */
/* ========================================================================= */
export const PublicContactPage: React.FC<{
  onNavigate: (path: string) => void;
  onOpenDesk: () => void;
  onOpenTalkToUs: () => void;
}> = ({ onNavigate, onOpenDesk, onOpenTalkToUs }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [topic, setTopic] = useState('Choosing the right stage or software');
  const [message, setMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !email.includes('@') || !message.trim()) {
      setError('Please complete your name, a valid email address, and your message.');
      return;
    }
    setError(null);
    try {
      const existing = JSON.parse(localStorage.getItem('bizzbean_public_enquiries_v1') || '[]');
      existing.unshift({
        id: `enq-${Date.now()}`,
        senderName: name.trim(),
        senderEmail: email.trim(),
        subject: topic,
        message: message.trim(),
        date: new Date().toISOString(),
        status: 'new',
      });
      localStorage.setItem('bizzbean_public_enquiries_v1', JSON.stringify(existing.slice(0, 50)));
    } catch {}
    setSubmitted(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <PublicBreadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Contact' }]}
        onNavigate={onNavigate}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        <div className="lg:col-span-5 space-y-6">
          <p className="text-xs font-mono uppercase tracking-widest text-[#9A7B4F] dark:text-[#D4A373]">
            Contact bizzbean
          </p>
          <h1
            className="text-4xl font-bold tracking-tight text-[#12172A] dark:text-white"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            Talk to our team.
          </h1>
          <p className="text-base text-slate-600 dark:text-slate-400 leading-relaxed">
            Whether you are choosing between bizzcalc and bizzmodel, requesting a new industry
            model-set, or enquiring about enterprise workshops, send us a direct note.
          </p>

          <div className="space-y-4 pt-2 text-sm text-slate-700 dark:text-slate-300">
            <div className="flex items-start gap-3">
              <Mail className="h-4 w-4 text-[#2E5E88] mt-1 shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Direct Email</p>
                <a
                  href="mailto:thebizzbeanchannel@bizzbean.com"
                  className="text-[#2E5E88] dark:text-[#7EB2E2] hover:underline"
                >
                  thebizzbeanchannel@bizzbean.com
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Shield className="h-4 w-4 text-[#2E5E88] mt-1 shrink-0" />
              <div>
                <p className="font-semibold text-slate-900 dark:text-white">Existing Members</p>
                <p className="text-slate-600 dark:text-slate-400 mt-0.5">
                  Already have a SANDBOX account? Open the member Talk-to-Us channel inside
                  bizz-DESK.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onOpenDesk();
                    onOpenTalkToUs();
                  }}
                  className="mt-2 text-xs font-semibold text-[#2E5E88] dark:text-[#7EB2E2] hover:underline cursor-pointer"
                >
                  Open Member Talk-to-Us →
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-2xl border border-[#E0D7C8] dark:border-[#242E49] bg-white dark:bg-[#111626] p-7 sm:p-9">
            {submitted ? (
              <div className="py-8 text-center space-y-4">
                <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
                <h2
                  className="text-2xl font-bold text-[#12172A] dark:text-white"
                  style={{ fontFamily: "'Outfit', sans-serif" }}
                >
                  Message received
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                  Thank you, {name}. Your enquiry has been recorded and our team will respond to{' '}
                  <strong className="text-slate-900 dark:text-white">{email}</strong> shortly.
                </p>
                <div className="pt-2 flex flex-wrap justify-center gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setSubmitted(false);
                      setName('');
                      setEmail('');
                      setMessage('');
                    }}
                    className="px-4 py-2 rounded-lg border border-[#D4C9B6] dark:border-[#2B3654] text-xs font-semibold cursor-pointer"
                  >
                    Send another message
                  </button>
                  <button
                    type="button"
                    onClick={onOpenDesk}
                    className="px-4 py-2 rounded-lg bg-[#2E5E88] text-white text-xs font-semibold cursor-pointer"
                  >
                    Open bizz-DESK
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="contact-name"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Your Name
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Thabo Mokoena"
                      required
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#DFD7C8] dark:border-[#242E49] bg-[#FAF8F5] dark:bg-[#0D111C] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2E5E88]/40"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="contact-email"
                      className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                    >
                      Email Address
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      required
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#DFD7C8] dark:border-[#242E49] bg-[#FAF8F5] dark:bg-[#0D111C] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2E5E88]/40"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="contact-topic"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    How can we help?
                  </label>
                  <select
                    id="contact-topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DFD7C8] dark:border-[#242E49] bg-[#FAF8F5] dark:bg-[#0D111C] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2E5E88]/40"
                  >
                    <option>Choosing the right stage or software</option>
                    <option>bizzmodel / 5-Year financial modelling</option>
                    <option>bizzoptimizer / Profit & cash improvement</option>
                    <option>Requesting an industry model-set or course</option>
                    <option>University, incubator, or advisory partnership</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="contact-message"
                    className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5"
                  >
                    Message
                  </label>
                  <textarea
                    id="contact-message"
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us briefly about your business and what you want to model or achieve..."
                    required
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#DFD7C8] dark:border-[#242E49] bg-[#FAF8F5] dark:bg-[#0D111C] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#2E5E88]/40"
                  />
                </div>

                {error && (
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">{error}</p>
                )}

                <button
                  type="submit"
                  className="px-6 py-3 rounded-lg bg-[#2E5E88] hover:bg-[#234C70] text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  Send Enquiry
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ========================================================================= */
/* 7. POLICIES & LEGAL PAGE (/website-footer)                                */
/* ========================================================================= */
export const PublicPoliciesPage: React.FC<{
  onNavigate: (path: string) => void;
}> = ({ onNavigate }) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
      <PublicBreadcrumb
        items={[{ label: 'Home', href: '/' }, { label: 'Policies & Legal' }]}
        onNavigate={onNavigate}
      />

      <h1
        className="text-4xl font-bold tracking-tight text-[#12172A] dark:text-white mb-4"
        style={{ fontFamily: "'Outfit', sans-serif" }}
      >
        Policies, Privacy & Governance
      </h1>
      <p className="text-base text-slate-600 dark:text-slate-400 mb-10">
        Transparency on how bizzbean protects founder data, handles transactions, and governs
        platform tokens.
      </p>

      <div className="space-y-6">
        {[
          {
            title: 'POPIA & GDPR Data Protection',
            body: 'Your business assumptions, financial projections, and profile details belong strictly to you. bizzbean collects only the minimum information required to operate your SANDBOX account, issue invoices, and sync your saved models securely.',
          },
          {
            title: 'BizzToken Utility Charter',
            body: 'bizz-tokens are closed-loop utility credits allocated with software licences and top-ups inside bizz-DESK. They are non-speculative platform usage credits and do not represent financial securities or equity.',
          },
          {
            title: 'Terms of Use & Educational Disclaimer',
            body: 'bizzbean software and courses are built to support sound financial modelling, costing, and business planning. Founders remain responsible for verifying assumptions and obtaining statutory accounting, tax, or legal advice where required.',
          },
        ].map((sec) => (
          <section
            key={sec.title}
            className="rounded-xl border border-[#E6DFD2] dark:border-[#242E49] bg-white dark:bg-[#111626] p-7"
          >
            <h2
              className="text-xl font-bold text-[#12172A] dark:text-white mb-2"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              {sec.title}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              {sec.body}
            </p>
          </section>
        ))}
      </div>
    </div>
  );
};
