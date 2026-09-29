import { PuzzleDefinition } from '../data/puzzles';

export type EdgeShape = 'FLAT' | 'TAB' | 'HOLE';

export interface PieceEdges {
  top: EdgeShape;
  right: EdgeShape;
  bottom: EdgeShape;
  left: EdgeShape;
}

export interface Neighbors {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

export interface PuzzlePiece {
  id: string;
  originalRow: number;
  originalColumn: number;
  width: number;
  height: number;
  edges: PieceEdges;
  x: number; // Current board X position
  y: number; // Current board Y position
  rotation: number; // For MVP rotation is 0
  groupId: string; // Group ID for multi-piece connected clusters
  correctX: number; // Target assembled X position on the board
  correctY: number; // Target assembled Y position on the board
  neighbors: Neighbors;
}

export interface PuzzleGridConfig {
  rows: number;
  columns: number;
  boardWidth: number;
  boardHeight: number;
  boardOffsetX: number;
  boardOffsetY: number;
  workspaceWidth: number;
  workspaceHeight: number;
}

export interface PuzzleInstance {
  definition: PuzzleDefinition;
  config: PuzzleGridConfig;
  pieces: PuzzlePiece[];
  image: HTMLImageElement | HTMLCanvasElement;
  isCompleted: boolean;
}
