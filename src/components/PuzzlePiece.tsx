import React from 'react';
import { PuzzlePiece as PuzzlePieceType } from '../puzzle/puzzleTypes';

interface PuzzlePieceProps {
  piece: PuzzlePieceType;
  isSelected?: boolean;
}

export const PuzzlePiece: React.FC<PuzzlePieceProps> = ({ piece, isSelected = false }) => {
  return (
    <div
      className={`inline-block p-1 border rounded text-[10px] ${
        isSelected ? 'bg-blue-100 border-blue-500' : 'bg-white border-gray-300'
      }`}
    >
      <span>{piece.id}</span>
      <span className="ml-1 text-gray-400">({piece.x}, {piece.y})</span>
    </div>
  );
};
