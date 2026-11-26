import React, { useEffect } from 'react';
import { CmsArticle, CmsProduct, CmsVideo } from '../../data/cmsConsoleData';
import { LibraryItem } from '../../types';
import { parsePublicRoute } from './publicSiteData';
import { PublicNavbar } from './PublicNavbar';
import { PublicFooter } from './PublicFooter';
import { PublicHomePage } from './PublicHomePage';
import {
  PublicSolutionsDirectory,
  PublicStagePage,
  PublicSolutionDetailPage,
} from './PublicSolutionsPages';
import {
  PublicArticlesIndexPage,
  PublicArticleDetailPage,
  PublicLibraryPage,
  PublicVideosPage,
  PublicAboutPage,
  PublicContactPage,
  PublicPoliciesPage,
} from './PublicContentPages';

interface PublicWebsiteShellProps {
  publicPath: string;
  theme: 'light' | 'dark';
  isMember: boolean;
  cmsProducts: CmsProduct[];
  cmsArticles: CmsArticle[];
  cmsVideos: CmsVideo[];
  libraryItems: LibraryItem[];
  onNavigate: (path: string) => void;
  onOpenDesk: (target?: { stageId?: string; solutionId?: string; launch?: boolean }) => void;
  onOpenSignIn: () => void;
  onOpenSignUp: () => void;
  onToggleTheme: () => void;
  onDownloadBook: () => void;
  onOpenLibraryItem: (item: LibraryItem) => void;
  onOpenTalkToUs: () => void;
}

export const PublicWebsiteShell: React.FC<PublicWebsiteShellProps> = ({
  publicPath,
  theme,
  isMember,
  cmsProducts,
  cmsArticles,
  cmsVideos,
  libraryItems,
  onNavigate,
  onOpenDesk,
  onOpenSignIn,
  onOpenSignUp,
  onToggleTheme,
  onDownloadBook,
  onOpenLibraryItem,
  onOpenTalkToUs,
}) => {
  const currentRoute = parsePublicRoute(publicPath);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }
  }, [publicPath]);

  return (
    <div className="min-h-screen w-full flex flex-col bg-[#FAF8F5] dark:bg-[#0A0D14] text-slate-900 dark:text-slate-100 font-sans antialiased selection:bg-[#2E5E88]/20">
      <PublicNavbar
        currentRoute={currentRoute}
        onNavigate={onNavigate}
        onOpenDesk={onOpenDesk}
        onOpenSignIn={onOpenSignIn}
        onOpenSignUp={onOpenSignUp}
        isMember={isMember}
      />

      <main className="flex-1 w-full">
        {currentRoute.kind === 'home' && (
          <PublicHomePage
            cmsProducts={cmsProducts}
            cmsArticles={cmsArticles}
            cmsVideos={cmsVideos}
            isMember={isMember}
            onNavigate={onNavigate}
            onOpenDesk={onOpenDesk}
            onOpenSignIn={onOpenSignIn}
            onOpenSignUp={onOpenSignUp}
            onDownloadBook={onDownloadBook}
          />
        )}

        {currentRoute.kind === 'solutions' && (
          <PublicSolutionsDirectory
            cmsProducts={cmsProducts}
            isMember={isMember}
            onNavigate={onNavigate}
            onOpenDesk={onOpenDesk}
            onOpenSignUp={onOpenSignUp}
          />
        )}

        {currentRoute.kind === 'stage' && (
          <PublicStagePage
            stageId={currentRoute.stageId}
            cmsProducts={cmsProducts}
            isMember={isMember}
            onNavigate={onNavigate}
            onOpenDesk={onOpenDesk}
            onOpenSignUp={onOpenSignUp}
          />
        )}

        {currentRoute.kind === 'solution' && (
          <PublicSolutionDetailPage
            solutionId={currentRoute.solutionId}
            cmsProducts={cmsProducts}
            isMember={isMember}
            onNavigate={onNavigate}
            onOpenDesk={onOpenDesk}
            onOpenSignUp={onOpenSignUp}
          />
        )}

        {currentRoute.kind === 'articles' && (
          <PublicArticlesIndexPage
            cmsArticles={cmsArticles}
            cmsVideos={cmsVideos}
            onNavigate={onNavigate}
          />
        )}

        {currentRoute.kind === 'article-detail' && (
          <PublicArticleDetailPage
            slug={currentRoute.slug}
            cmsArticles={cmsArticles}
            onNavigate={onNavigate}
            onOpenDesk={onOpenDesk}
          />
        )}

        {currentRoute.kind === 'library' && (
          <PublicLibraryPage
            libraryItems={libraryItems}
            onNavigate={onNavigate}
            onDownloadBook={onDownloadBook}
            onOpenLibraryItem={onOpenLibraryItem}
            onOpenDesk={onOpenDesk}
          />
        )}

        {currentRoute.kind === 'videos' && (
          <PublicVideosPage
            cmsVideos={cmsVideos}
            articleCount={(cmsArticles || []).length}
            onNavigate={onNavigate}
          />
        )}

        {currentRoute.kind === 'about' && (
          <PublicAboutPage
            onNavigate={onNavigate}
            onOpenDesk={() => onOpenDesk()}
            onDownloadBook={onDownloadBook}
          />
        )}

        {currentRoute.kind === 'contact' && (
          <PublicContactPage
            onNavigate={onNavigate}
            onOpenDesk={() => onOpenDesk()}
            onOpenTalkToUs={onOpenTalkToUs}
          />
        )}

        {currentRoute.kind === 'policies' && (
          <PublicPoliciesPage onNavigate={onNavigate} />
        )}
      </main>

      <PublicFooter
        theme={theme}
        onToggleTheme={onToggleTheme}
        onNavigate={onNavigate}
        onOpenDesk={() => onOpenDesk()}
        onOpenSignIn={onOpenSignIn}
        onOpenSignUp={onOpenSignUp}
        onDownloadBook={onDownloadBook}
        isMember={isMember}
      />
    </div>
  );
};
