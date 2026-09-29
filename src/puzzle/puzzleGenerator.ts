import { EdgeShape, PieceEdges, PuzzlePiece, PuzzleGridConfig, PuzzleInstance } from './puzzleTypes';
import { PuzzleDefinition } from '../data/puzzles';

/**
 * Loads image from URL with rich procedural artwork if image is a 1x1 placeholder or fails
 */
export async function loadPuzzleImage(imageUrl: string, title: string): Promise<HTMLImageElement | HTMLCanvasElement> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      // If the image is a 1x1 placeholder, use the rich scenic artwork canvas
      if (img.width <= 10 || img.height <= 10) {
        console.log(`[PuzzleGenerator] Placeholder image detected for '${title}'. Rendering procedural scenery.`);
        const canvas = createFallbackArtCanvas(800, 500, title);
        resolve(canvas);
      } else {
        resolve(img);
      }
    };

    img.onerror = () => {
      console.warn(`[PuzzleGenerator] Image '${imageUrl}' could not be loaded. Generating procedural canvas.`);
      const canvas = createFallbackArtCanvas(800, 500, title);
      resolve(canvas);
    };

    img.src = imageUrl;
  });
}

/**
 * Generates an appealing, colorful procedural artwork canvas for each puzzle theme
 */
export function createFallbackArtCanvas(width: number, height: number, title: string): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const lowerTitle = title.toLowerCase();

  // Distinct color palettes based on puzzle theme
  let skyTop = '#1e3a8a';
  let skyBottom = '#60a5fa';
  let sunColor = '#fef08a';
  let terrainColor1 = '#064e3b';
  let terrainColor2 = '#022c22';

  if (lowerTitle.includes('waterfall')) {
    skyTop = '#0c4a6e';
    skyBottom = '#38bdf8';
    terrainColor1 = '#047857';
    terrainColor2 = '#064e3b';
  } else if (lowerTitle.includes('mountain')) {
    skyTop = '#4c1d95';
    skyBottom = '#f472b6';
    sunColor = '#fde047';
    terrainColor1 = '#334155';
    terrainColor2 = '#1e293b';
  } else if (lowerTitle.includes('beach')) {
    skyTop = '#991b1b';
    skyBottom = '#fb923c';
    sunColor = '#fef08a';
    terrainColor1 = '#0284c7';
    terrainColor2 = '#f59e0b';
  } else if (lowerTitle.includes('forest')) {
    skyTop = '#065f46';
    skyBottom = '#34d399';
    terrainColor1 = '#047857';
    terrainColor2 = '#022c22';
  } else if (lowerTitle.includes('city')) {
    skyTop = '#0f172a';
    skyBottom = '#6366f1';
    sunColor = '#f43f5e';
    terrainColor1 = '#1e1b4b';
    terrainColor2 = '#09090b';
  } else if (lowerTitle.includes('wildlife')) {
    skyTop = '#7c2d12';
    skyBottom = '#f59e0b';
    sunColor = '#fef08a';
    terrainColor1 = '#78350f';
    terrainColor2 = '#451a03';
  } else if (lowerTitle.includes('flowers')) {
    skyTop = '#4338ca';
    skyBottom = '#f472b6';
    sunColor = '#fef08a';
    terrainColor1 = '#16a34a';
    terrainColor2 = '#15803d';
  } else if (lowerTitle.includes('fantasy')) {
    skyTop = '#311042';
    skyBottom = '#a855f7';
    sunColor = '#38bdf8';
    terrainColor1 = '#471363';
    terrainColor2 = '#1a052b';
  }

  // 1. Sky Gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, height * 0.7);
  skyGrad.addColorStop(0, skyTop);
  skyGrad.addColorStop(1, skyBottom);
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Celestial Body (Sun / Moon)
  ctx.save();
  ctx.fillStyle = sunColor;
  ctx.shadowColor = sunColor;
  ctx.shadowBlur = 40;
  ctx.beginPath();
  ctx.arc(width * 0.72, height * 0.32, height * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. Mountains / Background Silhouette
  ctx.fillStyle = terrainColor1;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.65);
  ctx.lineTo(width * 0.2, height * 0.42);
  ctx.lineTo(width * 0.45, height * 0.62);
  ctx.lineTo(width * 0.7, height * 0.38);
  ctx.lineTo(width * 0.9, height * 0.58);
  ctx.lineTo(width, height * 0.5);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // 4. Foreground Hills / Waves
  ctx.fillStyle = terrainColor2;
  ctx.beginPath();
  ctx.moveTo(0, height * 0.75);
  ctx.bezierCurveTo(width * 0.35, height * 0.62, width * 0.65, height * 0.85, width, height * 0.7);
  ctx.lineTo(width, height);
  ctx.lineTo(0, height);
  ctx.closePath();
  ctx.fill();

  // 5. Scenic theme specifics (waterfall cascade, city buildings, or flowers)
  if (lowerTitle.includes('waterfall') || lowerTitle.includes('lake')) {
    // Cascading blue/white waterfall
    const waterGrad = ctx.createLinearGradient(width * 0.45, height * 0.42, width * 0.55, height);
    waterGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    waterGrad.addColorStop(1, 'rgba(56, 189, 248, 0.8)');
    ctx.fillStyle = waterGrad;
    ctx.beginPath();
    ctx.moveTo(width * 0.48, height * 0.45);
    ctx.lineTo(width * 0.52, height * 0.45);
    ctx.lineTo(width * 0.58, height);
    ctx.lineTo(width * 0.42, height);
    ctx.closePath();
    ctx.fill();
  } else if (lowerTitle.includes('city')) {
    // Skyscraper silhouettes
    ctx.fillStyle = '#0f172a';
    const numBuildings = 14;
    const bW = width / numBuildings;
    for (let i = 0; i < numBuildings; i++) {
      const bH = 120 + ((i * 37) % 160);
      ctx.fillRect(i * bW, height * 0.75 - bH, bW - 4, bH + 50);
      // Windows
      ctx.fillStyle = '#fef08a';
      for (let wy = height * 0.75 - bH + 10; wy < height * 0.75; wy += 20) {
        if ((i + wy) % 3 === 0) {
          ctx.fillRect(i * bW + 4, wy, 4, 8);
          ctx.fillRect(i * bW + 12, wy, 4, 8);
        }
      }
      ctx.fillStyle = '#0f172a';
    }
  }

  // 6. Title Banner Card
  ctx.save();
  ctx.fillStyle = 'rgba(15, 23, 42, 0.75)';
  const badgeW = width * 0.55;
  const badgeH = 75;
  const badgeX = (width - badgeW) / 2;
  const badgeY = height * 0.12;

  ctx.beginPath();
  ctx.roundRect ? ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 12) : ctx.rect(badgeX, badgeY, badgeW, badgeH);
  ctx.fill();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(title, width / 2, badgeY + 38);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px sans-serif';
  ctx.fillText('Luzzel Collaborative Puzzle Scene', width / 2, badgeY + 60);
  ctx.restore();

  return canvas;
}

