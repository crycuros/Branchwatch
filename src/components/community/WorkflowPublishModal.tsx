import React, { useState } from 'react';
import { WorkflowNode, NodeConnection } from '@/lib/workflowTypes';
import { WorkflowCategory, WorkflowVisibility, WorkflowAuthor } from '@/lib/communityTypes';
import { sanitizeWorkflowForPublishing, publishCommunityWorkflow } from '@/lib/communityStorage';
import { X, Globe, Lock, EyeOff, ShieldCheck, Check, Copy, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface WorkflowPublishModalProps {
  isOpen: boolean;
  onClose: () => void;
  nodes: WorkflowNode[];
  connections: NodeConnection[];
  currentBranchName: string;
  authUser?: { login: string; name?: string; avatar_url?: string } | null;
  onPublishSuccess: (workflowId: string) => void;
}

export const WorkflowPublishModal: React.FC<WorkflowPublishModalProps> = ({
  isOpen,
  onClose,
  nodes,
  connections,
  currentBranchName,
  authUser,
  onPublishSuccess,
}) => {
  const [title, setTitle] = useState(
    currentBranchName ? `${currentBranchName.replace(/[/_-]/g, ' ')} Workflow` : 'My Git Workflow'
  );
  const [description, setDescription] = useState(
    'A visual Git workflow created with BranchWatch for safe repository staging and execution.'
  );
  const [category, setCategory] = useState<WorkflowCategory>('feature');
  const [visibility, setVisibility] = useState<WorkflowVisibility>('public');
  const [tagsInput, setTagsInput] = useState('git-flow, best-practices');
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim().toLowerCase().replace(/[^a-z0-9_-]/g, ''))
      .filter(Boolean);

    const author: WorkflowAuthor = {
      login: authUser?.login || 'developer',
      name: authUser?.name || 'BranchWatch Engineer',
      avatar_url: authUser?.avatar_url,
    };

    const payload = sanitizeWorkflowForPublishing(title, description, nodes, connections, author, category, visibility, tags);

    setIsPublishing(true);
    setPublishError(null);
    try {
      const published = await publishCommunityWorkflow(payload);
      const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/?tab=community&workflow=${published.id}`;
      setPublishedUrl(shareUrl);
      onPublishSuccess(published.id);
    } catch (err) {
      console.error('Failed to publish workflow:', err);
      setPublishError('Failed to publish workflow. Please try again.');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyLink = () => {
    if (!publishedUrl) return;
    navigator.clipboard.writeText(publishedUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 dark:bg-black/75 backdrop-blur-md animate-fade-in font-sans">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 shadow-2xl p-6 space-y-5 animate-apple-modal"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-neutral-900 dark:bg-white flex items-center justify-center text-white dark:text-neutral-900">
              <Globe className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
                Publish Workflow to Community
              </h3>
              <p className="text-[11px] text-neutral-500">
                Share your Git graph recipe with developers worldwide
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {publishedUrl ? (
          /* Success Screen */
          <div className="space-y-4 py-2 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-500 mx-auto flex items-center justify-center border border-emerald-500/20">
              <Check className="w-6 h-6" />
            </div>
            <div>
              <h4 className="font-bold text-base text-neutral-900 dark:text-neutral-100">
                Workflow Published!
              </h4>
              <p className="text-xs text-neutral-500 mt-1 max-w-xs mx-auto">
                Your workflow is now live. Anyone can view, fork, or study your Git pipeline.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200/60 dark:border-neutral-700/60 flex items-center justify-between gap-2 text-xs font-mono text-neutral-600 dark:text-neutral-300">
              <span className="truncate">{publishedUrl}</span>
              <button
                onClick={handleCopyLink}
                className="p-1.5 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-300 transition-colors flex items-center gap-1 flex-shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="font-sans text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            <div className="pt-2">
              <Button variant="primary" size="md" className="w-full" onClick={onClose}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          /* Form Screen */
          <form onSubmit={handlePublish} className="space-y-4 text-xs">
            {/* Title */}
            <div className="space-y-1">
              <label className="block font-medium text-neutral-700 dark:text-neutral-300">
                Workflow Title
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Feature Branch Workflow"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 font-medium"
              />
            </div>

            {/* Description */}
            <div className="space-y-1">
              <label className="block font-medium text-neutral-700 dark:text-neutral-300">
                Description & Purpose
              </label>
              <textarea
                rows={2}
                placeholder="What does this workflow accomplish?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 resize-none"
              />
            </div>

            {/* Category & Visibility */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block font-medium text-neutral-700 dark:text-neutral-300">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as WorkflowCategory)}
                  aria-label="Workflow Category"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 font-mono text-xs"
                >
                  <option value="enterprise">Big Tech & Enterprise</option>
                  <option value="startup">Startup & Agile Teams</option>
                  <option value="casual">Casual & Solo Devs</option>
                  <option value="opensource">Open Source PR</option>
                  <option value="hotfix">Emergency Hotfix</option>
                  <option value="monorepo">Monorepo</option>
                  <option value="basics">Git Basics</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="block font-medium text-neutral-700 dark:text-neutral-300">
                  Visibility
                </label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as WorkflowVisibility)}
                  aria-label="Workflow Visibility"
                  className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 font-mono text-xs"
                >
                  <option value="public">Public (Discoverable)</option>
                  <option value="unlisted">Unlisted (Link Only)</option>
                  <option value="private">Private (Only You)</option>
                </select>
              </div>
            </div>

            {/* Tags */}
            <div className="space-y-1">
              <label className="block font-medium text-neutral-700 dark:text-neutral-300">
                Tags (comma separated)
              </label>
              <input
                type="text"
                placeholder="git-flow, hotfix, pull-request"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 font-mono text-xs"
              />
            </div>

            {/* Security Guarantee Note */}
            <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-700/60 flex items-start gap-2 text-neutral-500">
              <ShieldCheck className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
              <div className="text-[11px] leading-relaxed">
                <strong className="text-neutral-700 dark:text-neutral-300 font-semibold">Security Sanitized:</strong> All tokens, credentials, and repository secrets are strictly stripped before saving. Only node graphs and commands are published.
              </div>
            </div>

            {/* Error Message */}
            {publishError && (
              <div className="px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800/50 text-xs text-red-600 dark:text-red-400">
                {publishError}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
              <Button variant="ghost" size="sm" type="button" onClick={onClose} disabled={isPublishing}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" disabled={!title.trim() || isPublishing}>
                {isPublishing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                <span>{isPublishing ? 'Publishing...' : 'Publish Workflow'}</span>
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
