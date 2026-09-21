import React, { useRef, useState, useEffect, useCallback } from 'react';
import { WorkflowNode, NodeConnection } from '@/lib/workflowTypes';
import { validateConnection } from '@/lib/nodeValidation';
import { GitNodeCard } from './GitNodeCard';

export const NODE_WIDTH = 288; // w-72 = 18rem = 288px
export const PORT_Y_OFFSET = 68; // Exact center of the Port Label Strip from top of card
const GRID_SIZE = 16;
const CANVAS_VIRTUAL_SIZE = 8000;

interface NodeCanvasProps {
  nodes: WorkflowNode[];
  connections: NodeConnection[];
  selectedNodeId: string | null;
  zoomScale: number;
  onZoomChange?: (newScale: number) => void;
  onSelectNode: (id: string | null) => void;
  onMoveNode: (id: string, x: number, y: number) => void;
  onUpdateNodeConfig: (id: string, newConfig: Partial<WorkflowNode['config']>) => void;
  onExecuteAction: (node: WorkflowNode) => void;
  onDeleteNode: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, node: WorkflowNode | null) => void;
  onConnectNodes: (fromId: string, toId: string) => void;
  onDeleteConnection?: (connId: string) => void;
}

const snapToGrid = (val: number) => Math.round(val / GRID_SIZE) * GRID_SIZE;

/**
 * Smooth cubic bezier between two ports.
 * Uses horizontal tension so lines exit straight horizontally from the port dot.
 */
function buildBezierPath(x1: number, y1: number, x2: number, y2: number): string {
  const dx = x2 - x1;
  const tension = Math.max(70, Math.abs(dx) * 0.5) + (dx < 0 ? Math.abs(dx) * 0.4 : 0);
  return `M ${x1} ${y1} C ${x1 + tension} ${y1}, ${x2 - tension} ${y2}, ${x2} ${y2}`;
}

