export interface PuzzleDefinition {
  id: string;
  title: string;
  image: string;
  difficulty: 'easy' | 'medium' | 'hard';
  rows: number;
  columns: number;
  description?: string;
}

export const PUZZLES: PuzzleDefinition[] = [
  {
    id: "waterfall",
    title: "Hidden Waterfall",
    image: "/puzzles/01-waterfall.jpg",
    difficulty: "easy",
    rows: 5,
    columns: 10,
    description: "A serene cascading waterfall nestled in a tropical rainforest."
  },
  {
    id: "mountain",
    title: "Alpine Mountain Peak",
    image: "/puzzles/02-mountain.jpg",
    difficulty: "easy",
    rows: 5,
    columns: 10,
    description: "Dramatic snow-covered peaks catching the early morning sunlight."
  },
  {
    id: "beach",
    title: "Tropical Sunset Beach",
    image: "/puzzles/03-beach.jpg",
    difficulty: "easy",
    rows: 5,
    columns: 10,
    description: "Warm golden waves washing over gentle sandy shores under palm trees."
  },
  {
    id: "forest",
    title: "Emerald Forest Path",
    image: "/puzzles/04-forest.jpg",
    difficulty: "easy",
    rows: 5,
    columns: 10,
    description: "Sunlight filtering through ancient pine and redwood canopies."
  },
  {
    id: "lake",
    title: "Crystal Mountain Lake",
    image: "/puzzles/05-lake.jpg",
    difficulty: "easy",
    rows: 5,
    columns: 10,
    description: "Mirror-like turquoise glacial waters reflecting pine hills."
  },
  {
    id: "city",
    title: "Metropolis Skyline",
    image: "/puzzles/06-city.jpg",
    difficulty: "easy",
    rows: 5,
    columns: 10,
    description: "Gleaming skyscraper lights reflecting across evening city waters."
  },
  {
    id: "wildlife",
    title: "Savannah Wildlife",
    image: "/puzzles/07-wildlife.jpg",
    difficulty: "easy",
    rows: 5,
    columns: 10,
    description: "Majestic animals gathering around the watering hole at dusk."
  },
  {
    id: "flowers",
    title: "Spring Wildflowers",
    image: "/puzzles/08-flowers.jpg",
    difficulty: "easy",
    rows: 5,
    columns: 10,
    description: "A vibrant blooming meadow bursting with color in springtime."
  },
  {
    id: "village",
    title: "European Old Village",
    image: "/puzzles/09-village.jpg",
    difficulty: "easy",
    rows: 5,
    columns: 10,
    description: "Cobblestone alleys and cozy rustic cottages amidst rolling green hills."
  },
  {
    id: "fantasy",
    title: "Fantasy Floating Island",
    image: "/puzzles/10-fantasy.jpg",
    difficulty: "easy",
    rows: 5,
    columns: 10,
    description: "Mystical floating islands suspended in a twilight starlit cosmos."
  }
];

export function getPuzzleById(id: string): PuzzleDefinition {
  return PUZZLES.find(p => p.id.toLowerCase() === id.toLowerCase()) || PUZZLES[0];
}
