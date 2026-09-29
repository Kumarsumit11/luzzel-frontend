import { EdgeShape, PieceEdges } from './puzzleTypes';

export interface Point {
  x: number;
  y: number;
}

/**
 * Draws a single jigsaw edge on a Canvas Path2D or CanvasRenderingContext2D
 * @param path The Path2D or Context
 * @param p0 Start point of the edge
 * @param p1 End point of the edge
 * @param edgeType 'FLAT' | 'TAB' | 'HOLE'
 * @param tabDepthRatio Protrusion depth of the tab/hole relative to edge length (default: 0.20)
 */
export function drawJigsawEdge(
  path: Path2D | CanvasRenderingContext2D,
  p0: Point,
  p1: Point,
  edgeType: EdgeShape,
  tabDepthRatio: number = 0.20
) {
  if (edgeType === 'FLAT') {
    path.lineTo(p1.x, p1.y);
    return;
  }

  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const length = Math.hypot(dx, dy);

  if (length === 0) {
    path.lineTo(p1.x, p1.y);
    return;
  }

  // Unit vector along the edge
  const ux = dx / length;
  const uy = dy / length;

  // Normal vector pointing "outward" (to the right of the direction vector)
  // For clockwise winding:
  // Top (L->R, ux=1, uy=0): normal = (0, -1) [Up]
  // Right (T->B, ux=0, uy=1): normal = (1, 0) [Right]
  // Bottom (R->L, ux=-1, uy=0): normal = (0, 1) [Down]
  // Left (B->T, ux=0, uy=-1): normal = (-1, 0) [Left]
  const nx = -uy;
  const ny = ux;

  // Sign: TAB protrudes outward (+1), HOLE indents inward (-1)
  const sign = edgeType === 'TAB' ? 1 : -1;

  // Helper to calculate coordinate along edge (s in [0..1]) and offset along normal (d in [-1..1])
  const getPoint = (s: number, d: number): Point => {
    return {
      x: p0.x + ux * (s * length) + nx * (d * length * tabDepthRatio * sign),
      y: p0.y + uy * (s * length) + ny * (d * length * tabDepthRatio * sign)
    };
  };

  // Standard smooth jigsaw tab profile using 3 cubic Bezier segments
  // Segment 1: baseline to neck base
  const cp1 = getPoint(0.35, 0.0);
  const cp2 = getPoint(0.38, -0.05); // slight inward tuck at neck base
  const pNeck1 = getPoint(0.40, 0.15); // neck start
  path.bezierCurveTo(cp1.x, cp1.y, cp2.x, cp2.y, pNeck1.x, pNeck1.y);

  // Segment 2: head bulb of the tab
  const cHead1 = getPoint(0.42, 0.85); // outer bulb corner 1
  const cHead2 = getPoint(0.58, 0.85); // outer bulb corner 2
  const pNeck2 = getPoint(0.60, 0.15); // neck return
  path.bezierCurveTo(cHead1.x, cHead1.y, cHead2.x, cHead2.y, pNeck2.x, pNeck2.y);

  // Segment 3: neck base return to baseline
  const cp3 = getPoint(0.62, -0.05);
  const cp4 = getPoint(0.65, 0.0);
  path.bezierCurveTo(cp3.x, cp3.y, cp4.x, cp4.y, p1.x, p1.y);
}

/**
 * Creates a Path2D representing the full closed outline of a piece in local coordinates (0..w, 0..h).
 * Can be reused for clipping and hit testing.
 */
export function createPiecePath(width: number, height: number, edges: PieceEdges): Path2D {
  const path = new Path2D();

  const topLeft: Point = { x: 0, y: 0 };
  const topRight: Point = { x: width, y: 0 };
  const bottomRight: Point = { x: width, y: height };
  const bottomLeft: Point = { x: 0, y: height };

  path.moveTo(topLeft.x, topLeft.y);

  // Top edge (Left to Right)
  drawJigsawEdge(path, topLeft, topRight, edges.top);

  // Right edge (Top to Bottom)
  drawJigsawEdge(path, topRight, bottomRight, edges.right);

  // Bottom edge (Right to Left)
  drawJigsawEdge(path, bottomRight, bottomLeft, edges.bottom);

  // Left edge (Bottom to Top)
  drawJigsawEdge(path, bottomLeft, topLeft, edges.left);

  path.closePath();
  return path;
}