export const NodeCanvas: React.FC<NodeCanvasProps> = ({
  nodes,
  connections,
  selectedNodeId,
  zoomScale,
  onZoomChange,
  onSelectNode,
  onMoveNode,
  onUpdateNodeConfig,
  onExecuteAction,
  onDeleteNode,
  onContextMenu,
  onConnectNodes,
  onDeleteConnection,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const panRef = useRef({ x: 0, y: 0 });
  const [panState, setPanState] = useState({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });

  const draggingNodeIdRef = useRef<string | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);
  const connectingFromIdRef = useRef<string | null>(null);
  const nodesRef = useRef(nodes);
  const connectionsRef = useRef(connections);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { connectionsRef.current = connections; }, [connections]);

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [targetValidation, setTargetValidation] = useState<{
    targetNodeId: string;
    isValid: boolean;
    reason?: string;
  } | null>(null);
  const targetValidationRef = useRef(targetValidation);
  useEffect(() => { targetValidationRef.current = targetValidation; }, [targetValidation]);

  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'error' | 'success' } | null>(null);
  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 3000);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Space pan
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        e.preventDefault();
        setIsSpacePressed(true);
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        isPanningRef.current = false;
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // Wheel zoom + scroll pan
  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.ctrlKey || e.metaKey) {
        const delta = e.deltaY < 0 ? 0.08 : -0.08;
        if (onZoomChange) onZoomChange(Math.min(1.8, Math.max(0.3, zoomScale + delta)));
      } else {
        const nx = panRef.current.x - e.deltaX * 0.85;
        const ny = panRef.current.y - e.deltaY * 0.85;
        panRef.current = { x: nx, y: ny };
        setPanState({ x: nx, y: ny });
      }
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomScale, onZoomChange]);

  const getCanvasCoords = useCallback(
    (clientX: number, clientY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
      return {
        x: (clientX - rect.left - panRef.current.x) / zoomScale,
        y: (clientY - rect.top - panRef.current.y) / zoomScale,
      };
    },
    [zoomScale]
  );

  // Global mousemove + mouseup on window so drag works outside canvas boundaries
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      const coords = getCanvasCoords(e.clientX, e.clientY);
      setMousePos(coords);

      if (connectingFromIdRef.current) {
        const el = document.elementFromPoint(e.clientX, e.clientY);
        const card = el?.closest('[data-node-id]');
        const targetId = card?.getAttribute('data-node-id');
        if (targetId && targetId !== connectingFromIdRef.current) {
          const from = nodesRef.current.find((n) => n.id === connectingFromIdRef.current);
          const to = nodesRef.current.find((n) => n.id === targetId);
          if (from && to) {
            const res = validateConnection(from, to, connectionsRef.current);
            setTargetValidation({ targetNodeId: targetId, isValid: res.valid, reason: res.reason });
          }
        } else if (targetId === connectingFromIdRef.current) {
          setTargetValidation({ targetNodeId: connectingFromIdRef.current, isValid: false, reason: 'Cannot connect to itself' });
        } else {
          setTargetValidation(null);
        }
      }

      if (isPanningRef.current) {
        const nx = e.clientX - panStartRef.current.x;
        const ny = e.clientY - panStartRef.current.y;
        panRef.current = { x: nx, y: ny };
        setPanState({ x: nx, y: ny });
        return;
      }

      if (draggingNodeIdRef.current) {
        const rawX = coords.x - dragOffsetRef.current.x;
        const rawY = coords.y - dragOffsetRef.current.y;
        onMoveNode(draggingNodeIdRef.current, Math.max(0, snapToGrid(rawX)), Math.max(0, snapToGrid(rawY)));
      }
    };

    const onUp = () => {
      if (connectingFromIdRef.current) {
        const tv = targetValidationRef.current;
        if (tv) {
          if (tv.isValid) {
            onConnectNodes(connectingFromIdRef.current, tv.targetNodeId);
            setToastMessage({ text: 'Connection created', type: 'success' });
          } else {
            setToastMessage({ text: tv.reason ?? 'Invalid connection', type: 'error' });
          }
        }
        connectingFromIdRef.current = null;
        setConnectingFromId(null);
        setTargetValidation(null);
      }
      draggingNodeIdRef.current = null;
      setDraggingNodeId(null);
      isPanningRef.current = false;
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [getCanvasCoords, onMoveNode, onConnectNodes]);

  const handleMouseDownNode = (id: string, e: React.MouseEvent) => {
    if (isSpacePressed || e.button === 1) return;
    e.stopPropagation();
    onSelectNode(id);

    const node = nodesRef.current.find((n) => n.id === id);
    if (!node) return;

    const coords = getCanvasCoords(e.clientX, e.clientY);
    draggingNodeIdRef.current = id;
    dragOffsetRef.current = { x: coords.x - node.x, y: coords.y - node.y };
    setDraggingNodeId(id);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    if (isSpacePressed || e.button === 1) {
      e.preventDefault();
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX - panRef.current.x, y: e.clientY - panRef.current.y };
    }
  };

  const startConnectionDrag = (nodeId: string) => {
    connectingFromIdRef.current = nodeId;
    setConnectingFromId(nodeId);
  };

  // Fixed mathematical port coordinates based on the port strip location
  const portOutX = (node: WorkflowNode) => node.x + NODE_WIDTH;
  const portInX = (node: WorkflowNode) => node.x;
  const portY = (node: WorkflowNode) => node.y + PORT_Y_OFFSET;

  const isHandMode = isSpacePressed || isPanningRef.current;
  const pan = panState;

  return (
    <div
      ref={canvasRef}
      onMouseDown={handleCanvasMouseDown}
      onClick={() => {
        if (!draggingNodeId) {
          connectingFromIdRef.current = null;
          setConnectingFromId(null);
        }
      }}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu(e, null);
      }}
      className={`relative flex-1 w-full h-full min-h-0 overflow-hidden bg-neutral-50 dark:bg-[#0c0d0f] select-none border border-neutral-200/60 dark:border-neutral-800/80 rounded-2xl shadow-subtle ${
        draggingNodeId ? 'cursor-grabbing' : isHandMode ? 'cursor-grab' : 'cursor-default'
      }`}
      style={{
        backgroundImage: 'radial-gradient(circle, rgba(150,150,150,0.16) 1px, transparent 1px)',
        backgroundSize: `${GRID_SIZE * zoomScale}px ${GRID_SIZE * zoomScale}px`,
        backgroundPosition: `${pan.x % (GRID_SIZE * zoomScale)}px ${pan.y % (GRID_SIZE * zoomScale)}px`,
      }}
    >
      {/* Canvas world */}
      <div
        className="relative origin-top-left"
        style={{
          width: `${CANVAS_VIRTUAL_SIZE}px`,
          height: `${CANVAS_VIRTUAL_SIZE}px`,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoomScale})`,
          willChange: 'transform',
        }}
      >
        {/* ── SVG connection layer ── */}
        <svg
          className="absolute inset-0 pointer-events-none z-0"
          width={CANVAS_VIRTUAL_SIZE}
          height={CANVAS_VIRTUAL_SIZE}
          style={{ overflow: 'visible' }}
        >
          <defs>
            <marker
              id="arrow-default"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" className="fill-neutral-400 dark:fill-neutral-500" />
            </marker>
            <marker
              id="arrow-valid"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#10b981" />
            </marker>
            <marker
              id="arrow-invalid"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto"
            >
              <path d="M 0 1.5 L 8.5 5 L 0 8.5 z" fill="#ef4444" />
            </marker>
          </defs>

          {/* Existing connections */}
          {connections.map((conn) => {
            const from = nodes.find((n) => n.id === conn.fromId);
            const to = nodes.find((n) => n.id === conn.toId);
            if (!from || !to) return null;

            const x1 = portOutX(from);
            const y1 = portY(from);
            const x2 = portInX(to);
            const y2 = portY(to);
            const d = buildBezierPath(x1, y1, x2, y2);

            return (
              <g key={conn.id} className="group">
                {/* Wide hit target */}
                <path
                  d={d}
                  fill="none"
                  stroke="transparent"
                  strokeWidth="20"
                  style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConnection?.(conn.id);
                  }}
                />
                {/* Shadow */}
                <path d={d} fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="4" strokeLinecap="round" />
                {/* Main line */}
                <path
                  d={d}
                  fill="none"
                  strokeWidth="2"
                  strokeLinecap="round"
                  markerEnd="url(#arrow-default)"
                  className="text-neutral-400 dark:text-neutral-500 group-hover:text-rose-400 dark:group-hover:text-rose-500 transition-colors duration-100"
                  stroke="currentColor"
                  style={{ pointerEvents: 'stroke', cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDeleteConnection?.(conn.id);
                  }}
                />
              </g>
            );
          })}

          {/* Live rubber-band drag line */}
          {connectingFromId && (() => {
            const from = nodes.find((n) => n.id === connectingFromId);
            if (!from) return null;

            const x1 = portOutX(from);
            const y1 = portY(from);
            const x2 = mousePos.x;
            const y2 = mousePos.y;
            const d = buildBezierPath(x1, y1, x2, y2);

            const hovering = !!targetValidation;
            const valid = targetValidation?.isValid ?? true;
            const color = hovering ? (valid ? '#10b981' : '#ef4444') : '#818cf8';

            return (
              <g>
                <path d={d} fill="none" stroke={color} strokeWidth="8" strokeOpacity="0.15" strokeLinecap="round" />
                <path
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray={valid ? '8 5' : '4 4'}
                  markerEnd={`url(#${hovering ? (valid ? 'arrow-valid' : 'arrow-invalid') : 'arrow-valid'})`}
                />
              </g>
            );
          })()}
        </svg>

        {/* ── Nodes ── */}
        {nodes.map((node) => (
          <div
            key={node.id}
            onMouseDown={(e) => handleMouseDownNode(node.id, e)}
            style={{ willChange: draggingNodeId === node.id ? 'transform' : 'auto' }}
          >
            <GitNodeCard
              node={node}
              isSelected={selectedNodeId === node.id}
              isConnectionTarget={targetValidation?.targetNodeId === node.id}
              isTargetValid={
                targetValidation?.targetNodeId === node.id ? targetValidation.isValid : undefined
              }
              onSelect={() => onSelectNode(node.id)}
              onContextMenu={(e, n) => onContextMenu(e, n)}
              onUpdateConfig={(cfg) => onUpdateNodeConfig(node.id, cfg)}
              onExecuteAction={onExecuteAction}
              onDeleteNode={onDeleteNode}
              onStartConnectionDrag={startConnectionDrag}
            />
          </div>
        ))}
      </div>

      {/* Error tooltip */}
      {connectingFromId && targetValidation && !targetValidation.isValid && (
        <div
          className="absolute z-50 pointer-events-none px-3 py-1.5 rounded-xl bg-neutral-950/90 text-rose-300 text-xs font-medium shadow-2xl border border-rose-500/30 backdrop-blur-sm whitespace-nowrap"
          style={{
            left: `${mousePos.x * zoomScale + pan.x + 18}px`,
            top: `${mousePos.y * zoomScale + pan.y - 14}px`,
          }}
        >
          ⛔ {targetValidation.reason}
        </div>
      )}

      {/* Toast */}
      {toastMessage && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-badge-pop">
          <div
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold shadow-xl border backdrop-blur-md ${
              toastMessage.type === 'error'
                ? 'bg-rose-500/95 text-white border-rose-400/40'
                : 'bg-emerald-500/95 text-white border-emerald-400/40'
            }`}
          >
            {toastMessage.type === 'error' ? '⛔' : '✓'} {toastMessage.text}
          </div>
        </div>
      )}
    </div>
  );
};
