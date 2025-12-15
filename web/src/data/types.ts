// Game Modes
export enum GameMode {
  RACE_TO = "RACE_TO",
  FIRST_TO = "FIRST_TO",
  BEST_OF = "BEST_OF",
  FREE_PLAY = "FREE_PLAY",
  KILLER = "KILLER"
}

export const GameModeDisplayNames: Record<GameMode, string> = {
  [GameMode.RACE_TO]: "Race To",
  [GameMode.FIRST_TO]: "Sets Of",
  [GameMode.BEST_OF]: "Best Of",
  [GameMode.FREE_PLAY]: "Free Play",
  [GameMode.KILLER]: "Killer"
};

// Dish Types
export enum DishType {
  BREAK_DISH = "BREAK_DISH",
  REVERSE_DISH = "REVERSE_DISH",
  MISS = "MISS",
  TRICKSHOT_BLACK = "TRICKSHOT_BLACK"
}

export const DishTypeDisplayNames: Record<DishType, string> = {
  [DishType.BREAK_DISH]: "Break Dish",
  [DishType.REVERSE_DISH]: "Reverse Dish",
  [DishType.MISS]: "Miss",
  [DishType.TRICKSHOT_BLACK]: "Trickshot Black"
};

// Ball Colors
export enum BallColor {
  RED = "RED",
  YELLOW = "YELLOW",
  FOUL_BREAK = "FOUL_BREAK"
}

// Killer Mode Player
export interface KillerPlayer {
  id: string; // Unique identifier for each player
  name: string;
  normalizedName: string;
  lives: number;
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
  killerOptions?: {
    trickshotBlackEnabled: boolean;
  };
  killerPlayers?: KillerPlayer[];
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
  killerOptions?: {
    trickshotBlackEnabled: boolean;
  };
  killerPlayers?: KillerPlayer[];
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
  killerOptions?: {
    trickshotBlackEnabled: boolean;
  };
  killerPlayers?: Array<{
    name: string;
    normalizedName: string;
    lives: number;
  }>;
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
  killerOptions?: {
    trickshotBlackEnabled: boolean;
  };
  killerPlayers?: Array<{
    name: string;
    normalizedName: string;
    lives: number;
  }>;
}

