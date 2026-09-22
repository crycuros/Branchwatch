import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  Github,
  GitBranch,
  Key,
  Lock,
  CheckCircle2,
  GitMerge,
  FileCode,
  Workflow,
  Shield,
  Activity,
  Layers,
  Eye,
  Plus,
  Minus,
} from 'lucide-react';
import { Button } from './ui/Button';
import { BranchWatchLogo } from './ui/BranchWatchLogo';

interface LandingPageProps {
  tokenConnected: boolean;
  onConnectGitHubToken: (token: string) => void;
  onStartOAuth: () => void;
  onOpenWorkspace: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  tokenConnected,
  onConnectGitHubToken,
  onStartOAuth,
  onOpenWorkspace,
}) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [authMethod, setAuthMethod] = useState<'oauth' | 'pat'>('oauth');
  const [mounted, setMounted] = useState(false);

  // Scroll tracking state with Continuous LERP Damping
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const targetScrollY = useRef(0);
  const currentScrollY = useRef(0);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Silky Smooth LERP Animation Frame Loop
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let animId: number;

    const loop = () => {
      // Linear interpolation damping (0.09 factor) for liquid glide
      const diff = targetScrollY.current - currentScrollY.current;
      if (Math.abs(diff) > 0.05) {
        currentScrollY.current += diff * 0.09;
        setScrollY(currentScrollY.current);

        const maxScroll = container.scrollHeight - container.clientHeight || 1;
        const scrollProgress = currentScrollY.current / maxScroll;

        if (scrollProgress < 0.32) {
          setActiveFeatureIndex(0);
        } else if (scrollProgress < 0.65) {
          setActiveFeatureIndex(1);
        } else {
          setActiveFeatureIndex(2);
        }
      }
      animId = requestAnimationFrame(loop);
    };

    const handleScroll = () => {
      targetScrollY.current = container.scrollTop;
    };

    container.addEventListener('scroll', handleScroll, { passive: true });
    animId = requestAnimationFrame(loop);

    return () => {
      container.removeEventListener('scroll', handleScroll);
      cancelAnimationFrame(animId);
    };
  }, []);

  // Auto-cycle showcase tabs gently if user is near top
  useEffect(() => {
    const timer = setInterval(() => {
      if (scrollY < 150) {
        setActiveFeatureIndex((prev) => (prev + 1) % 3);
      }
    }, 4500);
    return () => clearInterval(timer);
  }, [scrollY]);

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (tokenInput.trim()) {
      onConnectGitHubToken(tokenInput.trim());
    }
  };

  // Scroll-linked values
  const heroOpacity = Math.max(0, 1 - scrollY / 450);
  const heroScale = Math.max(0.92, 1 - scrollY / 2500);
  const heroTranslateY = scrollY * 0.25;

  // 3D perspective tilt calculation for showcase
  const tiltProgress = Math.min(1, Math.max(0, scrollY / 600));
  const cardRotateX = Math.max(0, 18 - tiltProgress * 18);
  const cardScale = 0.92 + tiltProgress * 0.08;
  const cardShadow = tiltProgress > 0.5 ? '0 30px 80px -15px rgba(0,0,0,0.3)' : '0 10px 40px -10px rgba(0,0,0,0.15)';

  return (
    <div
      ref={scrollContainerRef}
      className="h-screen w-screen overflow-y-auto overflow-x-hidden bg-neutral-50 dark:bg-[#08090a] text-neutral-900 dark:text-neutral-100 font-sans selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900 scroll-smooth"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* Sticky Frosted Glass Navbar */}
      <header className="sticky top-0 z-50 w-full apple-glass transition-all duration-200">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 shadow-sm transition-transform duration-300 hover:scale-105">
              <BranchWatchLogo className="w-4 h-4" strokeWidth={2.2} />
            </div>
            <span className="font-bold text-base tracking-tight">BranchWatch</span>
          </div>

          <div className="flex items-center gap-3">
            {tokenConnected ? (
              <Button variant="primary" size="sm" onClick={onOpenWorkspace} className="shadow-sm">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Open Workspace</span>
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={() => setShowAuthModal(true)} className="shadow-sm">
                <Github className="w-4 h-4" />
                <span>Connect GitHub</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section with Parallax Scaling & Floating Glass Badges */}
      <section className="relative min-h-[90vh] max-w-6xl mx-auto px-6 pt-20 pb-16 flex flex-col items-center justify-center text-center">
        {/* Ambient Glow Depth Layer */}
        <div
          className="absolute pointer-events-none w-[650px] h-[350px] bg-gradient-to-tr from-blue-500/15 via-purple-500/10 to-emerald-500/15 rounded-full blur-[100px] -top-10 left-1/2 -translate-x-1/2 -z-10 animate-pulse-glow"
        />

        {/* Floating Parallax Depth Badge Left */}
        <div className="hidden lg:block absolute left-8 top-32 pointer-events-none animate-float-left">
          <div className="apple-glass-card rounded-2xl p-3.5 flex items-center gap-3 shadow-xl">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-left font-mono">
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">main · 0 uncommitted</div>
              <div className="text-[10px] text-neutral-400">Clean working tree</div>
            </div>
          </div>
        </div>

        {/* Floating Parallax Depth Badge Right */}
        <div className="hidden lg:block absolute right-8 top-44 pointer-events-none animate-float-right">
          <div className="apple-glass-card rounded-2xl p-3.5 flex items-center gap-3 shadow-xl">
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <GitMerge className="w-4 h-4" />
            </div>
            <div className="text-left font-mono">
              <div className="text-xs font-semibold text-neutral-900 dark:text-neutral-100">+182 / -47 lines</div>
              <div className="text-[10px] text-neutral-400">Auto diff synced</div>
            </div>
          </div>
        </div>

        {/* Core Hero Content with Scroll Transform */}
        <div
          style={{
            opacity: heroOpacity,
            transform: `scale(${heroScale}) translateY(${heroTranslateY}px)`,
            willChange: 'transform, opacity',
          }}
          className="max-w-4xl space-y-6"
        >
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] backdrop-blur-md text-xs font-medium text-neutral-700 dark:text-neutral-300 animate-slide-up stagger-1">
            <span>Enterprise Git Topology & Real-Time Intelligence</span>
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight text-neutral-900 dark:text-neutral-50 leading-[1.08] animate-slide-up stagger-2">
            Understand every branch. <br />
            <span className="text-neutral-400 dark:text-neutral-500 font-medium">At a glance.</span>
          </h1>

          <p className="text-lg sm:text-2xl text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto font-normal leading-relaxed animate-slide-up stagger-3">
            Monitor real-time repository commits, multi-branch topologies, live visual code diffs, and node-based git workflows in one centralized workspace.
          </p>

          <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up stagger-4">
            {tokenConnected ? (
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto px-8 py-3.5 text-base shadow-xl"
                onClick={onOpenWorkspace}
              >
                <span>Open Your Workspace</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            ) : (
              <Button
                variant="primary"
                size="lg"
                className="w-full sm:w-auto px-8 py-3.5 text-base shadow-xl"
                onClick={() => setShowAuthModal(true)}
              >
                <Github className="w-5 h-5" />
                <span>Connect GitHub Account</span>
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>
        </div>
      </section>

      {/* Sticky 3D Product Showcase with Continuous Scroll Interpolation */}
      <section className="relative min-h-[220vh] max-w-6xl mx-auto px-6">
        {/* Ambient background light pool for frosted refraction */}
        <div
          className="absolute pointer-events-none w-[750px] h-[450px] bg-gradient-to-br from-indigo-500/10 via-sky-500/10 to-emerald-500/10 rounded-full blur-[120px] top-20 left-1/2 -translate-x-1/2 -z-10"
          style={{ transform: `translate(-50%, ${scrollY * 0.12}px)` }}
        />

        <div className="sticky top-24 z-20 flex flex-col items-center">
          {/* Scroll progress segment control bar */}
          <div className="mb-6 flex items-center gap-1.5 p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] backdrop-blur-xl">
            <button
              onClick={() => setActiveFeatureIndex(0)}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 apple-press ${
                activeFeatureIndex === 0
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              1. Topology Graph
            </button>
            <button
              onClick={() => setActiveFeatureIndex(1)}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 apple-press ${
                activeFeatureIndex === 1
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              2. Live Visual Diff
            </button>
            <button
              onClick={() => setActiveFeatureIndex(2)}
              className={`px-4 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 apple-press ${
                activeFeatureIndex === 2
                  ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm font-semibold'
                  : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              3. Visual Git Engine
            </button>
          </div>

          {/* 3D Perspective Device Stage */}
          <div
            style={{
              perspective: '1200px',
              width: '100%',
              maxWidth: '1000px',
            }}
          >
            <div
              style={{
                transform: `rotateX(${cardRotateX}deg) scale(${cardScale})`,
                boxShadow: cardShadow,
                transformOrigin: 'top center',
                transition: 'transform 0.35s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.35s ease',
              }}
              className="apple-glass-card rounded-2xl overflow-hidden p-2 sm:p-3 border border-black/[0.08] dark:border-white/[0.1]"
            >
              {/* Device Window Frame */}
              <div className="rounded-xl bg-white/90 dark:bg-[#0d1117]/95 border border-black/[0.06] dark:border-white/[0.08] overflow-hidden">
                {/* Titlebar */}
                <div className="flex items-center justify-between px-4 py-3 bg-black/[0.02] dark:bg-white/[0.02] border-b border-black/[0.06] dark:border-white/[0.06]">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                    <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                    <span className="ml-2 font-mono text-xs text-neutral-400">BranchWatch · workspace/crycuros</span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-mono text-neutral-400">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-semibold">
                      ● Active HEAD
                    </span>
                  </div>
                </div>

                {/* Dynamic Scrubbing View Content */}
                <div className="p-6 min-h-[380px] flex flex-col justify-center">
                  {/* Mode 1: Topology Graph */}
                  {activeFeatureIndex === 0 && (
                    <div className="space-y-4 animate-fade-in font-mono text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-black/[0.05] dark:border-white/[0.05]">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">Branch History & Commit Lanes</span>
                        <span className="text-neutral-400">Bezier Curve Topology</span>
                      </div>

                      <div className="space-y-3">
                        <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
                            <div>
                              <div className="font-semibold text-neutral-900 dark:text-neutral-100">main</div>
                              <div className="text-[11px] text-neutral-400">Optimize multi-branch synchronization and merge resolution</div>
                            </div>
                          </div>
                          <span className="text-neutral-400">2 mins ago</span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
                            <div>
                              <div className="font-semibold text-neutral-900 dark:text-neutral-100">feature/visual-diff</div>
                              <div className="text-[11px] text-neutral-400">Side-by-side gutter line comparison viewer</div>
                            </div>
                          </div>
                          <span className="text-neutral-400">1 hour ago</span>
                        </div>

                        <div className="p-3.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-500 ring-4 ring-purple-500/20" />
                            <div>
                              <div className="font-semibold text-neutral-900 dark:text-neutral-100">feature/workflow-canvas</div>
                              <div className="text-[11px] text-neutral-400">Connect working tree, staging, and commits via node wires</div>
                            </div>
                          </div>
                          <span className="text-neutral-400">Yesterday</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mode 2: Live Code Diff */}
                  {activeFeatureIndex === 1 && (
                    <div className="space-y-4 animate-fade-in font-mono text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-black/[0.05] dark:border-white/[0.05]">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">High-Precision Syntax Diff</span>
                        <div className="flex items-center gap-3 font-semibold">
                          <span className="text-[#7ee787] flex items-center gap-0.5"><Plus className="w-3.5 h-3.5" /> 182</span>
                          <span className="text-[#ff7b72] flex items-center gap-0.5"><Minus className="w-3.5 h-3.5" /> 47</span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#0d1117] text-[#c9d1d9] p-3 text-[11px] leading-relaxed overflow-hidden">
                        <div className="text-[#8b949e] pb-1">@@ -14,6 +14,18 @@ export const TopologyEngine = () =&gt; &#123;</div>
                        <div className="bg-[#1f382a]/50 text-[#7ee787] px-2 py-0.5 rounded flex items-center gap-2">
                          <span className="text-[#8b949e] select-none">15 +</span>
                          <span>+ const branchTree = await git.getBranchTopology(repoId);</span>
                        </div>
                        <div className="bg-[#1f382a]/50 text-[#7ee787] px-2 py-0.5 rounded flex items-center gap-2">
                          <span className="text-[#8b949e] select-none">16 +</span>
                          <span>+ const syncStatus = await git.calculateDivergence(branchTree);</span>
                        </div>
                        <div className="bg-[#3f191f]/50 text-[#ff7b72] px-2 py-0.5 rounded flex items-center gap-2">
                          <span className="text-[#8b949e] select-none">17 -</span>
                          <span>- const legacyBranches = await git.getFlatBranches();</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Mode 3: Visual Git Engine */}
                  {activeFeatureIndex === 2 && (
                    <div className="space-y-4 animate-fade-in font-mono text-xs">
                      <div className="flex items-center justify-between pb-2 border-b border-black/[0.05] dark:border-white/[0.05]">
                        <span className="font-semibold text-neutral-800 dark:text-neutral-200">Visual Workflow Canvas</span>
                        <span className="text-neutral-400">Node-Based Git Operations</span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-3.5 rounded-xl apple-glass-card space-y-2 border border-black/[0.06] dark:border-white/[0.08]">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">Working Tree</span>
                            <span className="text-emerald-500 font-bold">✓ Ready</span>
                          </div>
                          <div className="text-[11px] text-neutral-400">3 modified files</div>
                        </div>

                        <div className="p-3.5 rounded-xl apple-glass-card space-y-2 border border-blue-500/30 ring-1 ring-blue-500/20">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">Stage Changes</span>
                            <span className="text-blue-500 font-bold">Staged</span>
                          </div>
                          <div className="text-[11px] text-neutral-400">git add .</div>
                        </div>

                        <div className="p-3.5 rounded-xl apple-glass-card space-y-2 border border-black/[0.06] dark:border-white/[0.08]">
                          <div className="flex items-center justify-between">
                            <span className="font-semibold">Commit & Push</span>
                            <span className="text-purple-500 font-bold">#d2f8a1e</span>
                          </div>
                          <div className="text-[11px] text-neutral-400">origin/main</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Narrative Grid */}
      <section className="relative max-w-5xl mx-auto px-6 py-28 space-y-20">
        <div
          className="absolute pointer-events-none w-[600px] h-[350px] bg-gradient-to-tr from-purple-500/8 via-blue-500/8 to-teal-500/8 rounded-full blur-[100px] top-1/3 left-1/2 -translate-x-1/2 -z-10"
        />

        <div className="text-center space-y-3">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Engineered for high-velocity software teams.
          </h2>
          <p className="text-base text-neutral-500 dark:text-neutral-400 max-w-xl mx-auto">
            Purpose-built for engineering teams needing absolute clarity over complex repository states, merges, and commit histories.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl apple-glass-card space-y-3 apple-interactive">
            <div className="w-10 h-10 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-neutral-800 dark:text-neutral-200">
              <GitBranch className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">Multi-Branch Topology</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Visualize branch divergence, ahead/behind commit deltas, and parent-child merge histories across all active remote branches.
            </p>
          </div>

          <div className="p-6 rounded-2xl apple-glass-card space-y-3 apple-interactive">
            <div className="w-10 h-10 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-neutral-800 dark:text-neutral-200">
              <FileCode className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">Visual Diff Engine</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Inspect line-by-line syntax-highlighted additions, deletions, and uncommitted file modifications with side-by-side gutter comparison.
            </p>
          </div>

          <div className="p-6 rounded-2xl apple-glass-card space-y-3 apple-interactive">
            <div className="w-10 h-10 rounded-xl bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-neutral-800 dark:text-neutral-200">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-lg text-neutral-900 dark:text-neutral-100">Direct GitHub API Sync</h3>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              Zero-latency repository synchronization directly through official GitHub OAuth and Personal Access Tokens with complete data integrity.
            </p>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="max-w-4xl mx-auto px-6 pb-24 text-center">
        <div className="p-8 sm:p-12 rounded-3xl apple-glass-card space-y-6 shadow-2xl relative overflow-hidden">
          <div className="max-w-xl mx-auto space-y-3">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Ready to experience modern Git tracking?
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Connect your GitHub account to start tracking branches and repositories in real-time.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto px-8 py-3.5 shadow-xl text-base"
              onClick={() => setShowAuthModal(true)}
            >
              <Github className="w-5 h-5" />
              <span>Connect GitHub Account</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </section>

      {/* Auth Modal with Frosted Glass Portal */}
      {showAuthModal && mounted && typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-black/50 dark:bg-black/75 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setShowAuthModal(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="apple-glass-modal rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6 animate-apple-modal"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900">
                  <Github className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-base text-neutral-900 dark:text-neutral-100">Connect GitHub Account</h3>
                  <p className="text-xs text-neutral-500">Access your real GitHub repositories & branches</p>
                </div>
              </div>

              {/* Auth Method Tabs */}
              <div className="flex p-1 bg-black/[0.04] dark:bg-white/[0.06] rounded-xl text-xs font-medium border border-black/[0.06] dark:border-white/[0.08]">
                <button
                  onClick={() => setAuthMethod('oauth')}
                  className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 apple-press ${
                    authMethod === 'oauth'
                      ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm font-semibold'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>GitHub OAuth</span>
                </button>
                <button
                  onClick={() => setAuthMethod('pat')}
                  className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-1.5 apple-press ${
                    authMethod === 'pat'
                      ? 'bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white shadow-sm font-semibold'
                      : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white'
                  }`}
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>Personal Access Token</span>
                </button>
              </div>

              {authMethod === 'oauth' ? (
                <div className="space-y-4">
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                    Authenticate with GitHub OAuth to grant BranchWatch read access to your repositories and branch activity.
                  </p>

                  <Button
                    variant="primary"
                    size="md"
                    className="w-full py-2.5"
                    onClick={onStartOAuth}
                  >
                    <Github className="w-4 h-4" />
                    <span>Authorize with GitHub</span>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleTokenSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                      GitHub Personal Access Token (PAT)
                    </label>
                    <input
                      type="password"
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                      value={tokenInput}
                      onChange={(e) => setTokenInput(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl text-sm bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.08] dark:border-white/[0.1] focus:outline-none focus:ring-2 focus:ring-neutral-400 font-mono text-neutral-900 dark:text-neutral-100"
                    />
                  </div>

                  <Button variant="primary" type="submit" className="w-full py-2.5">
                    Save & Connect
                  </Button>
                </form>
              )}

              <div className="flex justify-end pt-2">
                <Button variant="ghost" onClick={() => setShowAuthModal(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
};
