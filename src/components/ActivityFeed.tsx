import React from 'react';
import { ActivityItem } from '@/lib/types';
import { Activity, GitCommit, GitBranch, Calendar } from 'lucide-react';

interface ActivityFeedProps {
  activities: ActivityItem[];
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ activities }) => {
  const [selectedDayFilter, setSelectedDayFilter] = React.useState<string | null>(null);

  // Dynamically compute Weekly Commit Activity distribution from real activities
  const daysMap: Record<string, number> = { Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0 };
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  activities.forEach((act) => {
    if (act.timestamp) {
      const d = new Date(act.timestamp);
      const dayName = dayNames[d.getDay()];
      if (daysMap[dayName] !== undefined) {
        daysMap[dayName] += 1;
      }
    }
  });

  const maxCommits = Math.max(0, ...Object.values(daysMap));
  const mostActiveDay = Object.keys(daysMap).reduce((a, b) => (daysMap[a] >= daysMap[b] ? a : b), 'Thu');

  const uniqueBranches = Array.from(new Set(activities.map((a) => a.branch).filter(Boolean)));
  const uniqueAuthors = Array.from(new Set(activities.map((a) => a.author?.name).filter(Boolean)));

  const weeklyStats = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => {
    const count = daysMap[day] || 0;
    const pct = maxCommits > 0 ? (count / maxCommits) * 100 : 0;
    let heightClass = 'h-2.5';
    if (pct > 75) heightClass = 'h-14';
    else if (pct > 50) heightClass = 'h-10';
    else if (pct > 25) heightClass = 'h-6';
    else if (count > 0) heightClass = 'h-4';

    return {
      day,
      commits: count,
      height: heightClass,
    };
  });

  const filteredActivities = selectedDayFilter
    ? activities.filter((act) => {
        if (!act.timestamp) return false;
        const d = new Date(act.timestamp);
        return dayNames[d.getDay()] === selectedDayFilter;
      })
    : activities;

  const formatTime = (isoStr: string) => {
    const diffMs = Date.now() - new Date(isoStr).getTime();
    if (diffMs < 0) return 'Just now';
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const mins = totalMinutes % 60;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (totalMinutes < 1) return 'Just now';
    if (totalMinutes < 60) return `${totalMinutes}m ago`;
    if (hours < 24) {
      return mins > 0 ? `${hours}h ${mins}m ago` : `${hours}h ago`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays}d ago`;
    return new Date(isoStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto py-2">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100 flex items-center gap-2.5">
          <Activity className="w-6 h-6 stroke-[2]" />
          <span>Activity</span>
        </h1>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Repository-wide chronological commit events and weekly frequency summary.
        </p>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl apple-glass-card space-y-1 apple-interactive">
          <div className="text-xs font-medium text-neutral-500 flex items-center justify-between">
            <span>Total Events</span>
            <Activity className="w-3.5 h-3.5 text-blue-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {activities.length}
          </div>
          <div className="text-[11px] text-neutral-400">
            {activities.length === 1 ? '1 activity event recorded' : `${activities.length} total events recorded`}
          </div>
        </div>

        <div className="p-5 rounded-2xl apple-glass-card space-y-1 apple-interactive">
          <div className="text-xs font-medium text-neutral-500 flex items-center justify-between">
            <span>Peak Activity Day</span>
            <Calendar className="w-3.5 h-3.5 text-emerald-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {maxCommits > 0 ? mostActiveDay : 'None'}
          </div>
          <div className="text-[11px] text-neutral-400">
            {maxCommits > 0 ? `${maxCommits} ${maxCommits === 1 ? 'event' : 'events'} on peak day` : 'No events logged this week'}
          </div>
        </div>

        <div className="p-5 rounded-2xl apple-glass-card space-y-1 apple-interactive">
          <div className="text-xs font-medium text-neutral-500 flex items-center justify-between">
            <span>Branches Touched</span>
            <GitBranch className="w-3.5 h-3.5 text-purple-500" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-neutral-900 dark:text-neutral-100">
            {uniqueBranches.length}
          </div>
          <div className="text-[11px] text-neutral-400 truncate">
            {uniqueBranches.length > 0 ? uniqueBranches.join(', ') : 'No branch activity'}
          </div>
        </div>
      </div>

      {/* Lightweight Commit Activity Graph */}
      <div className="p-6 rounded-2xl apple-glass-card space-y-4">
        <div className="flex items-center justify-between text-xs text-neutral-500 font-medium">
          <div className="flex items-center gap-2">
            <span>Weekly Commit Activity</span>
            {selectedDayFilter && (
              <button
                onClick={() => setSelectedDayFilter(null)}
                className="text-[10px] bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
              >
                Filtered: {selectedDayFilter} (Clear) ✕
              </button>
            )}
          </div>
          <span className="font-mono">
            {activities.length} {activities.length === 1 ? 'activity event' : 'activity events'}
          </span>
        </div>

        <div className="h-28 flex items-end justify-between gap-3 pt-6 border-t border-black/[0.05] dark:border-white/[0.05] px-4">
          {weeklyStats.map((stat) => {
            const isSelected = selectedDayFilter === stat.day;
            return (
              <div
                key={stat.day}
                onClick={() => setSelectedDayFilter(isSelected ? null : stat.day)}
                className="flex-1 flex flex-col items-center gap-2 group cursor-pointer relative"
              >
                {/* Hover Tooltip Badge */}
                <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-[10px] font-mono px-2 py-0.5 rounded-md shadow-md whitespace-nowrap z-20">
                  {stat.commits} {stat.commits === 1 ? 'event' : 'events'} on {stat.day}
                </div>

                <div className="w-full flex justify-center items-end h-16">
                  <div
                    className={`w-full max-w-[32px] rounded-t-md transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                      isSelected
                        ? 'bg-blue-500 ring-2 ring-blue-400/50 scale-105'
                        : 'bg-neutral-900 dark:bg-neutral-100 group-hover:bg-blue-600 dark:group-hover:bg-blue-400'
                    } ${stat.height}`}
                  />
                </div>
                <span className={`text-[11px] font-mono transition-colors ${
                  isSelected
                    ? 'text-blue-500 font-bold'
                    : 'text-neutral-400 group-hover:text-neutral-900 dark:group-hover:text-white'
                }`}>
                  {stat.day}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Activity Timeline List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold tracking-wider text-neutral-400 uppercase">
            Recent Events {selectedDayFilter ? `(${selectedDayFilter} Only)` : ''}
          </h3>
          <span className="text-xs text-neutral-500 font-mono">
            {filteredActivities.length} {filteredActivities.length === 1 ? 'event' : 'events'}
          </span>
        </div>

        <div className="space-y-3">
          {filteredActivities.map((act) => (
            <div
              key={act.id}
              className="p-4 rounded-xl apple-glass-card flex items-start justify-between gap-4 apple-interactive"
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-black/[0.04] dark:bg-white/[0.06] flex items-center justify-center text-neutral-600 dark:text-neutral-300 flex-shrink-0 mt-0.5 border border-black/[0.06] dark:border-white/[0.08]">
                  <GitCommit className="w-4 h-4" />
                </div>

                <div className="space-y-1">
                  <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">
                    {act.message}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-neutral-500">
                    <span className="font-semibold text-neutral-700 dark:text-neutral-300">{act.author.name}</span>
                    <span>on</span>
                    <span className="font-mono text-neutral-800 dark:text-neutral-200 bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 rounded-md border border-black/[0.04] dark:border-white/[0.06]">
                      {act.branch}
                    </span>
                  </div>
                </div>
              </div>

              <div
                title={act.timestamp ? new Date(act.timestamp).toLocaleString() : undefined}
                className="text-xs font-mono text-neutral-400 flex-shrink-0 cursor-help"
              >
                {formatTime(act.timestamp)}
              </div>
            </div>
          ))}

          {filteredActivities.length === 0 && (
            <div className="p-8 text-center text-sm text-neutral-500 bg-white dark:bg-neutral-900/40 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50">
              No activity events found for {selectedDayFilter || 'this period'}.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
