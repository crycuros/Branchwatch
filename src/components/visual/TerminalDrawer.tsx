import React, { useState, useRef, useEffect } from 'react';
import {
  Terminal,
  ChevronDown,
  ChevronUp,
  X,
  Copy,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Globe,
  Radio,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { WorkflowExecutionEvent } from '@/lib/workflowTypes';

interface TerminalDrawerProps {
  isOpen: boolean;
  onToggle: () => void;
  events: WorkflowExecutionEvent[];
  onClear: () => void;
  isExecuting: boolean;
}

export const TerminalDrawer: React.FC<TerminalDrawerProps> = ({
  isOpen,
  onToggle,
  events,
  onClear,
  isExecuting,
}) => {
  const [selectedNodeFilter, setSelectedNodeFilter] = useState<string>('all');
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new events
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [events]);

  const distinctNodes = Array.from(
    new Set(events.map((e) => JSON.stringify({ id: e.nodeId, title: e.nodeTitle })))
  ).map((str) => JSON.parse(str) as { id: string; title: string });

  const filteredEvents = selectedNodeFilter === 'all'
    ? events
    : events.filter((e) => e.nodeId === selectedNodeFilter);

  const handleCopyLogs = () => {
    const rawText = filteredEvents
      .map((e) => `[${new Date(e.timestamp).toLocaleTimeString()}] [${e.nodeTitle}] ${e.data}`)
      .join('\n');
    navigator.clipboard.writeText(rawText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) {
    return (
      <div className="absolute bottom-4 right-4 z-30">
        <button
          onClick={onToggle}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-xs font-mono text-zinc-300 border border-zinc-800 shadow-xl backdrop-blur transition-all"
        >
          <Terminal className="w-3.5 h-3.5 text-zinc-400" />
          <span>Console & Output</span>
          {isExecuting && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          )}
          {events.length > 0 && (
            <span className="px-1.5 py-0.2 rounded bg-zinc-800 text-[10px] text-zinc-400">
              {events.length}
            </span>
          )}
        </button>
      </div>
    );
  }

  return (
    <div
      className={`absolute bottom-0 left-0 right-0 z-30 bg-zinc-950/95 border-t border-zinc-800 backdrop-blur-md flex flex-col transition-all duration-200 shadow-2xl ${
        isExpanded ? 'h-[75vh]' : 'h-64'
      }`}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800/80 bg-zinc-900/40 select-none">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-300">
            <Terminal className="w-3.5 h-3.5 text-zinc-400" />
            <span className="font-semibold">Terminal Output & Execution Stream</span>
          </div>

          {isExecuting ? (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-mono text-emerald-400">
              <Radio className="w-3 h-3 animate-pulse" />
              <span>Running pipeline...</span>
            </div>
          ) : (
            <span className="text-[10px] text-zinc-500 font-mono">Idle</span>
          )}

          {/* Node Tabs */}
          {distinctNodes.length > 1 && (
            <div className="flex items-center gap-1 ml-2 border-l border-zinc-800 pl-3">
              <button
                onClick={() => setSelectedNodeFilter('all')}
                className={`px-2 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  selectedNodeFilter === 'all'
                    ? 'bg-zinc-800 text-zinc-200 font-medium'
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                All Steps
              </button>
              {distinctNodes.map((n) => (
                <button
                  key={n.id}
                  onClick={() => setSelectedNodeFilter(n.id)}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono truncate max-w-[120px] transition-colors ${
                    selectedNodeFilter === n.id
                      ? 'bg-zinc-800 text-zinc-200 font-medium'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                  title={n.title}
                >
                  {n.title}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 text-zinc-400">
          <button
            onClick={handleCopyLogs}
            className="p-1.5 rounded hover:bg-zinc-800 hover:text-zinc-200 text-xs flex items-center gap-1 transition-colors"
            title="Copy Logs"
          >
            <Copy className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono">{copied ? 'Copied' : 'Copy'}</span>
          </button>
          <button
            onClick={onClear}
            className="p-1.5 rounded hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            title="Clear Console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 rounded hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            title={isExpanded ? 'Minimize' : 'Maximize'}
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onToggle}
            className="p-1.5 rounded hover:bg-zinc-800 hover:text-zinc-200 transition-colors"
            title="Close Drawer"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal Content Stream */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-xs text-zinc-300 space-y-1 bg-zinc-950/80 select-text"
      >
        {filteredEvents.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-xs py-12">
            <Terminal className="w-6 h-6 mb-2 opacity-40" />
            <p>No execution logs yet. Run a workflow or test a script to stream output.</p>
          </div>
        ) : (
          filteredEvents.map((event, idx) => {
            const timeStr = new Date(event.timestamp).toLocaleTimeString();

            if (event.type === 'start') {
              return (
                <div
                  key={idx}
                  className="py-1 px-2 my-1 rounded bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between text-zinc-300"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-[10px]">{timeStr}</span>
                    <span className="text-emerald-400 font-semibold">▶</span>
                    <span className="font-semibold text-zinc-200">{event.nodeTitle}</span>
                    <span className="text-zinc-500">{event.data}</span>
                  </div>
                </div>
              );
            }

            if (event.type === 'http_response') {
              return (
                <div
                  key={idx}
                  className="p-2 my-1 rounded bg-blue-950/20 border border-blue-900/40 text-blue-200 space-y-1"
                >
                  <div className="flex items-center justify-between text-[11px]">
                    <div className="flex items-center gap-1.5 font-medium">
                      <Globe className="w-3.5 h-3.5 text-blue-400" />
                      <span>{event.nodeTitle}</span>
                      <span className="px-1.5 py-0.2 rounded bg-blue-900/50 text-blue-300">
                        HTTP {event.status || 200}
                      </span>
                    </div>
                    {event.durationMs !== undefined && (
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {event.durationMs}ms
                      </span>
                    )}
                  </div>
                  <pre className="text-[11px] font-mono whitespace-pre-wrap text-zinc-300 bg-zinc-950/60 p-2 rounded border border-zinc-900">
                    {event.data}
                  </pre>
                </div>
              );
            }

            if (event.type === 'exit') {
              const isOk = event.exitCode === 0;
              return (
                <div
                  key={idx}
                  className={`py-1 px-2 my-1 rounded border flex items-center justify-between text-[11px] ${
                    isOk
                      ? 'bg-emerald-950/20 border-emerald-900/40 text-emerald-300'
                      : 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    {isOk ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    )}
                    <span className="font-semibold">{event.nodeTitle}</span>
                    <span>
                      {isOk ? 'Process exited successfully' : 'Process failed'} (exit code {event.exitCode})
                    </span>
                  </div>
                  {event.durationMs !== undefined && (
                    <div className="flex items-center gap-1 text-[10px] text-zinc-500">
                      <Clock className="w-3 h-3" />
                      <span>{event.durationMs}ms</span>
                    </div>
                  )}
                </div>
              );
            }

            if (event.type === 'stderr' || event.type === 'error') {
              return (
                <div key={idx} className="flex items-start gap-2 text-rose-400 pl-2">
                  <span className="text-zinc-600 text-[10px] select-none">{timeStr}</span>
                  <pre className="whitespace-pre-wrap font-mono flex-1">{event.data}</pre>
                </div>
              );
            }

            // Standard stdout
            return (
              <div key={idx} className="flex items-start gap-2 text-zinc-300 pl-2">
                <span className="text-zinc-600 text-[10px] select-none">{timeStr}</span>
                <pre className="whitespace-pre-wrap font-mono flex-1">{event.data}</pre>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
