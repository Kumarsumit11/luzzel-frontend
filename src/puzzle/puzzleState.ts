import { PuzzlePiece } from './puzzleTypes';

export const SNAP_DISTANCE_THRESHOLD = 26; // pixels

export interface SnapResult {
  hasSnapped: boolean;
  mergedGroupId?: string;
  updatedPieces: PuzzlePiece[];
  snappedPair?: { pieceA: string; pieceB: string };
}

/**
 * Checks if any piece in activeGroup can snap to any piece in another group
 */
export function checkAndExecuteSnap(
  pieces: PuzzlePiece[],
  activeGroupId: string,
  pieceWidth: number,
  pieceHeight: number
): SnapResult {
  const piecesMap = new Map<string, PuzzlePiece>(pieces.map(p => [p.id, { ...p }]));
  const activeGroupPieces = Array.from(piecesMap.values()).filter(p => p.groupId === activeGroupId);

  let hasSnapped = false;
  let targetMergedGroupId = activeGroupId;
  let snappedPair: { pieceA: string; pieceB: string } | undefined;

  // Search through all pieces in the active group
  for (const pieceA of activeGroupPieces) {
    // Check all 4 potential neighbors of pieceA
    const neighborChecks: { id?: string; expectedDx: number; expectedDy: number }[] = [
      { id: pieceA.neighbors.right, expectedDx: pieceWidth, expectedDy: 0 },
      { id: pieceA.neighbors.left, expectedDx: -pieceWidth, expectedDy: 0 },
      { id: pieceA.neighbors.bottom, expectedDx: 0, expectedDy: pieceHeight },
      { id: pieceA.neighbors.top, expectedDx: 0, expectedDy: -pieceHeight }
    ];

    for (const check of neighborChecks) {
      if (!check.id) continue;
      const pieceB = piecesMap.get(check.id);
      if (!pieceB || pieceB.groupId === pieceA.groupId) continue;

      // Actual offset between pieceB and pieceA
      const actualDx = pieceB.x - pieceA.x;
      const actualDy = pieceB.y - pieceA.y;

      // Distance error from ideal connection
      const errorX = actualDx - check.expectedDx;
      const errorY = actualDy - check.expectedDy;
      const distError = Math.hypot(errorX, errorY);

      if (distError <= SNAP_DISTANCE_THRESHOLD) {
        // Snap! Move all pieces in active group to align perfectly with pieceB
        const shiftX = errorX;
        const shiftY = errorY;

        targetMergedGroupId = pieceB.groupId;
        snappedPair = { pieceA: pieceA.id, pieceB: pieceB.id };

        // Adjust all pieces in active group
        for (const p of activeGroupPieces) {
          const current = piecesMap.get(p.id)!;
          current.x += shiftX;
          current.y += shiftY;
          current.groupId = targetMergedGroupId;
        }

        hasSnapped = true;
        break;
      }
    }

    if (hasSnapped) break;
  }

  // Also check if piece is near its exact correct spot on the board
  // If not snapped to a piece, check if pieceA is near correctX/correctY
  if (!hasSnapped) {
    for (const pieceA of activeGroupPieces) {
      const errX = pieceA.x - pieceA.correctX;
      const errY = pieceA.y - pieceA.correctY;
      const distToBoard = Math.hypot(errX, errY);

      if (distToBoard <= SNAP_DISTANCE_THRESHOLD) {
        // Snap the entire active group to its absolute correct board coordinates
        const shiftX = -errX;
        const shiftY = -errY;

        for (const p of activeGroupPieces) {
          const current = piecesMap.get(p.id)!;
          current.x += shiftX;
          current.y += shiftY;
        }
        hasSnapped = true;
        targetMergedGroupId = activeGroupId;
        break;
      }
    }
  }

  const updatedPiecesList = Array.from(piecesMap.values());

  return {
    hasSnapped,
    mergedGroupId: targetMergedGroupId,
    updatedPieces: updatedPiecesList,
    snappedPair
  };
}

/**
 * Moves all pieces in a group by (deltaX, deltaY)
 */
export function moveGroup(
  pieces: PuzzlePiece[],
  groupId: string,
  deltaX: number,
  deltaY: number
): PuzzlePiece[] {
  return pieces.map(piece => {
    if (piece.groupId === groupId) {
      return {
        ...piece,
        x: piece.x + deltaX,
        y: piece.y + deltaY
      };
    }
    return piece;
  });
}

/**
 * Checks if the puzzle is completed (all pieces in one single group)
 */
export function checkPuzzleCompletion(pieces: PuzzlePiece[]): boolean {
  if (pieces.length <= 1) return false;
  const firstGroupId = pieces[0].groupId;
  return pieces.every(p => p.groupId === firstGroupId);
}
