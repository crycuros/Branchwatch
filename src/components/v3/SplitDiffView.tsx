import React from 'react';
import { FileCode } from 'lucide-react';

interface SplitDiffViewProps {
  filename: string;
  beforeCode: string[];
  afterCode: string[];
}

export const SplitDiffView: React.FC<SplitDiffViewProps> = ({
  filename,
  beforeCode,
  afterCode,
}) => {
  const maxLines = Math.max(beforeCode.length, afterCode.length);

  return (
    <div className="rounded-xl border border-neutral-200 dark:border-neutral-800 bg-[#090a0c] text-neutral-200 overflow-hidden font-mono text-xs shadow-apple-dark">
      {/* File Bar */}
      <div className="px-4 py-2 bg-[#121418] border-b border-neutral-800 font-medium text-neutral-400 text-[11px] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileCode className="w-3.5 h-3.5 text-neutral-400" />
          <span className="text-neutral-200">{filename}</span>
        </div>
        <div className="flex items-center gap-4 text-[10px] font-sans">
          <span className="text-rose-400 font-mono">BEFORE ({beforeCode.length} lines)</span>
          <span className="text-neutral-600">→</span>
          <span className="text-emerald-400 font-mono">AFTER ({afterCode.length} lines)</span>
        </div>
      </div>

      {/* Split Grid */}
      <div className="grid grid-cols-2 divide-x divide-neutral-800 text-[11px] overflow-x-auto">
        {/* BEFORE Column */}
        <div className="p-3 bg-[#0d0e12] overflow-x-auto space-y-0.5 min-w-[280px]">
          <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider pb-1 mb-1.5 border-b border-neutral-800/80 font-sans flex items-center justify-between">
            <span>Base / Previous</span>
            <span className="text-[9px] text-neutral-600 font-mono">{beforeCode.length} lines</span>
          </div>
          {beforeCode.map((line, i) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 px-1.5 py-0.5 rounded font-mono ${
                line.startsWith('-')
                  ? 'bg-rose-500/10 text-rose-400 border-l-2 border-rose-500/60'
                  : 'text-neutral-300'
              }`}
            >
              <span className="w-6 text-neutral-600 text-right select-none text-[10px] flex-shrink-0 font-mono pt-0.5">
                {i + 1}
              </span>
              <span className="break-all whitespace-pre font-mono leading-relaxed">{line}</span>
            </div>
          ))}
          {beforeCode.length === 0 && (
            <div className="text-neutral-600 italic text-[10px] py-2 font-sans">Empty file</div>
          )}
        </div>

        {/* AFTER Column */}
        <div className="p-3 bg-[#090a0c] overflow-x-auto space-y-0.5 min-w-[280px]">
          <div className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider pb-1 mb-1.5 border-b border-neutral-800/80 font-sans flex items-center justify-between">
            <span>Head / Updated</span>
            <span className="text-[9px] text-neutral-600 font-mono">{afterCode.length} lines</span>
          </div>
          {afterCode.map((line, i) => (
            <div
              key={i}
              className={`flex items-start gap-2.5 px-1.5 py-0.5 rounded font-mono ${
                line.startsWith('+')
                  ? 'bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500/60'
                  : 'text-neutral-300'
              }`}
            >
              <span className="w-6 text-neutral-600 text-right select-none text-[10px] flex-shrink-0 font-mono pt-0.5">
                {i + 1}
              </span>
              <span className="break-all whitespace-pre font-mono leading-relaxed">{line}</span>
            </div>
          ))}
          {afterCode.length === 0 && (
            <div className="text-neutral-600 italic text-[10px] py-2 font-sans">Empty file</div>
          )}
        </div>
      </div>
    </div>
  );
};
