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
  Star,
  BookOpen,
  Code2,
  Compass,
  Check,
  X,
  ExternalLink,
  HardDrive,
  Globe,
  Terminal,
  ShieldCheck,
  Cpu,
} from 'lucide-react';
import { Button } from './ui/Button';
import { BranchWatchLogo } from './ui/BranchWatchLogo';
import { NavTab } from './AppShell';

interface LandingPageProps {
  tokenConnected: boolean;
  onConnectGitHubToken: (token: string) => void;
  onStartOAuth: () => void;
  onOpenWorkspace: () => void;
  onNavigateTab?: (tab: NavTab) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  tokenConnected,
  onConnectGitHubToken,
  onStartOAuth,
  onOpenWorkspace,
  onNavigateTab,
}) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [tokenInput, setTokenInput] = useState('');
  const [authMethod, setAuthMethod] = useState<'oauth' | 'pat'>('oauth');
  const [mounted, setMounted] = useState(false);

  // Legal Modal State
  const [showLegalModal, setShowLegalModal] = useState(false);
  const [legalTab, setLegalTab] = useState<'terms' | 'privacy' | 'security' | 'mit'>('terms');

  // GitHub Star Count
  const [starCount, setStarCount] = useState<number | null>(null);

  // Scroll tracking state with Continuous LERP Damping
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const targetScrollY = useRef(0);
  const currentScrollY = useRef(0);
  const [activeFeatureIndex, setActiveFeatureIndex] = useState(0);

  useEffect(() => {
    setMounted(true);
    fetch('https://api.github.com/repos/crycuros/Branchwatch')
      .then((res) => res.json())
      .then((data) => {
        if (typeof data.stargazers_count === 'number') {
          setStarCount(data.stargazers_count);
        }
      })
      .catch(() => {});
  }, []);

  // Silky Smooth LERP Animation Frame Loop
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    let animId: number;

    const loop = () => {
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

  const handleOpenTabDirect = (tab: NavTab) => {
    if (onNavigateTab) {
      onNavigateTab(tab);
    } else {
      onOpenWorkspace();
    }
  };

  const openLegalDialog = (tab: 'terms' | 'privacy' | 'security' | 'mit') => {
    setLegalTab(tab);
    setShowLegalModal(true);
  };

  return (
    <div
      ref={scrollContainerRef}
      className="h-screen w-screen overflow-y-auto overflow-x-hidden bg-neutral-50 dark:bg-[#08090a] text-neutral-900 dark:text-neutral-100 font-sans selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900 scroll-smooth"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* 1. Sticky Frosted Glass Navbar */}
      <header className="sticky top-0 z-50 w-full apple-glass transition-all duration-200 border-b border-black/[0.06] dark:border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div
              onClick={() => {
                if (scrollContainerRef.current) scrollContainerRef.current.scrollTop = 0;
              }}
              className="flex items-center gap-2.5 cursor-pointer select-none"
            >
              <div className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900 shadow-sm transition-transform duration-300 hover:scale-105">
                <BranchWatchLogo className="w-4 h-4" strokeWidth={2.2} />
              </div>
              <span className="font-bold text-base tracking-tight">BranchWatch</span>
            </div>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-neutral-600 dark:text-neutral-400">
              <button
                onClick={() => handleOpenTabDirect('visual')}
                className="hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                Visual Workflow
              </button>
              <button
                onClick={() => handleOpenTabDirect('developer')}
                className="hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                Dev Studio
              </button>
              <button
                onClick={() => handleOpenTabDirect('community')}
                className="hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                Community
              </button>
              <button
                onClick={() => handleOpenTabDirect('docs')}
                className="hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                Docs
              </button>
              <button
                onClick={() => openLegalDialog('terms')}
                className="hover:text-neutral-900 dark:hover:text-white transition-colors"
              >
                Security & Terms
              </button>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* GitHub Repo Link */}
            <a
              href="https://github.com/crycuros/Branchwatch"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border border-neutral-200/80 dark:border-neutral-800 bg-white/60 dark:bg-neutral-900/60 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Star</span>
              {starCount !== null && (
                <span className="text-[11px] font-mono px-1.5 py-0.2 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-500">
                  {starCount}
                </span>
              )}
            </a>

            {tokenConnected ? (
              <Button variant="primary" size="sm" onClick={onOpenWorkspace} className="shadow-sm font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Open Workspace</span>
              </Button>
            ) : (
              <Button variant="primary" size="sm" onClick={() => setShowAuthModal(true)} className="shadow-sm font-semibold">
                <Github className="w-4 h-4" />
                <span>Connect GitHub</span>
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative min-h-[85vh] max-w-6xl mx-auto px-6 pt-16 pb-16 flex flex-col items-center justify-center text-center">
        {/* Ambient Depth Layer */}
        <div className="absolute pointer-events-none w-[650px] h-[350px] bg-gradient-to-tr from-blue-500/10 via-neutral-500/5 to-emerald-500/10 rounded-full blur-[120px] -top-10 left-1/2 -translate-x-1/2 -z-10" />

        <div className="space-y-6 max-w-3xl mx-auto">
          {/* Release Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-medium bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-semibold">BranchWatch v1.0 Production</span>
            <span className="text-neutral-400">·</span>
            <span>Extensible Git Graph & Automation Engine</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-neutral-900 dark:text-neutral-100 leading-[1.1]">
            The open-source Git visualizer & node automation engine.
          </h1>

          <p className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed">
            Inspect working trees, explore branch commit stacks, chain custom CLI and webhook scripts as visual nodes, and collaborate across open-source recipes with zero automatic remote pushes.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto px-8 py-3.5 shadow-lg text-sm font-semibold"
              onClick={onOpenWorkspace}
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto px-6 py-3.5 text-sm font-semibold"
              onClick={() => handleOpenTabDirect('docs')}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              <span>Read Documentation</span>
            </Button>
          </div>
        </div>
      </section>

      {/* 3. Core Feature Pillars Grid */}
      <section className="max-w-6xl mx-auto px-6 py-16">
        <div className="text-center space-y-3 mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Built for modern engineering teams & open-source contributors
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-xl mx-auto">
            A high-performance offline-first architecture providing deep Git inspection, custom scripting, and typed workflow composability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/40 shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700">
              <Workflow className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Visual Node Canvas</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Connect working tree changes, stage, commit, branch, and remote nodes with typed input and output ports on an infinite visual canvas.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/40 shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700">
              <Code2 className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Script & Node Studio</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Author Shell, Node.js, Python, and Webhook tasks. Zero-config auto-discovery via <code className="font-mono text-neutral-800 dark:text-neutral-200">.branchwatch/nodes/*.json</code>.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/40 shadow-subtle space-y-3">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white border border-neutral-200 dark:border-neutral-700">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
            </div>
            <h3 className="font-bold text-base text-neutral-900 dark:text-neutral-100">Security Clearance Model</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              Declared permissions (<code className="font-mono text-neutral-800 dark:text-neutral-200">shell</code>, <code className="font-mono text-neutral-800 dark:text-neutral-200">fs</code>, <code className="font-mono text-neutral-800 dark:text-neutral-200">network</code>) gated by explicit user consent. Zero automatic remote pushes.
            </p>
          </div>
        </div>
      </section>

      {/* 4. Bottom CTA Section */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="p-8 sm:p-12 rounded-3xl border border-neutral-200/80 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/60 shadow-xl space-y-6 relative overflow-hidden">
          <div className="max-w-xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
              Ready to elevate your Git workflow?
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400">
              Open the workspace studio directly or connect your GitHub account for real-time repository tracking.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              variant="primary"
              size="lg"
              className="w-full sm:w-auto px-8 py-3 font-semibold text-xs"
              onClick={onOpenWorkspace}
            >
              <span>Launch Studio</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="w-full sm:w-auto px-6 py-3 font-semibold text-xs"
              onClick={() => setShowAuthModal(true)}
            >
              <Github className="w-4 h-4 mr-1.5" />
              <span>Connect GitHub</span>
            </Button>
          </div>
        </div>
      </section>

      {/* 5. Production Enterprise & Open-Source Footer */}
      <footer className="border-t border-neutral-200/80 dark:border-neutral-800 bg-white/40 dark:bg-neutral-950/60 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 pt-12 pb-8">
          {/* Top 4-Column Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-neutral-200/60 dark:border-neutral-800/60 text-xs">
            {/* Column 1: Brand & Overview */}
            <div className="col-span-2 md:col-span-1 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900">
                  <BranchWatchLogo className="w-3.5 h-3.5" strokeWidth={2.4} />
                </div>
                <span className="font-bold text-sm tracking-tight text-neutral-900 dark:text-neutral-100">BranchWatch</span>
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-relaxed">
                Developer-first Git visualization and node automation platform. Shipped as open source under the MIT License.
              </p>
              <div className="inline-flex items-center gap-1.5 text-[10px] font-mono px-2 py-0.5 rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700">
                <span>MIT Open Source</span>
              </div>
            </div>

            {/* Column 2: Product & Engine */}
            <div className="space-y-2.5">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider text-[10px]">
                Product
              </span>
              <ul className="space-y-2 text-neutral-500 dark:text-neutral-400 text-xs">
                <li>
                  <button onClick={() => handleOpenTabDirect('visual')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                    Visual Workflow Engine
                  </button>
                </li>
                <li>
                  <button onClick={() => handleOpenTabDirect('graph')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                    Git Commits Stack
                  </button>
                </li>
                <li>
                  <button onClick={() => handleOpenTabDirect('developer')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                    Dev Studio
                  </button>
                </li>
                <li>
                  <button onClick={() => handleOpenTabDirect('community')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                    Community Hub
                  </button>
                </li>
              </ul>
            </div>

            {/* Column 3: Developers & Ecosystem */}
            <div className="space-y-2.5">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider text-[10px]">
                Developers
              </span>
              <ul className="space-y-2 text-neutral-500 dark:text-neutral-400 text-xs">
                <li>
                  <button onClick={() => handleOpenTabDirect('docs')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                    Documentation Portal
                  </button>
                </li>
                <li>
                  <button onClick={() => handleOpenTabDirect('docs')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                    Zero-Config Porting Spec
                  </button>
                </li>
                <li>
                  <button onClick={() => handleOpenTabDirect('developer')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                    Schema v1 Validator
                  </button>
                </li>
                <li>
                  <a href="https://github.com/crycuros/Branchwatch" target="_blank" rel="noopener noreferrer" className="hover:text-neutral-900 dark:hover:text-white inline-flex items-center gap-1 transition-colors">
                    <span>GitHub Repository</span>
                    <ExternalLink className="w-3 h-3 text-neutral-400" />
                  </a>
                </li>
              </ul>
            </div>

            {/* Column 4: Legal & Security */}
            <div className="space-y-2.5">
              <span className="font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider text-[10px]">
                Legal & Governance
              </span>
              <ul className="space-y-2 text-neutral-500 dark:text-neutral-400 text-xs">
                <li>
                  <button onClick={() => openLegalDialog('terms')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                    Terms of Service
                  </button>
                </li>
                <li>
                  <button onClick={() => openLegalDialog('privacy')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                    Privacy Policy
                  </button>
                </li>
                <li>
                  <button onClick={() => openLegalDialog('security')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                    Security & Clearance Model
                  </button>
                </li>
                <li>
                  <button onClick={() => openLegalDialog('mit')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                    MIT License Terms
                  </button>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar: Status, Copyright & Legal Links */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>All Systems Operational (Local Engine v1.0.0-prod)</span>
            </div>

            <div className="flex items-center gap-4 text-[11px]">
              <span>© {new Date().getFullYear()} crycuros / Branchwatch</span>
              <button onClick={() => openLegalDialog('terms')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                Terms
              </button>
              <button onClick={() => openLegalDialog('privacy')} className="hover:text-neutral-900 dark:hover:text-white transition-colors">
                Privacy
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* 6. Production Legal & Security Center Modal */}
      {showLegalModal && mounted && typeof document !== 'undefined' &&
        createPortal(
          <div
            className="fixed inset-0 z-[99999] bg-black/70 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-150 font-sans"
            onClick={() => setShowLegalModal(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-2xl max-h-[85vh] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-900 bg-zinc-900/40">
                <div className="flex items-center gap-2.5">
                  <Shield className="w-4 h-4 text-zinc-300" />
                  <h3 className="font-semibold text-sm text-zinc-100">Legal, Governance & Security Center</h3>
                </div>
                <button
                  onClick={() => setShowLegalModal(false)}
                  className="p-1 rounded-lg text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Legal Tabs */}
              <div className="flex items-center px-6 border-b border-zinc-900 bg-zinc-950 text-xs font-medium">
                <button
                  onClick={() => setLegalTab('terms')}
                  className={`py-3 px-3 border-b-2 transition-colors ${
                    legalTab === 'terms'
                      ? 'border-zinc-200 text-zinc-100 font-semibold'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Terms of Service
                </button>
                <button
                  onClick={() => setLegalTab('privacy')}
                  className={`py-3 px-3 border-b-2 transition-colors ${
                    legalTab === 'privacy'
                      ? 'border-zinc-200 text-zinc-100 font-semibold'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Privacy Policy
                </button>
                <button
                  onClick={() => setLegalTab('security')}
                  className={`py-3 px-3 border-b-2 transition-colors ${
                    legalTab === 'security'
                      ? 'border-zinc-200 text-zinc-100 font-semibold'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  Security Clearance Model
                </button>
                <button
                  onClick={() => setLegalTab('mit')}
                  className={`py-3 px-3 border-b-2 transition-colors ${
                    legalTab === 'mit'
                      ? 'border-zinc-200 text-zinc-100 font-semibold'
                      : 'border-transparent text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  MIT License
                </button>
              </div>

              {/* Modal Content Body */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 text-xs text-zinc-300 leading-relaxed font-sans">
                {legalTab === 'terms' && (
                  <div className="space-y-3.5">
                    <h4 className="font-bold text-sm text-zinc-100">1. Terms of Service & Code Execution</h4>
                    <p>
                      BranchWatch is a developer-first platform for visual Git workflow automation and script execution. By using BranchWatch and its node execution engine, you agree to these terms:
                    </p>
                    <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80 space-y-2">
                      <div className="font-semibold text-zinc-100">Local Execution & Responsibility</div>
                      <p className="text-zinc-400 text-[11px]">
                        Custom nodes execute code directly on your local machine under your OS user account permissions. You are solely responsible for reviewing community manifests before granting execution clearance.
                      </p>
                    </div>
                    <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80 space-y-2">
                      <div className="font-semibold text-zinc-100">Zero Remote Push Guarantee</div>
                      <p className="text-zinc-400 text-[11px]">
                        BranchWatch will never execute destructive remote push commands (<code className="text-zinc-200 font-mono">git push --force</code>, <code className="text-zinc-200 font-mono">git push origin</code>) without explicit manual user approval.
                      </p>
                    </div>
                    <div className="p-3 bg-zinc-900/60 rounded-xl border border-zinc-800/80 space-y-2">
                      <div className="font-semibold text-zinc-100">Acceptable Use & Malicious Payloads</div>
                      <p className="text-zinc-400 text-[11px]">
                        Submitting malicious scripts, cryptominers, or destructive binaries to the open-source registry is strictly prohibited and results in immediate blocking.
                      </p>
                    </div>
                  </div>
                )}

                {legalTab === 'privacy' && (
                  <div className="space-y-3.5">
                    <h4 className="font-bold text-sm text-zinc-100">2. Privacy & Data Security Policy</h4>
                    <p>
                      BranchWatch operates under an offline-first, zero-telemetry philosophy.
                    </p>
                    <ul className="space-y-2 list-disc list-inside text-zinc-400 text-[11px]">
                      <li><strong className="text-zinc-200">Local-Only Data Storage:</strong> All branch graphs, commit histories, working tree diffs, and node configurations remain strictly on your local disk.</li>
                      <li><strong className="text-zinc-200">GitHub Token Security:</strong> Personal Access Tokens (PAT) and OAuth sessions are stored only in local browser client storage (<code className="font-mono text-zinc-300">localStorage</code>) and are sent solely to <code className="font-mono text-zinc-300">api.github.com</code>.</li>
                      <li><strong className="text-zinc-200">No Telemetry / Behavioral Tracking:</strong> BranchWatch does not bundle Google Analytics, Mixpanel, or third-party user tracking beacons.</li>
                      <li><strong className="text-zinc-200">Webhook Data Routing:</strong> Webhook nodes transmit payloads strictly to the remote endpoints explicitly configured by you.</li>
                    </ul>
                  </div>
                )}

                {legalTab === 'security' && (
                  <div className="space-y-3.5">
                    <h4 className="font-bold text-sm text-zinc-100">3. Security Clearance & Permission Architecture</h4>
                    <p>
                      To prevent unauthorized command execution from unvetted repositories, BranchWatch enforces an explicit capability security matrix:
                    </p>
                    <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
                      <div className="p-2.5 bg-zinc-900/80 rounded-lg border border-zinc-800">
                        <span className="text-amber-400 font-bold block mb-0.5">shell: true</span>
                        <span className="text-zinc-400">Allows spawning local sub-processes (PowerShell/sh).</span>
                      </div>
                      <div className="p-2.5 bg-zinc-900/80 rounded-lg border border-zinc-800">
                        <span className="text-blue-400 font-bold block mb-0.5">filesystem: "workspace"</span>
                        <span className="text-zinc-400">Restricts file modifications to active repository root.</span>
                      </div>
                      <div className="p-2.5 bg-zinc-900/80 rounded-lg border border-zinc-800">
                        <span className="text-purple-400 font-bold block mb-0.5">network: true</span>
                        <span className="text-zinc-400">Allows outbound HTTP/REST webhook requests.</span>
                      </div>
                      <div className="p-2.5 bg-zinc-900/80 rounded-lg border border-zinc-800">
                        <span className="text-emerald-400 font-bold block mb-0.5">git: true</span>
                        <span className="text-zinc-400">Allows inspecting and mutating local Git refs.</span>
                      </div>
                    </div>
                  </div>
                )}

                {legalTab === 'mit' && (
                  <div className="space-y-3 font-mono text-[11px]">
                    <h4 className="font-bold text-sm font-sans text-zinc-100">4. MIT License</h4>
                    <pre className="p-3 bg-zinc-900/80 rounded-xl border border-zinc-800 text-zinc-300 whitespace-pre-wrap leading-relaxed">
{`Copyright (c) 2026 crycuros / Branchwatch

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.`}
                    </pre>
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-900 bg-zinc-900/40">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowLegalModal(false);
                    handleOpenTabDirect('docs');
                  }}
                  className="text-xs"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Open Full Documentation</span>
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setShowLegalModal(false)}
                  className="text-xs font-semibold"
                >
                  <span>Close</span>
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* 7. Auth Modal */}
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
                    className="w-full py-2.5 font-semibold"
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

                  <Button variant="primary" type="submit" className="w-full py-2.5 font-semibold">
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
