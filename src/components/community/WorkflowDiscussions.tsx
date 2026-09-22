import React, { useState, useEffect } from 'react';
import { CommunityWorkflow } from '@/lib/communityTypes';
import { getWorkflowComments, addWorkflowComment, DBComment } from '@/lib/communityStorage';
import { MessageSquare, X, Send, User, Loader2 } from 'lucide-react';
import { Button } from '../ui/Button';

interface WorkflowDiscussionsProps {
  workflow: CommunityWorkflow | null;
  onClose: () => void;
  authUser?: { login: string; name?: string; avatar_url?: string } | null;
}

export const WorkflowDiscussions: React.FC<WorkflowDiscussionsProps> = ({
  workflow,
  onClose,
  authUser,
}) => {
  const [comments, setComments] = useState<DBComment[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPosting, setIsPosting] = useState(false);

  useEffect(() => {
    if (!workflow) return;
    setIsLoading(true);
    getWorkflowComments(workflow.id)
      .then(setComments)
      .catch(() => setComments([]))
      .finally(() => setIsLoading(false));
  }, [workflow]);

  if (!workflow) return null;

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim() || !authUser) return;

    setIsPosting(true);
    try {
      const added = await addWorkflowComment(workflow.id, newCommentText.trim());
      setComments((prev) => [...prev, added]);
      setNewCommentText('');
    } catch (err) {
      console.error('Failed to post comment:', err);
    } finally {
      setIsPosting(false);
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/40 backdrop-blur-xs animate-fade-in font-sans">
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md h-full bg-white dark:bg-neutral-900 border-l border-neutral-200 dark:border-neutral-800 shadow-2xl flex flex-col justify-between animate-slide-in-right"
      >
        {/* Header */}
        <div className="p-4 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-neutral-500" />
            <h3 className="font-bold text-sm text-neutral-900 dark:text-neutral-100">
              Technical Discussion
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Workflow Context Subheader */}
        <div className="px-4 py-2.5 bg-neutral-50 dark:bg-neutral-800/40 border-b border-neutral-200/60 dark:border-neutral-800 text-xs">
          <div className="font-semibold text-neutral-900 dark:text-neutral-100 truncate">
            {workflow.title}
          </div>
          <div className="text-[11px] text-neutral-500 font-mono mt-0.5">
            by @{workflow.author.login}
          </div>
        </div>

        {/* Comments Feed */}
        <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs no-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-neutral-400 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Loading discussions...</span>
            </div>
          ) : comments.length > 0 ? (
            comments.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-xl border border-neutral-200/80 dark:border-neutral-800 bg-neutral-50/50 dark:bg-neutral-800/20 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {c.userAvatar ? (
                      <img
                        src={c.userAvatar}
                        alt={c.userName}
                        className="w-5 h-5 rounded-full border border-neutral-200 dark:border-neutral-700"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center text-[10px]">
                        <User className="w-3 h-3 text-neutral-400" />
                      </div>
                    )}
                    <span className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {c.userName}
                    </span>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      @{c.userLogin}
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    {formatTime(c.createdAt)}
                  </span>
                </div>
                <p className="text-xs text-neutral-700 dark:text-neutral-300 leading-relaxed whitespace-pre-wrap">
                  {c.body}
                </p>
              </div>
            ))
          ) : (
            <div className="text-center py-16 text-neutral-400 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto opacity-40" />
              <div className="text-xs font-medium">No discussions yet</div>
              <p className="text-[11px] text-neutral-500 max-w-xs mx-auto">
                Ask a question about this Git topology or share an optimization tip.
              </p>
            </div>
          )}
        </div>

        {/* Input Footer */}
        <form
          onSubmit={handlePostComment}
          className="p-4 border-t border-neutral-200/80 dark:border-neutral-800 bg-white dark:bg-neutral-900 space-y-2"
        >
          <textarea
            rows={2}
            placeholder={authUser ? 'Comment or ask about this Git flow...' : 'Connect your GitHub account to post comments'}
            value={newCommentText}
            onChange={(e) => setNewCommentText(e.target.value)}
            disabled={!authUser}
            className="w-full px-3 py-2 rounded-xl bg-neutral-50 dark:bg-neutral-800/60 border border-neutral-200 dark:border-neutral-700 text-xs text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-1 focus:ring-neutral-400 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-neutral-400 font-mono">
              {authUser ? `Posting as @${authUser.login}` : 'Not signed in'}
            </span>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              disabled={!newCommentText.trim() || !authUser || isPosting}
              className="text-xs"
            >
              {isPosting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Send className="w-3 h-3" />}
              <span>Post</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
