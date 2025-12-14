// Game Modes
export enum GameMode {
  RACE_TO = "RACE_TO",
  FIRST_TO = "FIRST_TO",
  BEST_OF = "BEST_OF",
  FREE_PLAY = "FREE_PLAY"
}

export const GameModeDisplayNames: Record<GameMode, string> = {
  [GameMode.RACE_TO]: "Race to",
  [GameMode.FIRST_TO]: "Sets of",
  [GameMode.BEST_OF]: "Best of",
  [GameMode.FREE_PLAY]: "Free Play"
};

// Dish Types
export enum DishType {
  BREAK_DISH = "BREAK_DISH",
  REVERSE_DISH = "REVERSE_DISH"
}

export const DishTypeDisplayNames: Record<DishType, string> = {
  [DishType.BREAK_DISH]: "Break Dish",
  [DishType.REVERSE_DISH]: "Reverse Dish"
};

// Ball Colors
export enum BallColor {
  RED = "RED",
  YELLOW = "YELLOW",
  FOUL_BREAK = "FOUL_BREAK"
}

// Frame - represents a single score change
export interface Frame {
  timestamp: Date;
  player: string;
  scoreChange: number;
  playerOneScore: number;
  playerTwoScore: number;
  dishType?: DishType;
}

// Set - for "Sets of" mode
export interface Set {
  setNumber: number;
  playerOneScore: number;
  playerTwoScore: number;
  winner: string | null;
  frames: Frame[];
}

// Game - completed game
export interface Game {
  id: string;
  playerOneName: string;
  playerTwoName: string;
  playerOneScore: number;
  playerTwoScore: number;
  targetScore: number;
  gameMode: GameMode;
  winner: string | null;
  date: Date;
  startTime: Date;
  endTime: Date;
  frameHistory: Frame[];
  playerOneSetsWon: number;
  playerTwoSetsWon: number;
  sets: Set[];
  breakPlayer: string | null;
}

// ActiveGame - game in progress
export interface ActiveGame {
  id: string;
  playerOneName: string;
  playerTwoName: string;
  playerOneScore: number;
  playerTwoScore: number;
  playerOneGamesWon: number;
  playerTwoGamesWon: number;
  targetScore: number;
  gameMode: GameMode;
  startTime: Date;
  frameHistory: Frame[];
  playerOneSetsWon: number;
  playerTwoSetsWon: number;
  completedSets: Set[];
  breakPlayer: string | null;
  playerOneColor: BallColor | null;
  playerTwoColor: BallColor | null;
}

// Serializable versions for localStorage
export interface SerializableFrame {
  timestamp: number;
  player: string;
  scoreChange: number;
  playerOneScore: number;
  playerTwoScore: number;
  dishType?: string;
}

export interface SerializableSet {
  setNumber: number;
  playerOneScore: number;
  playerTwoScore: number;
  winner: string | null;
  frames: SerializableFrame[];
}

export interface SerializableGame {
  id: string;
  playerOneName: string;
  playerTwoName: string;
  playerOneScore: number;
  playerTwoScore: number;
  targetScore: number;
  gameMode: string;
  winner: string | null;
  date: number;
  startTime: number;
  endTime: number;
  frameHistory: SerializableFrame[];
  playerOneSetsWon: number;
  playerTwoSetsWon: number;
  sets: SerializableSet[];
  breakPlayer: string | null;
}

export interface SerializableActiveGame {
  id: string;
  playerOneName: string;
  playerTwoName: string;
  playerOneScore: number;
  playerTwoScore: number;
  playerOneGamesWon: number;
  playerTwoGamesWon: number;
  targetScore: number;
  gameMode: string;
  startTime: number;
  frameHistory: SerializableFrame[];
  playerOneSetsWon: number;
  playerTwoSetsWon: number;
  completedSets: SerializableSet[];
  breakPlayer: string | null;
  playerOneColor: string | null;
  playerTwoColor: string | null;
}

