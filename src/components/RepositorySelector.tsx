import React, { useState } from 'react';
import { Repository } from '@/lib/types';
import { Search, FolderGit2, GitBranch, GitCommit, ExternalLink, Plus } from 'lucide-react';
import { Button } from './ui/Button';

interface RepositorySelectorProps {
  repositories: Repository[];
  selectedRepo: Repository | null;
  onSelectRepo: (repo: Repository) => void;
  onFetchCustomRepo: (ownerRepo: string) => void;
}

export const RepositorySelector: React.FC<RepositorySelectorProps> = ({
  repositories,
  selectedRepo,
  onSelectRepo,
  onFetchCustomRepo,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const filteredRepos = repositories.filter(
    (r) =>
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (customInput.trim()) {
      onFetchCustomRepo(customInput.trim());
      setCustomInput('');
      setShowCustomInput(false);
    }
  };

  const handlePickLocalFolder = async () => {
    try {
      if ('showDirectoryPicker' in window) {
        // @ts-ignore
        const dirHandle = await window.showDirectoryPicker();
        const localRepo: Repository = {
          id: Date.now(),
          name: dirHandle.name,
          full_name: `local/${dirHandle.name}`,
          owner: {
            login: 'Local Computer',
            avatar_url: 'https://github.com/github.png',
          },
          private: true,
          description: `Local project directory loaded directly from PC`,
          html_url: '#',
          stargazers_count: 0,
          forks_count: 0,
          open_issues_count: 0,
          updated_at: new Date().toISOString(),
          default_branch: 'main',
          branches_count: 1,
          commits_count: 12,
        };
        onSelectRepo(localRepo);
      } else if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    } catch (err) {
      if (fileInputRef.current) {
        fileInputRef.current.click();
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const firstFile = files[0];
      const relPath = firstFile.webkitRelativePath || firstFile.name;
      const folderName = relPath.split('/')[0] || 'Local Project';

      const localRepo: Repository = {
        id: Date.now(),
        name: folderName,
        full_name: `local/${folderName}`,
        owner: {
          login: 'Local Computer',
          avatar_url: 'https://github.com/github.png',
        },
        private: true,
        description: `Local project scanned (${files.length} project files)`,
        html_url: '#',
        stargazers_count: 0,
        forks_count: 0,
        open_issues_count: 0,
        updated_at: new Date().toISOString(),
        default_branch: 'main',
        branches_count: 1,
        commits_count: files.length,
      };
      onSelectRepo(localRepo);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-4">
      {/* Title section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            Select a repository
          </h1>
          <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
            Choose a repository to monitor branch activity, commits, and comparisons.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Hidden Universal HTML5 Directory Input Fallback */}
          <input
            type="file"
            ref={fileInputRef}
            // @ts-ignore
            webkitdirectory=""
            directory=""
            className="hidden"
            onChange={handleFileInputChange}
          />

          <Button
            variant="outline"
            size="sm"
            onClick={handlePickLocalFolder}
          >
            <FolderGit2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Open Local Folder</span>
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCustomInput(!showCustomInput)}
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Explore Public Repo</span>
          </Button>
        </div>
      </div>

      {/* Custom Repo Input Form */}
      {showCustomInput && (
        <form onSubmit={handleCustomSubmit} className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-100/60 dark:bg-neutral-800/40 flex items-center gap-3">
          <input
            type="text"
            placeholder="e.g. facebook/react or tailwindlabs/tailwindcss"
            value={customInput}
            onChange={(e) => setCustomInput(e.target.value)}
            className="flex-1 px-3.5 py-2 rounded-lg text-sm bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400"
          />
          <Button variant="primary" type="submit" size="sm">
            Load Repo
          </Button>
        </form>
      )}

      {/* Search Input */}
      <div className="relative">
        <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          placeholder="Search repositories..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-white dark:bg-neutral-900 border border-neutral-200/80 dark:border-neutral-800 focus:outline-none focus:ring-2 focus:ring-neutral-400 dark:focus:ring-neutral-600 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 shadow-subtle"
        />
      </div>

      {/* Repositories List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredRepos.map((repo) => {
          const isSelected = selectedRepo?.id === repo.id;
          return (
            <div
              key={repo.id}
              onClick={() => onSelectRepo(repo)}
              className={`p-5 rounded-2xl border transition-all duration-200 cursor-pointer select-none group flex flex-col justify-between ${
                isSelected
                  ? 'border-neutral-900 bg-neutral-900 text-white dark:border-white dark:bg-white dark:text-neutral-900 shadow-apple'
                  : 'border-neutral-200/70 dark:border-neutral-800/80 bg-white dark:bg-neutral-900/60 hover:border-neutral-300 dark:hover:border-neutral-700 hover:shadow-subtle'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-base tracking-tight truncate max-w-[200px]">
                    {repo.name}
                  </h3>
                  {repo.private ? (
                    <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400">
                      Private
                    </span>
                  ) : (
                    <ExternalLink className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${isSelected ? 'text-white dark:text-neutral-900' : 'text-neutral-400'}`} />
                  )}
                </div>

                <div className={`text-xs font-mono mt-0.5 ${isSelected ? 'text-neutral-300 dark:text-neutral-600' : 'text-neutral-500'}`}>
                  {repo.full_name}
                </div>

                {repo.description && (
                  <p className={`text-xs mt-2.5 line-clamp-2 ${isSelected ? 'text-neutral-200 dark:text-neutral-700' : 'text-neutral-600 dark:text-neutral-400'}`}>
                    {repo.description}
                  </p>
                )}
              </div>

              <div className={`flex items-center gap-4 text-xs font-medium mt-4 pt-3 border-t ${isSelected ? 'border-neutral-800 dark:border-neutral-200 text-neutral-200 dark:text-neutral-700' : 'border-neutral-100 dark:border-neutral-800/60 text-neutral-500 dark:text-neutral-400'}`}>
                <div className="flex items-center gap-1.5">
                  <GitBranch className="w-3.5 h-3.5" />
                  <span>{repo.branches_count ?? 0} {repo.branches_count === 1 ? 'branch' : 'branches'}</span>
                </div>
                <span>·</span>
                <div className="flex items-center gap-1.5">
                  <GitCommit className="w-3.5 h-3.5" />
                  <span>{repo.commits_count ?? 0} {repo.commits_count === 1 ? 'commit' : 'commits'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredRepos.length === 0 && (
        <div className="text-center py-12 text-neutral-500 text-sm">
          No repositories found matching &ldquo;{searchQuery}&rdquo;.
        </div>
      )}
    </div>
  );
};
