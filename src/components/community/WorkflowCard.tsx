import React from 'react';
import { CommunityWorkflow } from '@/lib/communityTypes';
import {
  Star,
  GitFork,
  ArrowRight,
  MessageSquare,
  Sparkles,
  Layers,
  FolderGit2,
  FileCode,
  GitCommit,
  GitBranch,
  Upload,
  Download,
} from 'lucide-react';
import { Button } from '../ui/Button';

interface WorkflowCardProps {
  workflow: CommunityWorkflow;
  isStarred: boolean;
  onStarToggle: (id: string) => void;
  onOpenWorkflow: (workflow: CommunityWorkflow) => void;
  onForkWorkflow: (workflow: CommunityWorkflow) => void;
  onOpenComments?: (workflow: CommunityWorkflow) => void;
}

export const WorkflowCard: React.FC<WorkflowCardProps> = ({
  workflow,
  isStarred,
  onStarToggle,
  onOpenWorkflow,
  onForkWorkflow,
  onOpenComments,
}) => {
  const getNodeIcon = (type: string) => {
    switch (type) {
      case 'working_tree':
        return FolderGit2;
      case 'stage':
        return FileCode;
      case 'commit':
        return GitCommit;
      case 'branch':
        return GitBranch;
      case 'push':
        return Upload;
      case 'pull':
        return Download;
      default:
        return Layers;
    }
  };

  return (
    <div className="group rounded-2xl border border-neutral-200/80 dark:border-neutral-800 bg-white/70 dark:bg-neutral-900/60 backdrop-blur-md p-5 flex flex-col justify-between hover:border-neutral-300 dark:hover:border-neutral-700 transition-all duration-200 shadow-subtle hover:shadow-apple dark:hover:shadow-apple-dark">
      {/* Top Header */}
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            {workflow.author.avatar_url ? (
              <img
                src={workflow.author.avatar_url}
                alt={workflow.author.name}
                className="w-6 h-6 rounded-full border border-neutral-200 dark:border-neutral-700 flex-shrink-0"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-800 flex items-center justify-center text-[10px] font-bold text-neutral-600 dark:text-neutral-300 flex-shrink-0">
                {workflow.author.name.charAt(0)}
              </div>
            )}
            <div className="truncate">
              <span className="text-xs text-neutral-500 font-medium">
                @{workflow.author.login}
              </span>
            </div>
            {workflow.isFeatured && (
              <span className="inline-flex items-center gap-1 text-[10px] font-medium text-neutral-800 dark:text-neutral-200 bg-neutral-100 dark:bg-neutral-800 px-2 py-0.5 rounded-full border border-neutral-200/80 dark:border-neutral-700/80">
                <Sparkles className="w-2.5 h-2.5 text-neutral-400" /> Featured
              </span>
            )}
          </div>

          {/* Star Button */}
          <button
            onClick={() => onStarToggle(workflow.id)}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-mono transition-colors ${
              isStarred
                ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 border border-neutral-900 dark:border-white font-semibold shadow-xs'
                : 'bg-neutral-100 dark:bg-neutral-800/80 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white border border-neutral-200/60 dark:border-neutral-700/60'
            }`}
            title={isStarred ? 'Unstar workflow' : 'Star workflow'}
          >
            <Star className={`w-3 h-3 ${isStarred ? 'fill-current' : ''}`} />
            <span>{workflow.starsCount}</span>
          </button>
        </div>

        {/* Title & Description */}
        <div>
          <h3 className="text-base font-bold text-neutral-900 dark:text-neutral-100 tracking-tight group-hover:text-neutral-800 dark:group-hover:text-white transition-colors">
            {workflow.title}
          </h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
            {workflow.description}
          </p>
        </div>

        {/* Mini Visual Pipeline Preview Strip */}
        <div className="p-2.5 rounded-xl bg-neutral-50 dark:bg-neutral-950/60 border border-neutral-100 dark:border-neutral-800/80 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-neutral-700 dark:text-neutral-300 min-w-max">
            {workflow.nodes.slice(0, 5).map((node, i) => {
              const Icon = getNodeIcon(node.type);
              return (
                <React.Fragment key={node.id}>
                  <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 shadow-xs">
                    <Icon className="w-3 h-3 text-neutral-500" />
                    <span>{node.title}</span>
                  </div>
                  {i < Math.min(workflow.nodes.length, 5) - 1 && (
                    <span className="text-neutral-400 select-none">→</span>
                  )}
                </React.Fragment>
              );
            })}
            {workflow.nodes.length > 5 && (
              <span className="text-[10px] text-neutral-400 ml-1">
                +{workflow.nodes.length - 5} more
              </span>
            )}
          </div>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
            {workflow.version}
          </span>
          {workflow.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-neutral-100/70 dark:bg-neutral-800/40 text-neutral-500 dark:text-neutral-400"
            >
              #{tag}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Metrics & Action Buttons */}
      <div className="pt-4 mt-4 border-t border-neutral-100 dark:border-neutral-800/80 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3 text-xs text-neutral-500 font-mono">
          <span className="flex items-center gap-1" title="Forks">
            <GitFork className="w-3.5 h-3.5" />
            {workflow.forksCount}
          </span>
          {onOpenComments && (
            <button
              onClick={() => onOpenComments(workflow)}
              className="flex items-center gap-1 hover:text-neutral-900 dark:hover:text-white transition-colors"
              title="Discussions"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              {workflow.comments?.length || 0}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onForkWorkflow(workflow)}
            className="text-xs"
          >
            <GitFork className="w-3 h-3" />
            <span>Fork</span>
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => onOpenWorkflow(workflow)}
            className="text-xs"
          >
            <span>Open</span>
            <ArrowRight className="w-3 h-3" />
          </Button>
        </div>
      </div>
    </div>
  );
};
