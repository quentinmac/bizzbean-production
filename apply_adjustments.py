with open('src/components/WorkArea.tsx', 'r') as f:
    code = f.read()

# =========================================================================
# Adjustment A: Replace the top Product Slider container with clean Stage Panel
# =========================================================================
slider_start = "{/* TOP: PRODUCT SLIDER (Only rendered in workspace solution/video/article mode; hidden on Hero Splash Page so no buttons appear above image) */}"
slider_end = "{/* CENTER DISPLAY AREA */}"

idx_a_start = code.find(slider_start)
idx_a_end = code.find(slider_end)
assert idx_a_start != -1 and idx_a_end != -1, "Slider block not found"

new_slider_block = """{/* TOP: STAGE PANEL (A - Clean: Previous button, Stage name e.g. vi-ability, Next button) */}
        {!isHeroSplashMode && (
          <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-[#141A2E] border border-[#D8CEBC] dark:border-[#252E4A] shadow-xs">
            {/* Previous button - moves to previous solution */}
            <button
              type="button"
              onClick={() => {
                if (isVideoMode) {
                  setActiveVideoIdx((activeVideoIdx - 1 + effectiveVideos.length) % effectiveVideos.length);
                } else if (isArticlesMode) {
                  setActiveArticleIdx((activeArticleIdx - 1 + effectiveArticles.length) % effectiveArticles.length);
                } else {
                  handlePrevSolution();
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#0E1220] hover:bg-[#F4EFE6] dark:hover:bg-[#1E2548] border border-[#D8CEBC] dark:border-[#252E4A] text-xs font-mono text-slate-700 dark:text-slate-200 transition-colors lowercase font-bold"
              title="Previous solution"
            >
              <ChevronLeft className="h-4 w-4 text-[#5584B4]" />
              <span>previous</span>
            </button>

            {/* Stage name e.g. vi-ability */}
            <div className="text-center">
              <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white font-mono lowercase tracking-wide">
                {currentStageKey.toLowerCase()}
              </span>
            </div>

            {/* Next button - moves to next solution */}
            <button
              type="button"
              onClick={() => {
                if (isVideoMode) {
                  setActiveVideoIdx((activeVideoIdx + 1) % effectiveVideos.length);
                } else if (isArticlesMode) {
                  setActiveArticleIdx((activeArticleIdx + 1) % effectiveArticles.length);
                } else {
                  handleNextSolution();
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#FAF8F5] dark:bg-[#0E1220] hover:bg-[#F4EFE6] dark:hover:bg-[#1E2548] border border-[#D8CEBC] dark:border-[#252E4A] text-xs font-mono text-slate-700 dark:text-slate-200 transition-colors lowercase font-bold"
              title="Next solution"
            >
              <span>next</span>
              <ChevronRight className="h-4 w-4 text-[#5584B4]" />
            </button>
          </div>
        )}

        """

code = code[:idx_a_start] + new_slider_block + code[idx_a_end:]

# =========================================================================
# Adjustments B, C, D, E: Update the stage card content & styling
# =========================================================================
flashcard_start = "          /* CENTER: SOLUTION FLASHCARD CONTAINER (Clean About Bizzbean Styling per user brief) */"
flashcard_end = "                {/* Smart Pricing Policy Popup Modal */}"

idx_f_start = code.find(flashcard_start)
idx_f_end = code.find(flashcard_end)
assert idx_f_start != -1 and idx_f_end != -1, "Flashcard block not found"

