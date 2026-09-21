import React, { useState } from 'react';
import { Terminal, Copy, Check, Circle, CheckCircle2, XCircle, Loader2, AlertTriangle } from 'lucide-react';
import { ExecutionStep } from '@/lib/workflowTypes';

type TerminalMode = 'preview' | 'dryrun' | 'executing' | 'done';

interface TerminalPreviewProps {
  commands: string[];
  mode?: TerminalMode;
  executionSteps?: ExecutionStep[];
  onConfirmExecute?: () => void;
  onCancelExecute?: () => void;
}

export const TerminalPreview: React.FC<TerminalPreviewProps> = ({
  commands,
  mode = 'preview',
  executionSteps = [],
  onConfirmExecute,
  onCancelExecute,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const fullText = commands.map((c) => c.replace(/^\$\s*/, '')).join('\n');
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const doneCount = executionSteps.filter((s) => s.status === 'success').length;
  const failedCount = executionSteps.filter((s) => s.status === 'failed').length;

  return (
    <div className="w-full lg:w-80 rounded-2xl border border-neutral-800 bg-[#090a0c] text-neutral-200 overflow-hidden shadow-apple-dark font-mono text-xs flex flex-col">
      {/* Terminal Title Bar */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-[#121418] border-b border-neutral-800 select-none flex-shrink-0">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-neutral-400" />
          <span className="font-semibold text-[11px] tracking-tight text-neutral-300">
            {mode === 'dryrun' ? 'Dry Run Preview' : mode === 'executing' ? 'Executing Workflow...' : mode === 'done' ? 'Execution Complete' : 'Terminal Preview'}
          </span>
        </div>

        {mode === 'preview' && (
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors flex items-center gap-1 text-[10px]"
            title="Copy generated commands"
          >
            {copied ? (
              <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400 font-sans">Copied!</span></>
            ) : (
              <><Copy className="w-3 h-3" /><span className="font-sans">Copy</span></>
            )}
          </button>
        )}

        {(mode === 'executing' || mode === 'done') && (
          <span className="text-[10px] font-sans text-neutral-400">
            {doneCount}/{executionSteps.length} done
            {failedCount > 0 && <span className="text-rose-400 ml-1">{failedCount} failed</span>}
          </span>
        )}
      </div>

      {/* DRY RUN MODE */}
      {mode === 'dryrun' && (
        <div className="flex flex-col flex-1">
          <div className="px-4 pt-3 pb-1">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-sans text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
              <AlertTriangle className="w-3 h-3" />
              No commands have been executed yet
            </span>
          </div>
          <div className="p-4 space-y-2 overflow-y-auto max-h-52 leading-relaxed">
            {executionSteps.map((step, i) => (
              <div key={step.nodeId} className="flex items-start gap-2.5">
                <span className="text-neutral-600 select-none w-4 text-right flex-shrink-0">{i + 1}.</span>
                <div className="flex-1 min-w-0">
                  <div className={`text-neutral-200 break-all ${step.isDangerous ? 'text-amber-300' : ''}`}>
                    {step.command}
                  </div>
                  <div className="text-neutral-600 text-[10px] font-sans mt-0.5">{step.description}</div>
                  {step.isDangerous && (
                    <div className="flex items-center gap-1 text-[10px] text-amber-500 font-sans mt-0.5">
                      <AlertTriangle className="w-2.5 h-2.5" /> Potentially destructive
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 pb-4 pt-2 border-t border-neutral-800/60 flex gap-2">
            <button
              onClick={onCancelExecute}
              className="flex-1 py-2 rounded-lg text-[11px] font-sans font-medium text-neutral-400 bg-neutral-800 hover:bg-neutral-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={onConfirmExecute}
              className="flex-1 py-2 rounded-lg text-[11px] font-sans font-medium text-white bg-emerald-600 hover:bg-emerald-500 transition-colors"
            >
              Execute
            </button>
          </div>
        </div>
      )}

      {/* EXECUTION / DONE MODE */}
      {(mode === 'executing' || mode === 'done') && (
        <div className="flex flex-col flex-1">
          <div className="p-4 space-y-3 overflow-y-auto max-h-64 leading-relaxed">
            {executionSteps.map((step) => (
              <div key={step.nodeId} className="space-y-1">
                <div className="flex items-center gap-2">
                  {step.status === 'queued' && <Circle className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" />}
                  {step.status === 'executing' && <Loader2 className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 animate-spin" />}
                  {step.status === 'success' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />}
                  {step.status === 'failed' && <XCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />}
                  <span className={`break-all ${
                    step.status === 'queued' ? 'text-neutral-600' :
                    step.status === 'executing' ? 'text-amber-300' :
                    step.status === 'success' ? 'text-neutral-200' :
                    'text-rose-300'
                  }`}>
                    {step.command}
                  </span>
                </div>
                {step.output && step.status === 'success' && (
                  <div className="ml-5 text-[10px] text-neutral-500 font-sans whitespace-pre-line leading-relaxed border-l border-neutral-800 pl-2">
                    {step.output}
                  </div>
                )}
                {step.error && (
                  <div className="ml-5 text-[10px] text-rose-400 font-sans whitespace-pre-line border-l border-rose-800 pl-2">
                    {step.error}
                  </div>
                )}
              </div>
            ))}
          </div>

          {mode === 'done' && (
            <div className="px-4 py-3 border-t border-neutral-800/60 font-sans text-[11px]">
              {failedCount === 0 ? (
                <div className="flex items-center gap-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Workflow completed — {doneCount} operation{doneCount !== 1 ? 's' : ''} successful
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-rose-400">
                  <XCircle className="w-3.5 h-3.5" />
                  {failedCount} operation{failedCount !== 1 ? 's' : ''} failed — check output above
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* PREVIEW MODE */}
      {mode === 'preview' && (
        <div className="p-4 space-y-2 overflow-y-auto max-h-72 leading-relaxed text-[11px] text-neutral-300">
          {commands.map((cmd, i) => (
            <div key={i} className="flex items-start gap-2">
              <span className="text-neutral-500 select-none">$</span>
              <span className="text-neutral-100 font-mono break-all">{cmd.replace(/^\$\s*/, '')}</span>
            </div>
          ))}
          <div className="text-neutral-600 text-[10px] pt-2 border-t border-neutral-800/60 font-sans italic">
            Draft preview — no commands have been executed.
          </div>
        </div>
      )}
    </div>
  );
};
