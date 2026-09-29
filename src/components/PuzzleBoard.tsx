import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';
import { PuzzlePiece, PuzzleInstance, PieceEdges } from '../puzzle/puzzleTypes';
import { createPiecePath } from '../puzzle/puzzleGeometry';
import { checkAndExecuteSnap, moveGroup, checkPuzzleCompletion } from '../puzzle/puzzleState';
import { calculateCompletionPercentage } from '../puzzle/puzzleValidation';
import confetti from 'canvas-confetti';

interface PuzzleBoardProps {
  socket: Socket;
  roomId: string;
  puzzleInstance: PuzzleInstance;
  onPuzzleCompleted?: () => void;
  isCompleted?: boolean;
}

export const PuzzleBoard: React.FC<PuzzleBoardProps> = ({
  socket,
  roomId,
  puzzleInstance,
  onPuzzleCompleted,
  isCompleted: initialCompleted = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Puzzle State stored in ref for 60fps rendering without React re-render lag
  const piecesRef = useRef<PuzzlePiece[]>(puzzleInstance.pieces);
  const [completionProgress, setCompletionProgress] = useState(0);
  const [isDone, setIsDone] = useState(initialCompleted);

  // Precomputed Path2D cache for each piece id
  const pathCacheRef = useRef<Map<string, Path2D>>(new Map());

  // Dragging state
  const dragRef = useRef<{
    isDragging: boolean;
    activePieceId: string | null;
    activeGroupId: string | null;
    startX: number;
    startY: number;
    initialGroupPositions: Map<string, { x: number; y: number }>;
    lastSentTime: number;
  }>({
    isDragging: false,
    activePieceId: null,
    activeGroupId: null,
    startX: 0,
    startY: 0,
    initialGroupPositions: new Map(),
    lastSentTime: 0
  });

  // Precompute Path2D for all pieces
  const initPaths = useCallback(() => {
    const cache = new Map<string, Path2D>();
    for (const p of piecesRef.current) {
      const path = createPiecePath(p.width, p.height, p.edges);
      cache.set(p.id, path);
    }
    pathCacheRef.current = cache;
  }, []);

  // Main Canvas Rendering loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { boardWidth, boardHeight, boardOffsetX, boardOffsetY } = puzzleInstance.config;
    const img = puzzleInstance.image;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Draw Assembly Board Area (subtle border and guide outline)
    ctx.save();
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(boardOffsetX, boardOffsetY, boardWidth, boardHeight);

    // Subtle faint image preview in background of board (20% opacity)
    ctx.globalAlpha = 0.18;
    ctx.drawImage(img, boardOffsetX, boardOffsetY, boardWidth, boardHeight);
    ctx.globalAlpha = 1.0;

    // Board outline
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.strokeRect(boardOffsetX, boardOffsetY, boardWidth, boardHeight);

    // Board header label
    ctx.fillStyle = '#64748b';
    ctx.font = '12px sans-serif';
    ctx.fillText('Assembly Area', boardOffsetX + 8, boardOffsetY - 6);
    ctx.restore();

    // 2. Render all pieces
    const pieces = piecesRef.current;
    const pW = puzzleInstance.config.boardWidth / puzzleInstance.config.columns;
    const pH = puzzleInstance.config.boardHeight / puzzleInstance.config.rows;

    // Ratio between source image and board dimensions
    const scaleX = (img.width || 800) / puzzleInstance.config.boardWidth;
    const scaleY = (img.height || 500) / puzzleInstance.config.boardHeight;

    for (const piece of pieces) {
      const path = pathCacheRef.current.get(piece.id);
      if (!path) continue;

      ctx.save();
      ctx.translate(piece.x, piece.y);

      // Clip to piece jigsaw shape
      ctx.clip(path);

      // Calculate source image crop coordinates (with extra margin for protruding tabs)
      const tabMarginRatio = 0.25;
      const marginX = pW * tabMarginRatio;
      const marginY = pH * tabMarginRatio;

      const sx = (piece.originalColumn * pW - marginX) * scaleX;
      const sy = (piece.originalRow * pH - marginY) * scaleY;
      const sw = (pW + marginX * 2) * scaleX;
      const sh = (pH + marginY * 2) * scaleY;

      const dx = -marginX;
      const dy = -marginY;
      const dw = pW + marginX * 2;
      const dh = pH + marginY * 2;

      ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);

      // Stroke piece borders: dark edge + light highlight for depth
      ctx.restore();

      ctx.save();
      ctx.translate(piece.x, piece.y);
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.4)';
      ctx.lineWidth = 1.5;
      ctx.stroke(path);

      // Highlight active dragged piece's group with subtle colored glow
      if (dragRef.current.activeGroupId === piece.groupId) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.stroke(path);
      }

      ctx.restore();
    }
  }, [puzzleInstance]);

  // Request redraw with requestAnimationFrame
  const requestRedraw = useCallback(() => {
    requestAnimationFrame(draw);
  }, [draw]);

  // Coordinate conversion helper
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX = 0;
    let clientY = 0;

    if ('touches' in e && e.touches.length > 0) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else if ('clientX' in e) {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  // Find piece under point (search top-down in render order)
  const getPieceAtPoint = (x: number, y: number): PuzzlePiece | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    const pieces = piecesRef.current;
    // Iterate in reverse (highest z-index first)
    for (let i = pieces.length - 1; i >= 0; i--) {
      const p = pieces[i];
      const path = pathCacheRef.current.get(p.id);
      if (!path) continue;

      // Quick bounding box check with tab margin
      const margin = Math.max(p.width, p.height) * 0.3;
      if (
        x >= p.x - margin &&
        x <= p.x + p.width + margin &&
        y >= p.y - margin &&
        y <= p.y + p.height + margin
      ) {
        // Precise Path2D hit-test
        if (ctx.isPointInPath(path, x - p.x, y - p.y)) {
          return p;
        }
      }
    }
    return null;
  };

  // Bring active group pieces to front of array for z-index rendering
  const bringGroupToFront = (groupId: string) => {
    const groupPieces: PuzzlePiece[] = [];
    const otherPieces: PuzzlePiece[] = [];

    for (const p of piecesRef.current) {
      if (p.groupId === groupId) {
        groupPieces.push(p);
      } else {
        otherPieces.push(p);
      }
    }

    piecesRef.current = [...otherPieces, ...groupPieces];
  };

  // Trigger celebration confetti
  const triggerVictory = () => {
    setIsDone(true);
    setCompletionProgress(100);
    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 }
    });
    onPuzzleCompleted?.();
  };

  // MOUSE / TOUCH EVENTS
  const handlePointerDown = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (isDone) return;
    const { x, y } = getCanvasCoords(e);
    const clickedPiece = getPieceAtPoint(x, y);

    if (clickedPiece) {
      bringGroupToFront(clickedPiece.groupId);

      // Record initial positions of all pieces in this group
      const initialMap = new Map<string, { x: number; y: number }>();
      for (const p of piecesRef.current) {
        if (p.groupId === clickedPiece.groupId) {
          initialMap.set(p.id, { x: p.x, y: p.y });
        }
      }

      dragRef.current = {
        isDragging: true,
        activePieceId: clickedPiece.id,
        activeGroupId: clickedPiece.groupId,
        startX: x,
        startY: y,
        initialGroupPositions: initialMap,
        lastSentTime: Date.now()
      };

      requestRedraw();
    }
  };

  const handlePointerMove = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    if (!drag.isDragging || !drag.activeGroupId) return;

    const { x, y } = getCanvasCoords(e);
    const deltaX = x - drag.startX;
    const deltaY = y - drag.startY;

    // Move all pieces in active group based on initial position + delta
    const groupMoves: { id: string; x: number; y: number }[] = [];
    piecesRef.current = piecesRef.current.map(p => {
      if (p.groupId === drag.activeGroupId) {
        const initial = drag.initialGroupPositions.get(p.id);
        if (initial) {
          const newX = Math.round(initial.x + deltaX);
          const newY = Math.round(initial.y + deltaY);
          groupMoves.push({ id: p.id, x: newX, y: newY });
          return { ...p, x: newX, y: newY };
        }
      }
      return p;
    });

    requestRedraw();

    // Throttle network PIECE_MOVE broadcast (every ~35ms / 28Hz)
    const now = Date.now();
    if (now - drag.lastSentTime > 35) {
      drag.lastSentTime = now;
      socket.emit('PIECE_MOVE', {
        roomId,
        pieceId: drag.activePieceId,
        groupId: drag.activeGroupId,
        x: groupMoves[0]?.x ?? 0,
        y: groupMoves[0]?.y ?? 0,
        groupMoves
      });
    }
  };

  const handlePointerUp = () => {
    const drag = dragRef.current;
    if (!drag.isDragging || !drag.activeGroupId) return;

    const activeGroupId = drag.activeGroupId;
    const activePieceId = drag.activePieceId;

    // Send final authoritative position update
    const activeGroupPieces = piecesRef.current.filter(p => p.groupId === activeGroupId);
    const groupMoves = activeGroupPieces.map(p => ({ id: p.id, x: p.x, y: p.y }));

    socket.emit('PIECE_MOVE', {
      roomId,
      pieceId: activePieceId,
      groupId: activeGroupId,
      x: groupMoves[0]?.x ?? 0,
      y: groupMoves[0]?.y ?? 0,
      groupMoves
    });

    // Reset drag
    dragRef.current = {
      isDragging: false,
      activePieceId: null,
      activeGroupId: null,
      startX: 0,
      startY: 0,
      initialGroupPositions: new Map(),
      lastSentTime: 0
    };

    // Check for Snapping
    const pW = puzzleInstance.config.boardWidth / puzzleInstance.config.columns;
    const pH = puzzleInstance.config.boardHeight / puzzleInstance.config.rows;
    const snapResult = checkAndExecuteSnap(piecesRef.current, activeGroupId, pW, pH);

    if (snapResult.hasSnapped) {
      piecesRef.current = snapResult.updatedPieces;

      // Broadcast SNAP event to peer
      socket.emit('PIECE_SNAP', {
        roomId,
        targetGroupId: snapResult.mergedGroupId,
        mergedGroupId: snapResult.mergedGroupId,
        updatedPieces: snapResult.updatedPieces
      });

      // Update progress
      const progress = calculateCompletionPercentage(piecesRef.current);
      setCompletionProgress(progress);

      // Check for Puzzle Completion
      if (checkPuzzleCompletion(piecesRef.current)) {
        socket.emit('PUZZLE_COMPLETED', { roomId });
        triggerVictory();
      }
    }

    requestRedraw();
  };

  // MULTIPLAYER SOCKET EVENT LISTENERS
  useEffect(() => {
    initPaths();
    requestRedraw();

    // 1. Peer moved piece
    const handlePeerPieceMove = (data: { groupId: string; groupMoves?: { id: string; x: number; y: number }[]; pieceId: string; x: number; y: number }) => {
      // Don't overwrite if local user is dragging this same group
      if (dragRef.current.isDragging && dragRef.current.activeGroupId === data.groupId) return;

      if (data.groupMoves && data.groupMoves.length > 0) {
        const movesMap = new Map(data.groupMoves.map(m => [m.id, m]));
        piecesRef.current = piecesRef.current.map(p => {
          const move = movesMap.get(p.id);
          if (move) return { ...p, x: move.x, y: move.y };
          return p;
        });
      } else {
        piecesRef.current = piecesRef.current.map(p => {
          if (p.id === data.pieceId) return { ...p, x: data.x, y: data.y };
          return p;
        });
      }
      requestRedraw();
    };

    // 2. Peer snapped piece
    const handlePeerPieceSnap = (data: { updatedPieces: PuzzlePiece[] }) => {
      if (data.updatedPieces) {
        const updatedMap = new Map(data.updatedPieces.map(p => [p.id, p]));
        piecesRef.current = piecesRef.current.map(p => {
          const updated = updatedMap.get(p.id);
          return updated ? { ...p, x: updated.x, y: updated.y, groupId: updated.groupId } : p;
        });

        const progress = calculateCompletionPercentage(piecesRef.current);
        setCompletionProgress(progress);
        requestRedraw();
      }
    };

    // 3. Full puzzle state snapshot from server/peer
    const handlePuzzleState = (data: { pieces: PuzzlePiece[]; isCompleted?: boolean }) => {
      if (data.pieces && Array.isArray(data.pieces)) {
        const updatedMap = new Map(data.pieces.map(p => [p.id, p]));
        piecesRef.current = piecesRef.current.map(p => {
          const updated = updatedMap.get(p.id);
          return updated ? { ...p, x: updated.x, y: updated.y, groupId: updated.groupId } : p;
        });
        const progress = calculateCompletionPercentage(piecesRef.current);
        setCompletionProgress(progress);
        if (data.isCompleted) {
          triggerVictory();
        }
        requestRedraw();
      }
    };

    // 4. Peer completed puzzle
    const handlePuzzleCompleted = () => {
      triggerVictory();
    };

    // 5. Reset puzzle
    const handlePuzzleReset = () => {
      setIsDone(false);
      setCompletionProgress(0);
      requestRedraw();
    };

    socket.on('PIECE_MOVE', handlePeerPieceMove);
    socket.on('PIECE_SNAP', handlePeerPieceSnap);
    socket.on('PUZZLE_STATE', handlePuzzleState);
    socket.on('PUZZLE_COMPLETED', handlePuzzleCompleted);
    socket.on('PUZZLE_RESET', handlePuzzleReset);

    return () => {
      socket.off('PIECE_MOVE', handlePeerPieceMove);
      socket.off('PIECE_SNAP', handlePeerPieceSnap);
      socket.off('PUZZLE_STATE', handlePuzzleState);
      socket.off('PUZZLE_COMPLETED', handlePuzzleCompleted);
      socket.off('PUZZLE_RESET', handlePuzzleReset);
    };
  }, [socket, initPaths, requestRedraw]);

  // Adjust canvas size to fit container
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current && containerRef.current) {
        canvasRef.current.width = puzzleInstance.config.workspaceWidth;
        canvasRef.current.height = puzzleInstance.config.workspaceHeight;
        requestRedraw();
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [puzzleInstance, requestRedraw]);

  return (
    <div className="relative flex flex-col w-full h-full bg-slate-900 select-none overflow-hidden" ref={containerRef}>
      {/* Top Progress Bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-slate-800 border-b border-slate-700 text-xs text-slate-300">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-white">{puzzleInstance.definition.title}</span>
          <span className="bg-slate-700 text-slate-300 px-2 py-0.5 rounded text-[11px]">
            {puzzleInstance.pieces.length} pieces ({puzzleInstance.definition.rows}×{puzzleInstance.definition.columns})
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <span>Progress: <strong className="text-blue-400">{completionProgress}%</strong></span>
          <div className="w-32 bg-slate-700 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-blue-500 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${completionProgress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Main Interactive Canvas */}
      <div className="relative flex-1 w-full h-full overflow-hidden cursor-grab active:cursor-grabbing">
        <canvas
          ref={canvasRef}
          width={puzzleInstance.config.workspaceWidth}
          height={puzzleInstance.config.workspaceHeight}
          className="w-full h-full block"
          onMouseDown={handlePointerDown}
          onMouseMove={handlePointerMove}
          onMouseUp={handlePointerUp}
          onTouchStart={handlePointerDown}
          onTouchMove={handlePointerMove}
          onTouchEnd={handlePointerUp}
        />

        {/* Completion Modal Overlay */}
        {isDone && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
            <div className="bg-white rounded-lg p-6 max-w-sm text-center shadow-xl border border-slate-200">
              <div className="text-4xl mb-2">🎉</div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Puzzle Completed!</h2>
              <p className="text-sm text-gray-600 mb-4">
                Both players solved <strong>{puzzleInstance.definition.title}</strong> together!
              </p>
              <button
                onClick={() => setIsDone(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition"
              >
                Inspect Solved Puzzle
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
