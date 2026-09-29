import { PuzzlePiece } from './puzzleTypes';

export function validatePiece(piece: any): piece is PuzzlePiece {
  return (
    typeof piece === 'object' &&
    piece !== null &&
    typeof piece.id === 'string' &&
    typeof piece.x === 'number' &&
    typeof piece.y === 'number' &&
    typeof piece.groupId === 'string' &&
    typeof piece.originalRow === 'number' &&
    typeof piece.originalColumn === 'number'
  );
}

export function validatePiecesArray(pieces: any[]): pieces is PuzzlePiece[] {
  if (!Array.isArray(pieces) || pieces.length === 0) return false;
  return pieces.every(validatePiece);
}

export function countUniqueGroups(pieces: PuzzlePiece[]): number {
  const groups = new Set<string>();
  for (const p of pieces) {
    groups.add(p.groupId);
  }
  return groups.size;
}

export function calculateCompletionPercentage(pieces: PuzzlePiece[]): number {
  if (pieces.length === 0) return 0;
  // If total pieces is N and unique groups is G:
  // Initial: G = N (0% completed)
  // Final: G = 1 (100% completed)
  // Progress = ((N - G) / (N - 1)) * 100
  const total = pieces.length;
  if (total <= 1) return 100;
  const groups = countUniqueGroups(pieces);
  const progress = Math.max(0, Math.min(100, Math.round(((total - groups) / (total - 1)) * 100)));
  return progress;
}
