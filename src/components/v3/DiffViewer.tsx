import React from 'react';
import { FileCode } from 'lucide-react';

interface DiffViewerProps {
  filename: string;
  status?: string;
  additions?: number;
  deletions?: number;
  patch?: string;
}

interface ParsedDiffLine {
  type: 'add' | 'delete' | 'hunk' | 'normal';
  oldLineNumber?: number;
  newLineNumber?: number;
  content: string;
}

export function parseGitPatch(patch?: string): ParsedDiffLine[] {
  if (!patch) return [];

  const lines = patch.split('\n');
  const result: ParsedDiffLine[] = [];

  let oldLine = 0;
  let newLine = 0;

  for (const line of lines) {
    if (line.startsWith('@@')) {
      // Parse hunk header: @@ -240,8 +240,8 @@
      const match = line.match(/@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
      if (match) {
        oldLine = parseInt(match[1], 10);
        newLine = parseInt(match[2], 10);
      }
      result.push({
        type: 'hunk',
        content: line,
      });
    } else if (line.startsWith('+') && !line.startsWith('+++')) {
      result.push({
        type: 'add',
        newLineNumber: newLine,
        content: line.substring(1),
      });
      newLine++;
    } else if (line.startsWith('-') && !line.startsWith('---')) {
      result.push({
        type: 'delete',
        oldLineNumber: oldLine,
        content: line.substring(1),
      });
      oldLine++;
    } else {
      result.push({
        type: 'normal',
        oldLineNumber: oldLine,
        newLineNumber: newLine,
        content: line.startsWith(' ') ? line.substring(1) : line,
      });
      oldLine++;
      newLine++;
    }
  }

  return result;
}

export const DiffViewer: React.FC<DiffViewerProps> = ({
  filename,
  status = 'modified',
  additions = 0,
  deletions = 0,
  patch,
}) => {
  const parsedLines = parseGitPatch(patch);

  return (
    <div className="rounded-xl border border-neutral-800 bg-[#0d1117] text-[#e6edf3] overflow-hidden font-mono text-[12px] shadow-apple-dark">
      {/* File Header Bar */}
      <div className="px-4 py-2.5 bg-[#161b22] border-b border-neutral-800 font-medium text-[12px] flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <FileCode className="w-4 h-4 text-neutral-400" />
          <span className="text-[#e6edf3] font-semibold">{filename}</span>
          <span
            className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded font-sans tracking-wide ${
              status === 'added'
                ? 'bg-[#1f382a] text-[#7ee787] border border-[#238636]/40'
                : status === 'removed'
                ? 'bg-[#3f191f] text-[#ff7b72] border border-[#da3633]/40'
                : 'bg-neutral-800 text-neutral-300 border border-neutral-700'
            }`}
          >
            {status}
          </span>
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono">
          {additions > 0 && <span className="text-[#7ee787]">+{additions}</span>}
          {deletions > 0 && <span className="text-[#ff7b72]">-{deletions}</span>}
        </div>
      </div>

      {/* Code Lines with Line Numbers Gutter */}
      {parsedLines.length > 0 ? (
        <div className="overflow-x-auto divide-y divide-transparent">
          <table className="w-full border-collapse">
            <tbody>
              {parsedLines.map((line, idx) => {
                if (line.type === 'hunk') {
                  return (
                    <tr key={idx} className="bg-[#161b22] text-[#7d8590] select-none text-[11px]">
                      <td colSpan={2} className="py-1 px-3 text-center border-r border-neutral-800/60 font-mono text-[10px] text-neutral-500 w-20">
                        ...
                      </td>
                      <td className="py-1 px-4 font-mono text-[#7d8590] text-[11px]">
                        {line.content}
                      </td>
                    </tr>
                  );
                }

                const isAdd = line.type === 'add';
                const isDel = line.type === 'delete';

                return (
                  <tr
                    key={idx}
                    className={`leading-relaxed transition-colors ${
                      isAdd
                        ? 'bg-[#1f382a]/35 text-[#7ee787]'
                        : isDel
                        ? 'bg-[#3f191f]/35 text-[#ff7b72]'
                        : 'hover:bg-neutral-800/30 text-[#e6edf3]'
                    }`}
                  >
                    {/* Old Line Number */}
                    <td className="py-0.5 px-2 text-right select-none font-mono text-[10px] text-[#6e7681] w-10 border-r border-neutral-800/50">
                      {line.oldLineNumber ?? ''}
                    </td>
                    {/* New Line Number */}
                    <td className="py-0.5 px-2 text-right select-none font-mono text-[10px] text-[#6e7681] w-10 border-r border-neutral-800/50">
                      {line.newLineNumber ?? ''}
                    </td>
                    {/* Prefix Sign & Code */}
                    <td className="py-0.5 px-3 font-mono whitespace-pre text-[11.5px] leading-relaxed break-all">
                      <span className="select-none inline-block w-4 font-bold text-[11px]">
                        {isAdd ? '+' : isDel ? '-' : ' '}
                      </span>
                      <span>{line.content}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-4 text-neutral-500 text-xs italic">
          Binary file or large diff not shown inline.
        </div>
      )}
    </div>
  );
};
