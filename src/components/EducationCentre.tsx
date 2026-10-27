import React, { useState, useMemo } from 'react';
import {
  Video,
  BookOpen,
  GraduationCap,
  Play,
  ArrowRight,
  ExternalLink,
  Edit2,
  Check,
  X,
  Search,
  Filter,
  RefreshCw,
  Plus,
  Trash2,
  ChevronRight,
  Clock,
  Sparkles,
  Layers,
  HelpCircle,
  Database,
  Share2,
  Link2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { CmsVideo, CmsArticle, CmsProduct } from '../data/cmsConsoleData';
import { BizzbeanLogoIcon } from './BizzbeanLogoIcon';
import { findMasterCurriculum, isBogusLessonUrl, getDeletedVideoIds, getDeletedArticleIds } from '../utils/imageStorage';

interface EducationCentreProps {
  theme: 'light' | 'dark';
  cmsVideos: CmsVideo[];
  cmsArticles: CmsArticle[];
  cmsProducts?: CmsProduct[];
  initialTab?: 'videos' | 'articles' | 'courses';
  onSyncVideosToWebsite?: (videos: CmsVideo[]) => void;
  onSyncArticlesToWebsite?: (articles: CmsArticle[]) => void;
  onSyncProductsToWebsite?: (products: CmsProduct[]) => void;
  onSelectVideoById?: (id: string) => void;
  onSelectArticleById?: (id: string) => void;
  onBackToWorkstation: () => void;
  onOpenStandaloneCmsModal?: () => void;
}

export const EducationCentre: React.FC<EducationCentreProps> = ({
  theme,
  cmsVideos,
  cmsArticles,
  cmsProducts = [],
  initialTab = 'videos',
  onSyncVideosToWebsite,
  onSyncArticlesToWebsite,
  onSyncProductsToWebsite,
  onSelectVideoById,
  onSelectArticleById,
  onBackToWorkstation,
  onOpenStandaloneCmsModal,
}) => {
  const isDark = theme === 'dark';

  // Navigation tab: 'videos' | 'articles' | 'courses'
  const [activeTab, setActiveTab] = useState<'videos' | 'articles' | 'courses'>(initialTab);

  // Synchronize when initialTab prop changes
  React.useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // Active video selected for playback or link editing
  const [activeVideoId, setActiveVideoId] = useState<string>(() => {
    return cmsVideos[0]?.id || '';
  });

  // Active article selected for reading
  const [activeArticleId, setActiveArticleId] = useState<string>(() => {
    return cmsArticles[0]?.id || '';
  });

  // Inline editing state for video link
  const [editingVideoId, setEditingVideoId] = useState<string | null>(null);
  const [editingVideoUrl, setEditingVideoUrl] = useState<string>('');

  // Inline editing state for course lesson
  const [editingLesson, setEditingLesson] = useState<{
    productId: string;
    lessonId: string;
    url: string;
  } | null>(null);

  // Notification banner
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3500);
  };

  // Filtered videos
  const filteredVideos = useMemo(() => {
    const deleted = getDeletedVideoIds();
    return (cmsVideos || []).filter((v) => {
      if (!v || !v.id || deleted.has(v.id)) return false;
      const matchesSearch =
        searchQuery === '' ||
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.category.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCat =
        categoryFilter === 'all' || v.category.toLowerCase() === categoryFilter.toLowerCase();
      return matchesSearch && matchesCat;
    });
  }, [cmsVideos, searchQuery, categoryFilter]);

  // Filtered articles
  const filteredArticles = useMemo(() => {
    const deleted = getDeletedArticleIds();
    return (cmsArticles || [])
      .filter((a) => {
        if (!a || !a.id || deleted.has(a.id)) return false;
        const matchesSearch =
          searchQuery === '' ||
          a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
          a.summary.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCat =
          categoryFilter === 'all' || a.category.toLowerCase() === categoryFilter.toLowerCase();
        return matchesSearch && matchesCat;
      })
      .sort((a, b) => (a.seq || 0) - (b.seq || 0));
  }, [cmsArticles, searchQuery, categoryFilter]);

  // Filtered course products
  const courseProducts = useMemo(() => {
    return cmsProducts.filter((p) => p.type === 'course' || (p.courseLessons && p.courseLessons.length > 0));
  }, [cmsProducts]);

  // Current active video object
  const currentVideo = useMemo(() => {
    return cmsVideos.find((v) => v.id === activeVideoId) || cmsVideos[0];
  }, [cmsVideos, activeVideoId]);

  // Current active article object
  const currentArticle = useMemo(() => {
    return cmsArticles.find((a) => a.id === activeArticleId) || cmsArticles[0];
  }, [cmsArticles, activeArticleId]);

  // Helper to extract or format YouTube embed URL
  const formatYoutubeEmbed = (url?: string): string => {
    if (!url || !url.trim()) return '';
    const raw = url.trim();
    let videoId = '';
    const embedMatch = raw.match(/embed\/([a-zA-Z0-9_-]+)/);
    if (embedMatch && embedMatch[1]) {
      videoId = embedMatch[1];
    } else {
      const watchMatch = raw.match(/[?&]v=([a-zA-Z0-9_-]+)/);
      if (watchMatch && watchMatch[1]) {
        videoId = watchMatch[1];
      } else {
        const shortMatch = raw.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
        if (shortMatch && shortMatch[1]) {
          videoId = shortMatch[1];
        } else if (/^[a-zA-Z0-9_-]{10,12}$/.test(raw)) {
          videoId = raw;
        }
      }
    }
    if (videoId) {
      return `https://www.youtube-nocookie.com/embed/${videoId}?rel=0&modestbranding=1&playsinline=1`;
    }
    return raw;
  };

  // Save updated video link
  const handleSaveVideoUrl = (id: string, newUrl: string) => {
    const updated = cmsVideos.map((v) => (v.id === id ? { ...v, youtubeUrl: newUrl.trim(), linked: Boolean(newUrl.trim()) } : v));
    if (onSyncVideosToWebsite) onSyncVideosToWebsite(updated);
    setEditingVideoId(null);
    setEditingVideoUrl('');
    showNotification(`video link updated for "${updated.find((v) => v.id === id)?.title}"`);
  };

  // Clear single video link
  const handleClearVideoUrl = (id: string) => {
    const updated = cmsVideos.map((v) => (v.id === id ? { ...v, youtubeUrl: '', linked: false } : v));
    if (onSyncVideosToWebsite) onSyncVideosToWebsite(updated);
    showNotification(`stream link cleared.`);
  };

  // Clear all video stream links
  const handleClearAllVideoLinks = () => {
    if (!window.confirm('Clear all video stream links across the Education Centre?')) return;
    const updated = cmsVideos.map((v) => ({ ...v, youtubeUrl: '', linked: false }));
    if (onSyncVideosToWebsite) onSyncVideosToWebsite(updated);
    showNotification('all video stream links have been cleared.');
  };

  // Clear all course lesson stream links
  const handleClearAllCourseLinks = () => {
    if (!window.confirm('Clear all lesson video links across venture course tracks?')) return;
    const updatedProducts = cmsProducts.map((p) => {
      if (p.courseLessons && p.courseLessons.length > 0) {
        return {
          ...p,
          youtubeDemoUrl: '',
          coursePromoVideoUrl: '',
          courseLessons: p.courseLessons.map((l) => ({ ...l, youtubeUrl: '' })),
        };
      }
      return {
        ...p,
        youtubeDemoUrl: '',
        coursePromoVideoUrl: '',
      };
    });
    if (onSyncProductsToWebsite) onSyncProductsToWebsite(updatedProducts);
    showNotification('all course lesson stream links have been cleared.');
  };

  // Master Clear: clears all video and course links across Education Centre
  const handleClearAllLinks = () => {
    if (!window.confirm('Clear all video and lesson stream links across the entire Education Centre?')) return;
    const updatedVideos = cmsVideos.map((v) => ({ ...v, youtubeUrl: '', linked: false }));
    if (onSyncVideosToWebsite) onSyncVideosToWebsite(updatedVideos);

    const updatedProducts = cmsProducts.map((p) => {
      if (p.courseLessons && p.courseLessons.length > 0) {
        return {
          ...p,
          youtubeDemoUrl: '',
          coursePromoVideoUrl: '',
          courseLessons: p.courseLessons.map((l) => ({ ...l, youtubeUrl: '' })),
        };
      }
      return {
        ...p,
        youtubeDemoUrl: '',
        coursePromoVideoUrl: '',
      };
    });
    if (onSyncProductsToWebsite) onSyncProductsToWebsite(updatedProducts);

    showNotification('all links across video masterclasses and courses have been cleared.');
  };

  // Save updated lesson URL in courses
  const handleSaveLessonUrl = (productId: string, lessonId: string, url: string) => {
    const updated = cmsProducts.map((p) => {
      if (p.id === productId && p.courseLessons) {
        return {
          ...p,
          courseLessons: p.courseLessons.map((l) =>
            l.id === lessonId ? { ...l, youtubeUrl: url.trim() } : l
          ),
        };
      }
      return p;
    });
    if (onSyncProductsToWebsite) onSyncProductsToWebsite(updated);
    setEditingLesson(null);
    showNotification('course lesson stream link updated.');
  };

  // Clear single lesson link in courses
  const handleClearLessonUrl = (productId: string, lessonId: string) => {
    const updated = cmsProducts.map((p) => {
      if (p.id === productId && p.courseLessons) {
        return {
          ...p,
          courseLessons: p.courseLessons.map((l) =>
            l.id === lessonId ? { ...l, youtubeUrl: '' } : l
          ),
        };
      }
      return p;
    });
    if (onSyncProductsToWebsite) onSyncProductsToWebsite(updated);
    showNotification('lesson stream link cleared.');
  };

  return (
    <div
      className={`h-full w-full flex flex-col overflow-hidden transition-colors ${
        isDark ? 'bg-[#0A0D14] text-[#E2E8F0]' : 'bg-[#FAF8F5] text-slate-800'
      }`}
    >
      {/* ========================================================================= */}
      {/* HEADER: Title in Raleway, Navigation Tabs, and Quick Actions              */}
      {/* ========================================================================= */}
      <header
        className={`px-4 sm:px-8 py-4 border-b flex flex-wrap items-center justify-between gap-4 shrink-0 ${
          isDark ? 'bg-[#0E1322] border-[#1D2644]' : 'bg-white border-[#E8E2D8] shadow-xs'
        }`}
      >
        <div className="flex items-center gap-3.5">
          <BizzbeanLogoIcon className="h-8 w-8 sm:h-9 sm:w-9" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-['Raleway'] text-lg sm:text-2xl font-bold tracking-tight lowercase">
                education centre
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-mono uppercase tracking-wider bg-[#5584B4]/15 text-[#5584B4] dark:bg-[#5584B4]/25 dark:text-[#DDEBF7] font-semibold">
                v2 centre
              </span>
            </div>
            <p className="text-xs font-['DM_Sans'] text-slate-500 dark:text-slate-400 mt-0.5">
              curated executive masterclasses, inverted-pyramid analytical memos & venture course tracks.
            </p>
          </div>
        </div>

        {/* Top Action Controls */}
        <div className="flex items-center gap-2">
          {notification && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-mono animate-in fade-in">
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>{notification}</span>
            </div>
          )}

          {/* Master Clear All Links Button */}
          <button
            type="button"
            onClick={handleClearAllLinks}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-300/80 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-['Raleway'] font-medium transition-colors lowercase"
            title="Clear all video and lesson links across Education Centre"
          >
            <Trash2 className="h-3.5 w-3.5 text-rose-500" />
            <span className="hidden sm:inline">clear all links</span>
          </button>

          {onOpenStandaloneCmsModal && (
            <button
              type="button"
              onClick={onOpenStandaloneCmsModal}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#D8CEBC] dark:border-[#252E4A] hover:bg-[#F4EFE6] dark:hover:bg-[#1A2238] text-xs font-['Raleway'] font-medium transition-colors lowercase"
              title="Open full CMS Matrix"
            >
              <Database className="h-3.5 w-3.5 text-[#5584B4]" />
              <span className="hidden sm:inline">cms console</span>
            </button>
          )}

          <button
            type="button"
            onClick={onBackToWorkstation}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#12172A] hover:bg-[#1E2548] text-white text-xs font-['Raleway'] font-semibold shadow-xs transition-colors lowercase"
          >
            <span>back to workstation</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* SUB-HEADER: TABS (Raleway) & FILTER BAR                                  */}
      {/* ========================================================================= */}
      <div
        className={`px-4 sm:px-8 py-2.5 border-b flex flex-wrap items-center justify-between gap-3 shrink-0 ${
          isDark ? 'bg-[#10162A]/90 border-[#1D2644]' : 'bg-[#FAF8F5] border-[#E8E2D8]'
        }`}
      >
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              setActiveTab('videos');
              setCategoryFilter('all');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-['Raleway'] transition-all lowercase ${
              activeTab === 'videos'
                ? isDark
                  ? 'bg-[#1E2745] text-white font-bold border border-[#5584B4] shadow-xs'
                  : 'bg-[#12172A] text-white font-bold shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-[#161D33]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-[#EAE3D4]'
            }`}
          >
            <Video className="h-3.5 w-3.5 text-[#5584B4]" />
            <span>video masterclasses</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-white/10">
              {cmsVideos.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('articles');
              setCategoryFilter('all');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-['Raleway'] transition-all lowercase ${
              activeTab === 'articles'
                ? isDark
                  ? 'bg-[#1E2745] text-white font-bold border border-[#5584B4] shadow-xs'
                  : 'bg-[#12172A] text-white font-bold shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-[#161D33]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-[#EAE3D4]'
            }`}
          >
            <BookOpen className="h-3.5 w-3.5 text-[#8EC027]" />
            <span>articles & analysis</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-white/10">
              {cmsArticles.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('courses');
              setCategoryFilter('all');
            }}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-['Raleway'] transition-all lowercase ${
              activeTab === 'courses'
                ? isDark
                  ? 'bg-[#1E2745] text-white font-bold border border-[#5584B4] shadow-xs'
                  : 'bg-[#12172A] text-white font-bold shadow-xs'
                : isDark
                ? 'text-slate-400 hover:text-white hover:bg-[#161D33]'
                : 'text-slate-600 hover:text-slate-900 hover:bg-[#EAE3D4]'
            }`}
          >
            <GraduationCap className="h-3.5 w-3.5 text-[#9A7B4F] dark:text-[#D4A373]" />
            <span>venture course tracks</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-full font-mono bg-white/10">
              {courseProducts.length}
            </span>
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="filter by title, author..."
              className={`pl-8 pr-3 py-1.5 rounded-xl text-xs font-mono transition-colors focus:outline-none border ${
                isDark
                  ? 'bg-[#141A2E] border-[#252E4A] text-white placeholder-slate-500 focus:border-[#5584B4]'
                  : 'bg-white border-[#D8CEBC] text-slate-800 placeholder-slate-400 focus:border-[#5584B4]'
              }`}
            />
          </div>

          {activeTab === 'videos' && (
            <button
              type="button"
              onClick={handleClearAllVideoLinks}
              className="px-2.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-['Raleway'] lowercase transition-colors"
              title="Clear all video links to reset"
            >
              clear all video links
            </button>
          )}

          {activeTab === 'courses' && (
            <button
              type="button"
              onClick={handleClearAllCourseLinks}
              className="px-2.5 py-1.5 rounded-xl border border-rose-300 dark:border-rose-900/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400 text-xs font-['Raleway'] lowercase transition-colors"
              title="Clear all lesson links across course tracks"
            >
              clear all lesson links
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* BODY CONTENT: TAB 1 (VIDEOS) / TAB 2 (ARTICLES) / TAB 3 (COURSES)        */}
      {/* ========================================================================= */}
      <div className="flex-grow overflow-y-auto p-4 sm:p-8">
        {/* TAB 1: VIDEO MASTERCLASSES */}
        {activeTab === 'videos' && (
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Featured Video Theater Section */}
            {currentVideo && (
              <div
                className={`rounded-3xl border overflow-hidden p-5 sm:p-6 shadow-xs ${
                  isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                }`}
              >
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left: Video Screen Player or Link Input Banner */}
                  <div className="lg:col-span-7">
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden bg-black/90 border border-[#5584B4]/40 shadow-xl flex items-center justify-center">
                      {currentVideo.youtubeUrl && currentVideo.youtubeUrl.trim() !== '' ? (
                        <iframe
                          src={formatYoutubeEmbed(currentVideo.youtubeUrl)}
                          title={currentVideo.title}
                          className="w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      ) : (
                        /* Studio Link Pending Banner with Inline Updater */
                        <div className="p-6 text-center max-w-md space-y-3">
                          <div className="h-12 w-12 rounded-2xl bg-[#5584B4]/20 border border-[#5584B4]/40 text-[#5584B4] flex items-center justify-center mx-auto">
                            <Video className="h-6 w-6" />
                          </div>
                          <div>
                            <span className="text-[10px] font-mono tracking-wider uppercase px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 font-semibold">
                              Stream Link Pending Update
                            </span>
                            <h3 className="font-['Raleway'] text-lg font-bold text-white mt-1 lowercase">
                              {currentVideo.title}
                            </h3>
                            <p className="text-xs text-slate-400 font-['DM_Sans'] mt-0.5">
                              all links have been cleared. paste your youtube or vimeo link below to stream this masterclass.
                            </p>
                          </div>

                          {/* Inline Link Entry */}
                          <div className="flex items-center gap-2 pt-2">
                            <input
                              type="text"
                              value={editingVideoId === currentVideo.id ? editingVideoUrl : ''}
                              onChange={(e) => {
                                setEditingVideoId(currentVideo.id);
                                setEditingVideoUrl(e.target.value);
                              }}
                              placeholder="https://www.youtube.com/watch?v=..."
                              className="flex-grow px-3 py-2 rounded-xl text-xs font-mono bg-[#0A0D14] border border-[#252E4A] text-white placeholder-slate-500 focus:border-[#5584B4] focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => {
                                if (editingVideoUrl.trim()) {
                                  handleSaveVideoUrl(currentVideo.id, editingVideoUrl);
                                }
                              }}
                              disabled={!editingVideoUrl.trim()}
                              className="px-3.5 py-2 rounded-xl bg-[#5584B4] hover:bg-[#4773A0] disabled:opacity-40 text-white text-xs font-['Raleway'] font-bold lowercase transition-colors"
                            >
                              save
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right: Masterclass Information & Meta */}
                  <div className="lg:col-span-5 space-y-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 lowercase mb-1">
                        <span className="px-2 py-0.5 rounded bg-[#FAF8F5] dark:bg-[#0E1322] border border-[#D8CEBC] dark:border-[#252E4A]">
                          {currentVideo.duration}
                        </span>
                        <span>·</span>
                        <span className="px-2 py-0.5 rounded bg-[#5584B4]/10 text-[#5584B4] font-semibold">
                          {currentVideo.category}
                        </span>
                      </div>
                      <h2 className="font-['Raleway'] text-xl sm:text-2xl font-bold tracking-tight lowercase">
                        {currentVideo.title}
                      </h2>
                      <div className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-1 lowercase">
                        instructor / presenter: <strong className="font-bold">{currentVideo.author}</strong>
                      </div>
                    </div>

                    {/* Stream Link Editor Card */}
                    <div
                      className={`p-4 rounded-2xl border space-y-2.5 ${
                        isDark ? 'bg-[#0E1322] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#E8E2D8]'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-['Raleway'] font-semibold lowercase">
                        <span className="flex items-center gap-1.5">
                          <Link2 className="h-3.5 w-3.5 text-[#5584B4]" />
                          <span>stream link status</span>
                        </span>
                        {currentVideo.youtubeUrl && currentVideo.youtubeUrl.trim() !== '' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold">
                            active link
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            cleared (pending)
                          </span>
                        )}
                      </div>

                      {editingVideoId === currentVideo.id ? (
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={editingVideoUrl}
                            onChange={(e) => setEditingVideoUrl(e.target.value)}
                            placeholder="paste youtube or vimeo link..."
                            className={`w-full px-3 py-2 rounded-xl text-xs font-mono border focus:outline-none ${
                              isDark
                                ? 'bg-[#141A2E] border-[#5584B4] text-white'
                                : 'bg-white border-[#5584B4] text-slate-900'
                            }`}
                          />
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => handleSaveVideoUrl(currentVideo.id, editingVideoUrl)}
                              className="px-3 py-1.5 rounded-lg bg-[#5584B4] text-white text-xs font-['Raleway'] font-bold lowercase hover:bg-[#4773A0]"
                            >
                              save link
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingVideoId(null);
                                setEditingVideoUrl('');
                              }}
                              className="px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-['Raleway'] lowercase"
                            >
                              cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-mono text-slate-500 truncate max-w-[200px]">
                            {currentVideo.youtubeUrl || '(no link attached)'}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                setEditingVideoId(currentVideo.id);
                                setEditingVideoUrl(currentVideo.youtubeUrl || '');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1E2548] border border-[#D8CEBC] dark:border-[#252E4A] hover:border-[#5584B4] text-xs font-['Raleway'] font-medium transition-colors lowercase flex items-center gap-1"
                            >
                              <Edit2 className="h-3 w-3 text-[#5584B4]" />
                              <span>edit link</span>
                            </button>
                            {currentVideo.youtubeUrl && (
                              <button
                                type="button"
                                onClick={() => handleClearVideoUrl(currentVideo.id)}
                                className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-500 transition-colors"
                                title="Clear link"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Video Masterclasses Playlist Grid */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-['Raleway'] text-base font-bold lowercase">
                  all video masterclasses ({filteredVideos.length})
                </h3>
                <span className="text-xs font-mono text-slate-500 lowercase">
                  click to stream or update link
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredVideos.map((vid, idx) => {
                  const isSelected = vid.id === currentVideo?.id;
                  const hasLink = Boolean(vid.youtubeUrl && vid.youtubeUrl.trim() !== '');

                  return (
                    <div
                      key={vid.id}
                      onClick={() => setActiveVideoId(vid.id)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        isSelected
                          ? isDark
                            ? 'bg-[#182038] border-[#5584B4] shadow-md ring-1 ring-[#5584B4]'
                            : 'bg-white border-[#5584B4] shadow-md ring-1 ring-[#5584B4]'
                          : isDark
                          ? 'bg-[#141A2E] border-[#252E4A] hover:border-[#5584B4]/50'
                          : 'bg-white border-[#D8CEBC] hover:border-[#5584B4]/50'
                      }`}
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-xs font-mono">
                          <span className="text-slate-400">#{idx + 1}</span>
                          <div className="flex items-center gap-1.5">
                            {hasLink ? (
                              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold">
                                linked
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                                link cleared
                              </span>
                            )}
                            <span className="text-slate-500">{vid.duration}</span>
                          </div>
                        </div>

                        <h4 className="font-['Raleway'] text-sm font-bold lowercase line-clamp-2">
                          {vid.title}
                        </h4>

                        <div className="text-xs font-mono text-slate-500 dark:text-slate-400 lowercase">
                          instructor: {vid.author}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-[#E8E2D8] dark:border-[#252E4A] flex items-center justify-between text-xs font-['Raleway']">
                        <span className="text-[#5584B4] font-medium lowercase">
                          {isSelected ? 'currently playing' : 'play / view'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveVideoId(vid.id);
                              setEditingVideoId(vid.id);
                              setEditingVideoUrl(vid.youtubeUrl || '');
                            }}
                            className="px-2 py-1 rounded bg-[#FAF8F5] dark:bg-[#0E1322] border border-[#D8CEBC] dark:border-[#252E4A] hover:border-[#5584B4] text-[11px] font-['Raleway'] lowercase flex items-center gap-1"
                          >
                            <Edit2 className="h-3 w-3 text-[#5584B4]" />
                            <span>edit link</span>
                          </button>
                          {hasLink && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClearVideoUrl(vid.id);
                              }}
                              className="p-1 rounded hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-500 transition-colors"
                              title="Clear video link"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: ARTICLES & ANALYSIS */}
        {activeTab === 'articles' && (
          <div className="max-w-7xl mx-auto space-y-6">
            {currentArticle && (
              <div
                className={`rounded-3xl border overflow-hidden p-6 sm:p-8 shadow-xs ${
                  isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                }`}
              >
                {/* Article Cover Image Banner */}
                {currentArticle.imageUrl && (
                  <div className="relative w-full h-56 sm:h-80 rounded-2xl overflow-hidden mb-6 bg-black/40 border border-[#E8E2D8] dark:border-[#252E4A]">
                    <img
                      src={currentArticle.imageUrl}
                      alt={currentArticle.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 flex items-center gap-2">
                      <span className="font-mono font-bold text-xs px-2.5 py-1 rounded bg-black/80 text-white border border-[#5584B4]/50 backdrop-blur-xs">
                        #{currentArticle.seq || 1}
                      </span>
                      {currentArticle.isMustRead && (
                        <span className="px-2.5 py-1 rounded text-[10px] uppercase font-bold bg-amber-500/90 text-white backdrop-blur-xs">
                          MUST READ
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-5">
                  <div className="border-b pb-4 border-[#E8E2D8] dark:border-[#252E4A]">
                    <div className="flex items-center gap-2 text-xs font-mono text-slate-500 dark:text-slate-400 lowercase mb-1">
                      {!currentArticle.imageUrl && (
                        <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-[#5584B4]/20 text-[#5584B4]">
                          #{currentArticle.seq || 1}
                        </span>
                      )}
                      <span>{currentArticle.readTime}</span>
                      <span>·</span>
                      <span>{currentArticle.category}</span>
                      {currentArticle.publishedDate && (
                        <>
                          <span>·</span>
                          <span>published: {currentArticle.publishedDate}</span>
                        </>
                      )}
                    </div>
                    <h2 className="font-['Raleway'] text-2xl sm:text-3xl font-bold tracking-tight lowercase">
                      {currentArticle.title}
                    </h2>
                    <div className="text-xs font-mono text-slate-600 dark:text-slate-300 mt-1 lowercase">
                      byline / author:{' '}
                      <strong className="font-bold">{currentArticle.author}</strong>
                    </div>
                  </div>

                  {/* Key Thesis Excerpt Box (Sand/Ivory per style guide) */}
                  <div
                    className={`p-4 sm:p-5 rounded-2xl text-sm sm:text-base font-['DM_Sans'] border-l-4 border-[#5584B4] leading-relaxed ${
                      isDark ? 'bg-[#182038] text-slate-200' : 'bg-[#FAF8F5] text-slate-900'
                    }`}
                  >
                    "{currentArticle.summary}"
                  </div>

                  {/* Full Article Content */}
                  <div className="text-sm sm:text-base font-['DM_Sans'] leading-relaxed whitespace-pre-line space-y-4 text-slate-700 dark:text-slate-300">
                    {currentArticle.content || currentArticle.summary}
                  </div>
                </div>
              </div>
            )}

            {/* Articles List */}
            <div className="space-y-3">
              <h3 className="font-['Raleway'] text-base font-bold lowercase">
                all articles & memos ({filteredArticles.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredArticles.map((art, idx) => {
                  const isSelected = art.id === currentArticle?.id;
                  return (
                    <div
                      key={art.id}
                      onClick={() => setActiveArticleId(art.id)}
                      className={`p-5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-3 ${
                        isSelected
                          ? isDark
                            ? 'bg-[#182038] border-[#8EC027] shadow-md ring-1 ring-[#8EC027]'
                            : 'bg-white border-[#8EC027] shadow-md ring-1 ring-[#8EC027]'
                          : isDark
                          ? 'bg-[#141A2E] border-[#252E4A] hover:border-[#8EC027]/50'
                          : 'bg-white border-[#D8CEBC] hover:border-[#8EC027]/50'
                      }`}
                    >
                      <div className="space-y-2">
                        {/* Thumbnail Cover Image */}
                        {art.imageUrl && (
                          <div className="relative h-36 -mx-5 -mt-5 mb-2 overflow-hidden rounded-t-2xl bg-black/40">
                            <img
                              src={art.imageUrl}
                              alt={art.title}
                              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                            <div className="absolute top-2 left-2 flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs px-2 py-0.5 rounded bg-black/80 text-white border border-[#5584B4]/50 backdrop-blur-xs">
                                #{art.seq || idx + 1}
                              </span>
                              {art.isMustRead && (
                                <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-500/90 text-white backdrop-blur-xs">
                                  MUST READ
                                </span>
                              )}
                            </div>
                            <div className="absolute top-2 right-2 text-[10px] font-mono px-2 py-0.5 rounded bg-black/70 text-slate-300 backdrop-blur-xs">
                              {art.readTime}
                            </div>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                          <div className="flex items-center gap-1.5">
                            {!art.imageUrl && (
                              <span className="font-bold text-xs px-2 py-0.5 rounded bg-[#5584B4]/20 text-[#5584B4]">
                                #{art.seq || idx + 1}
                              </span>
                            )}
                            <span>{art.category}</span>
                            {art.isMustRead && !art.imageUrl && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] uppercase font-bold bg-amber-500/20 text-amber-500">
                                MUST READ
                              </span>
                            )}
                          </div>
                          {!art.imageUrl && <span>{art.readTime}</span>}
                        </div>
                        <h4 className="font-['Raleway'] text-base font-bold lowercase line-clamp-2">
                          {art.title}
                        </h4>
                        <p className="font-['DM_Sans'] text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {art.summary}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#E8E2D8] dark:border-[#252E4A] flex items-center justify-between text-xs font-['Raleway']">
                        <span className="text-slate-500 lowercase">author: {art.author}</span>
                        <span className="text-[#8EC027] font-bold lowercase">
                          {isSelected ? 'reading now' : 'read memo'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: VENTURE COURSES & SYLLABI */}
        {activeTab === 'courses' && (
          <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-['Raleway'] text-lg font-bold lowercase">
                  venture course tracks & lesson syllabi
                </h3>
                <p className="text-xs text-slate-500 font-['DM_Sans'] mt-0.5">
                  structured lessons with cleared links ready to be linked to your course recordings.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              {courseProducts.map((course) => (
                <div
                  key={course.id}
                  className={`rounded-3xl border p-6 shadow-xs space-y-4 ${
                    isDark ? 'bg-[#141A2E] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4 border-[#E8E2D8] dark:border-[#252E4A]">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono px-2 py-0.5 rounded bg-[#9A7B4F]/10 text-[#9A7B4F] dark:text-[#D4A373] uppercase font-bold">
                          {course.stage}
                        </span>
                        <span className="text-xs font-mono text-slate-400">
                          SKU: {course.sku}
                        </span>
                      </div>
                      <h4 className="font-['Raleway'] text-xl font-bold lowercase mt-1">
                        {course.name}
                      </h4>
                      <p className="text-xs font-['DM_Sans'] text-slate-500 dark:text-slate-400 mt-0.5">
                        {course.description}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-mono px-3 py-1 rounded-xl bg-[#FAF8F5] dark:bg-[#0E1322] border border-[#D8CEBC] dark:border-[#252E4A] font-semibold">
                        {(course.courseLessons || []).length} Lessons
                      </span>
                    </div>
                  </div>

                  {/* Lessons Breakdown */}
                  <div className="space-y-2">
                    <span className="text-xs font-['Raleway'] font-bold lowercase text-slate-500">
                      syllabus breakdown:
                    </span>

                    <div className="space-y-2">
                      {(course.courseLessons || []).map((lesson, idx) => {
                        const isEditingThisLesson =
                          editingLesson?.productId === course.id &&
                          editingLesson?.lessonId === lesson.id;
                        const masterCurriculum = findMasterCurriculum(course.name || course.id);
                        const fallbackUrl = masterCurriculum?.[idx]?.youtubeUrl || '';
                        const currentUrl = (lesson.youtubeUrl || '').trim();
                        const effectiveUrl = (!currentUrl || isBogusLessonUrl(currentUrl)) ? fallbackUrl : currentUrl;
                        const hasLessonLink = Boolean(effectiveUrl && effectiveUrl.trim() !== '');

                        return (
                          <div
                            key={lesson.id}
                            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                              isDark
                                ? 'bg-[#0E1322] border-[#252E4A]'
                                : 'bg-[#FAF8F5] border-[#E8E2D8]'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xs font-mono text-[#5584B4] font-bold">
                                {String(idx + 1).padStart(2, '0')}.
                              </span>
                              <div>
                                <h5 className="font-['Raleway'] text-xs sm:text-sm font-semibold lowercase">
                                  {lesson.name}
                                </h5>
                                <div className="text-[11px] font-mono text-slate-400">
                                  duration: {lesson.duration}
                                </div>
                              </div>
                            </div>

                            {/* Lesson Stream Link Action */}
                            <div className="flex items-center gap-2">
                              {isEditingThisLesson ? (
                                <div className="flex items-center gap-1.5">
                                  <input
                                    type="text"
                                    value={editingLesson?.url || ''}
                                    onChange={(e) =>
                                      setEditingLesson({
                                        ...editingLesson!,
                                        url: e.target.value,
                                      })
                                    }
                                    placeholder="paste lesson video link..."
                                    className="px-2.5 py-1 text-xs font-mono rounded-lg bg-white dark:bg-[#141A2E] border border-[#5584B4] text-slate-900 dark:text-white"
                                  />
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleSaveLessonUrl(
                                        course.id,
                                        lesson.id,
                                        editingLesson?.url || ''
                                      )
                                    }
                                    className="px-2.5 py-1 text-xs font-['Raleway'] font-bold bg-[#5584B4] text-white rounded-lg hover:bg-[#4773A0]"
                                  >
                                    save
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setEditingLesson(null)}
                                    className="p-1 rounded-lg text-slate-400 hover:text-slate-600"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  {hasLessonLink ? (
                                    <>
                                      <a
                                        href={effectiveUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 transition-colors"
                                        title="Open lesson stream in new tab"
                                      >
                                        <ExternalLink className="h-3 w-3" />
                                        <span>watch lesson</span>
                                      </a>
                                    </>
                                  ) : (
                                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 font-semibold">
                                      link cleared
                                    </span>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setEditingLesson({
                                        productId: course.id,
                                        lessonId: lesson.id,
                                        url: lesson.youtubeUrl || '',
                                      })
                                    }
                                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#1E2548] border border-[#D8CEBC] dark:border-[#252E4A] hover:border-[#5584B4] text-xs font-['Raleway'] font-medium lowercase flex items-center gap-1"
                                  >
                                    <Edit2 className="h-3 w-3 text-[#5584B4]" />
                                    <span>edit link</span>
                                  </button>
                                  {hasLessonLink && (
                                    <button
                                      type="button"
                                      onClick={() => handleClearLessonUrl(course.id, lesson.id)}
                                      className="p-1 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-950/40 text-rose-500 transition-colors"
                                      title="Clear lesson link"
                                    >
                                      <X className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