new_flashcard_block = """          /* CENTER: SOLUTION FLASHCARD CONTAINER (Clean About Bizzbean Styling per user brief) */
          (() => {
            const currentProd = displayTableProducts[safeProductIdx] || activeSolution;
            const targetProdId = currentProd?.id || activeSolution?.id;
            const matchingCms = (cmsProducts || []).find(
              (p: any) =>
                p.id === targetProdId ||
                (targetProdId === 'bizzbudget' && p.id === 'budget') ||
                (targetProdId === 'budget' && p.id === 'bizzbudget')
            );

            const effectiveSellingZAR = matchingCms
              ? matchingCms.sellingPriceZAR
              : (currentProd?.sellingPriceZAR || currentProd?.priceZAR || activeSolution?.priceZAR || 0);
            const effectiveTokens = matchingCms
              ? matchingCms.tokensAllocated
              : (currentProd?.tokensAllocated || activeSolution?.tokensAllocated || Math.round(effectiveSellingZAR * 0.20 * 10) / 10);
            const effectiveExclusiveZAR = matchingCms
              ? matchingCms.exclusivePriceZAR
              : (currentProd?.exclusivePriceZAR || Math.round((effectiveSellingZAR / 1.15) * 100) / 100);
            const effectiveVatZAR = matchingCms
              ? matchingCms.vatZAR
              : (currentProd?.vatZAR || Math.round((effectiveSellingZAR - effectiveExclusiveZAR) * 100) / 100);
            const effectiveTicketZAR = matchingCms
              ? matchingCms.ticketPriceZAR
              : (currentProd?.ticketPriceZAR || Math.round((effectiveSellingZAR * 1.20) * 100) / 100);
            const isMonthlySubscription =
              (matchingCms?.billingModel || currentProd?.billingModel || activeSolution?.billingModel) === 'monthly subscription';

            const isPurchased = Boolean(
              matchingCms?.isPurchased ?? currentProd?.isPurchased ?? activeSolution?.isPurchased
            );

            const matchingPromo = (cmsPromotions || []).find(
              (p) =>
                p.targetId === targetProdId ||
                p.id === targetProdId ||
                (targetProdId === 'bizzbudget' && (p.targetId === 'budget' || p.id === 'bizzbudget'))
            );

            // C: Link the solution image directly from the CMS
            const solutionImage =
              matchingCms?.canonicalCoverUrl ||
              (matchingCms as any)?.imageUrl ||
              matchingPromo?.imageUrl ||
              currentProd?.imageUrl ||
              activeSolution?.imageUrl ||
              'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=1600&q=80';

            const solutionDisplayName = matchingCms?.name || currentProd?.name || activeSolution?.name || 'Solution';
            const solutionSubtitle = matchingCms?.subtitle || currentProd?.subtitle || activeSolution?.subtitle || '';
            const courseObjectivesText =
              matchingCms?.purpose ||
              matchingCms?.description ||
              currentProd?.purpose ||
              currentProd?.description ||
              activeSolution?.purpose ||
              activeSolution?.description ||
              '';

            return (
              <div
                className={`rounded-2xl border p-5 sm:p-7 space-y-6 shadow-xs transition-colors ${
                  isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC]'
                }`}
              >
                {/* B: Solution name and subtitle centered across the panel */}
                <div
                  className={`pb-4 border-b text-center space-y-1.5 ${
                    isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
                  }`}
                >
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white uppercase font-mono tracking-wide">
                    {solutionDisplayName}
                  </h2>
                  <div className="text-xs font-mono text-slate-600 dark:text-slate-400 lowercase max-w-2xl mx-auto leading-relaxed">
                    {solutionSubtitle}
                  </div>
                </div>

                {/* C: Solution Image linked from CMS - Pristine & Clean */}
                <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-xl overflow-hidden bg-black/40 border border-[#E8E2D8] dark:border-[#252E4A] shadow-xs">
                  <img
                    src={solutionImage}
                    alt={solutionDisplayName}
                    className="w-full h-full object-cover select-none"
                  />
                </div>

                {/* D: Course Objectives (Comment 'foundational premise & learning outcomes' removed) */}
                <div
                  className={`p-4 sm:p-5 rounded-xl border ${
                    isDark ? 'bg-[#111628] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#E8E2D8] shadow-xs'
                  }`}
                >
                  <div className="mb-2">
                    <span className="font-mono text-xs font-bold text-slate-500 uppercase tracking-wider block">
                      {matchingCms?.type === 'course' ? 'COURSE OBJECTIVES' : 'SOLUTION OBJECTIVES & PURPOSE'}
                    </span>
                  </div>
                  <p className={`text-xs sm:text-sm leading-relaxed ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                    {courseObjectivesText}
                  </p>
                </div>

                {/* E: Pricing Details with Panel Styling & Consistent High-Contrast Font Colours */}
                <div
                  className={`rounded-xl border p-4 sm:p-5 shadow-xs space-y-4 ${
                    isDark ? 'bg-[#111628] border-[#252E4A]' : 'bg-[#FAF8F5] border-[#D8CEBC]'
                  }`}
                >
                  <div
                    className={`flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b gap-2 ${
                      isDark ? 'border-[#252E4A]' : 'border-[#E8E2D8]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`font-mono text-xs font-bold uppercase tracking-wider ${isDark ? 'text-[#D4A373]' : 'text-slate-900'}`}>
                        PRICING & TOKEN REINVESTMENT (V1 FORMULA ENGINE)
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                          isMonthlySubscription
                            ? 'bg-purple-900/25 text-purple-700 dark:text-purple-300 border border-purple-500/30'
                            : isDark
                            ? 'bg-slate-800 text-slate-300'
                            : 'bg-slate-200 text-slate-800'
                        }`}
                      >
                        {isMonthlySubscription ? 'monthly subscription' : 'once-off lifetime'}
                      </span>
                    </div>
                    <div className={`text-xs font-mono lowercase ${isDark ? 'text-[#C59B63]' : 'text-slate-600'}`}>
                      statutory vat & token rewards applied
                    </div>
                  </div>

                  {/* Pricing Breakdown Grid - 100% Readable, High-Contrast Panel Styling */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-center font-mono">
                    <div
                      className={`p-3 rounded-xl border transition-colors ${
                        isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'
                      }`}
                    >
                      <div className="text-xs text-slate-500 lowercase font-medium">base selling:</div>
                      <div className={`text-sm sm:text-base font-bold mt-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                        R{effectiveSellingZAR.toFixed(2)}
                        {isMonthlySubscription && <span className="text-[10px] font-normal text-purple-500">/mo</span>}
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-xl border transition-colors ${
                        isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'
                      }`}
                    >
                      <div className="text-xs text-slate-500 lowercase font-medium">excl. vat:</div>
                      <div className={`text-sm sm:text-base font-bold mt-1 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                        R{effectiveExclusiveZAR.toFixed(2)}
                        {isMonthlySubscription && <span className="text-[10px] font-normal text-purple-500">/mo</span>}
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-xl border transition-colors ${
                        isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'
                      }`}
                    >
                      <div className="text-xs text-slate-500 lowercase font-medium">vat (15%):</div>
                      <div className={`text-sm sm:text-base font-bold mt-1 ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                        R{effectiveVatZAR.toFixed(2)}
                        {isMonthlySubscription && <span className="text-[10px] font-normal text-purple-500">/mo</span>}
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-xl border transition-colors ${
                        isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'
                      }`}
                    >
                      <div className="text-xs text-slate-500 lowercase font-medium">ticket benchmark:</div>
                      <div className={`text-sm sm:text-base font-bold mt-1 ${isDark ? 'text-[#DDEBF7]' : 'text-slate-900'}`}>
                        R{effectiveTicketZAR.toFixed(2)}
                        {isMonthlySubscription && <span className="text-[10px] font-normal text-purple-500">/mo</span>}
                      </div>
                    </div>

                    <div
                      className={`p-3 rounded-xl border col-span-2 sm:col-span-1 transition-colors ${
                        isDark ? 'bg-[#161C30] border-[#252E4A]' : 'bg-white border-[#D8CEBC] shadow-xs'
                      }`}
                    >
                      <div className={`text-xs lowercase font-bold ${isDark ? 'text-amber-400' : 'text-amber-700'}`}>
                        tokens credited:
                      </div>
                      <div className={`text-sm sm:text-base font-bold mt-1 flex items-center justify-center gap-1 ${isDark ? 'text-amber-300' : 'text-amber-700'}`}>
                        <Coins className="h-3.5 w-3.5 text-amber-500" />
                        <span>+{effectiveTokens}</span>
                      </div>
                    </div>
                  </div>

                  {/* Buttons Section: Row 1 has SMART PRICING and BUY SOLUTION; Row 2 has LAUNCH IN WORK AREA centered */}
                  <div className="pt-3 border-t border-[#E8E2D8] dark:border-[#252E4A] space-y-3">
                    {/* Row 1: SMART PRICING POLICY button and BUY SOLUTION button in the SAME ROW */}
                    <div className="flex items-center justify-between gap-3 flex-wrap sm:flex-nowrap">
                      {/* Pink SMART PRICING Policy Button */}
                      <button
                        type="button"
                        onClick={() => setIsSmartPricingModalOpen(true)}
                        className="w-full sm:w-auto flex-1 px-4 py-2.5 rounded-xl bg-[#E02475] hover:bg-[#C91A63] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all uppercase font-mono tracking-wide"
                        title="View transparent V1 Smart Pricing Policy"
                      >
                        <Info className="h-4 w-4" />
                        <span>SMART PRICING POLICY</span>
                      </button>

                      {/* Pink BUY SOLUTION Button */}
                      <button
                        type="button"
                        onClick={() => onBuySolution(currentProd || activeSolution!)}
                        className="w-full sm:w-auto flex-1 px-5 py-2.5 rounded-xl bg-[#E02475] hover:bg-[#C91A63] text-white font-bold text-xs uppercase font-mono flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] tracking-wide"
                      >
                        <ShoppingCart className="h-4 w-4" />
                        <span>
                          BUY SOLUTION (R{effectiveSellingZAR.toFixed(2)}{isMonthlySubscription ? '/mo' : ''})
                        </span>
                      </button>
                    </div>

                    {/* Row 2: LAUNCH IN WORK AREA button in the middle of the panel below the above buttons */}
                    <div className="flex flex-col items-center justify-center pt-1 gap-1">
                      {isPurchased ? (
                        <button
                          type="button"
                          onClick={onLaunchSolution}
                          className="px-6 py-2.5 rounded-xl bg-[#12172A] hover:bg-[#1E2548] text-white font-bold text-xs uppercase font-mono flex items-center gap-2 shadow-sm transition-all tracking-wide"
                        >
                          <span>LAUNCH IN WORK AREA</span>
                          <ArrowRight className="h-4 w-4 text-[#C59B63]" />
                        </button>
                      ) : (
                        <div className="flex flex-col items-center gap-1">
                          <button
                            type="button"
                            disabled
                            className="px-6 py-2.5 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-500 font-bold text-xs uppercase font-mono flex items-center gap-2 cursor-not-allowed border border-slate-300 dark:border-slate-700"
                            title="Purchase solution to access work area"
                          >
                            <Lock className="h-3.5 w-3.5" />
                            <span>LAUNCH IN WORK AREA</span>
                          </button>
                          <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 lowercase">
                            (purchase solution to access work area)
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

"""

code = code[:idx_f_start] + new_flashcard_block + code[idx_f_end:]

with open('src/components/WorkArea.tsx', 'w') as f:
    f.write(code)

print('Adjustments A, B, C, D, E applied successfully!')