/**
 * Generates complementary edges matrix for R rows and C columns
 */
export function generateEdgeMatrix(rows: number, cols: number): PieceEdges[][] {
  // Horizontal edges between piece (r, c) and piece (r, c+1)
  // Store right edge of (r, c): true for TAB, false for HOLE
  const verticalBorders: boolean[][] = [];
  for (let r = 0; r < rows; r++) {
    verticalBorders[r] = [];
    for (let c = 0; c < cols - 1; c++) {
      verticalBorders[r][c] = Math.random() < 0.5;
    }
  }

  // Vertical edges between piece (r, c) and piece (r+1, c)
  // Store bottom edge of (r, c): true for TAB, false for HOLE
  const horizontalBorders: boolean[][] = [];
  for (let r = 0; r < rows - 1; r++) {
    horizontalBorders[r] = [];
    for (let c = 0; c < cols; c++) {
      horizontalBorders[r][c] = Math.random() < 0.5;
    }
  }

  const matrix: PieceEdges[][] = [];

  for (let r = 0; r < rows; r++) {
    matrix[r] = [];
    for (let c = 0; c < cols; c++) {
      // Top edge
      let top: EdgeShape = 'FLAT';
      if (r > 0) {
        top = horizontalBorders[r - 1][c] ? 'HOLE' : 'TAB';
      }

      // Bottom edge
      let bottom: EdgeShape = 'FLAT';
      if (r < rows - 1) {
        bottom = horizontalBorders[r][c] ? 'TAB' : 'HOLE';
      }

      // Left edge
      let left: EdgeShape = 'FLAT';
      if (c > 0) {
        left = verticalBorders[r][c - 1] ? 'HOLE' : 'TAB';
      }

      // Right edge
      let right: EdgeShape = 'FLAT';
      if (c < cols - 1) {
        right = verticalBorders[r][c] ? 'TAB' : 'HOLE';
      }

      matrix[r][c] = { top, right, bottom, left };
    }
  }

  return matrix;
}

