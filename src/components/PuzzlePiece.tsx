import React from "react"
import { PuzzlePiece as PuzzlePieceType } from "../puzzle/puzzleTypes"

interface PuzzlePieceProps {
  piece: PuzzlePieceType
  isSelected?: boolean
}

export const PuzzlePiece: React.FC<PuzzlePieceProps> = ({
  piece,
  isSelected = false,
}) => {
  return (
    <div
      className={`inline-flex items-center gap-1 rounded-lg border-2 border-[#20201e] px-2 py-1 text-[10px] font-black shadow-[2px_2px_0_#20201e] transition ${
        isSelected ? "bg-[#70c8ff] -translate-y-0.5" : "bg-[#fffaf0]"
      }`}
    >
      <span>{piece.id}</span>
      <span className="font-mono text-[#777168]">
        ({piece.x}, {piece.y})
      </span>
    </div>
  )
}

export default PuzzlePiece