/**
 * Creates pieces and calculates board position + initial scattered positions
 */
export async function createPuzzleInstance(
  definition: PuzzleDefinition,
  workspaceWidth: number,
  workspaceHeight: number
): Promise<PuzzleInstance> {
  const image = await loadPuzzleImage(definition.image, definition.title);

  // Compute puzzle board dimensions fitting comfortably in workspace
  // Target board size takes ~60-70% of workspace, leaving margins for scattered pieces
  const maxBoardW = Math.min(workspaceWidth * 0.72, 900);
  const maxBoardH = Math.min(workspaceHeight * 0.78, 600);

  const imgAspect = (image.width || 800) / (image.height || 500);
  let boardWidth = maxBoardW;
  let boardHeight = boardWidth / imgAspect;

  if (boardHeight > maxBoardH) {
    boardHeight = maxBoardH;
    boardWidth = boardHeight * imgAspect;
  }

  const rows = definition.rows;
  const cols = definition.columns;
  const pieceWidth = boardWidth / cols;
  const pieceHeight = boardHeight / rows;

  // Center board in workspace
  const boardOffsetX = Math.max(20, (workspaceWidth - boardWidth) / 2);
  const boardOffsetY = Math.max(20, (workspaceHeight - boardHeight) / 2);

  const config: PuzzleGridConfig = {
    rows,
    columns: cols,
    boardWidth,
    boardHeight,
    boardOffsetX,
    boardOffsetY,
    workspaceWidth,
    workspaceHeight
  };

  const edgeMatrix = generateEdgeMatrix(rows, cols);
  const pieces: PuzzlePiece[] = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const id = `piece_${r}_${c}`;
      const correctX = boardOffsetX + c * pieceWidth;
      const correctY = boardOffsetY + r * pieceHeight;

      // Scatter piece randomly around the board area
      // Distribute pieces into margins (left, right, bottom, top) or outer workspace
      const scatterZone = Math.floor(Math.random() * 4);
      let randX = 0;
      let randY = 0;

      if (scatterZone === 0 && boardOffsetX > 120) {
        // Left margin
        randX = Math.random() * (boardOffsetX - pieceWidth - 10) + 10;
        randY = Math.random() * (workspaceHeight - pieceHeight - 20) + 10;
      } else if (scatterZone === 1 && workspaceWidth - (boardOffsetX + boardWidth) > 120) {
        // Right margin
        randX = boardOffsetX + boardWidth + 10 + Math.random() * (workspaceWidth - (boardOffsetX + boardWidth) - pieceWidth - 20);
        randY = Math.random() * (workspaceHeight - pieceHeight - 20) + 10;
      } else if (scatterZone === 2 && boardOffsetY > 80) {
        // Top margin
        randX = Math.random() * (workspaceWidth - pieceWidth - 20) + 10;
        randY = Math.random() * (boardOffsetY - pieceHeight - 10) + 10;
      } else {
        // Bottom or general scatter
        randX = Math.random() * (workspaceWidth - pieceWidth - 40) + 20;
        randY = Math.random() * (workspaceHeight - pieceHeight - 40) + 20;
      }

      pieces.push({
        id,
        originalRow: r,
        originalColumn: c,
        width: pieceWidth,
        height: pieceHeight,
        edges: edgeMatrix[r][c],
        x: Math.round(randX),
        y: Math.round(randY),
        rotation: 0,
        groupId: `group_${id}`,
        correctX,
        correctY,
        neighbors: {
          top: r > 0 ? `piece_${r - 1}_${c}` : undefined,
          bottom: r < rows - 1 ? `piece_${r + 1}_${c}` : undefined,
          left: c > 0 ? `piece_${r}_${c - 1}` : undefined,
          right: c < cols - 1 ? `piece_${r}_${c + 1}` : undefined
        }
      });
    }
  }

  return {
    definition,
    config,
    pieces,
    image,
    isCompleted: false
  };
}
