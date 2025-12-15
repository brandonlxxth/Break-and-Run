import {
  Game,
  ActiveGame,
  SerializableGame,
  SerializableActiveGame,
  SerializableFrame,
  SerializableSet,
  GameMode,
  DishType,
  BallColor,
  Frame,
  Set
} from '../data/types';

const GAMES_KEY = 'past_games';
const ACTIVE_GAME_KEY = 'active_game';

// Future: This can be extended to use a backend API
// For now, it uses localStorage but the interface is ready for async operations
export class GameRepository {
  // Get all past games
  getPastGames(): Game[] {
    try {
      const gamesJson = localStorage.getItem(GAMES_KEY);
      if (!gamesJson || gamesJson === '[]') {
        return [];
      }
      const serializableGames: SerializableGame[] = JSON.parse(gamesJson);
      return serializableGames.map(game => this.deserializeGame(game));
    } catch (e) {
      console.error('Error loading games:', e);
      return [];
    }
  }

  // Add a completed game
  addGame(game: Game): void {
    try {
      const currentGames = this.getPastGames();
      const updatedGames = [...currentGames, game];
      const serializableGames = updatedGames.map(g => this.serializeGame(g));
      localStorage.setItem(GAMES_KEY, JSON.stringify(serializableGames));
    } catch (e) {
      console.error('Error saving game:', e);
      throw e;
    }
  }

  // Delete a game
  deleteGame(gameId: string): void {
    try {
      const currentGames = this.getPastGames();
      const updatedGames = currentGames.filter(g => g.id !== gameId);
      const serializableGames = updatedGames.map(g => this.serializeGame(g));
      localStorage.setItem(GAMES_KEY, JSON.stringify(serializableGames));
    } catch (e) {
      console.error('Error deleting game:', e);
      throw e;
    }
  }

  // Get active game
  getActiveGame(): ActiveGame | null {
    try {
      const activeGameJson = localStorage.getItem(ACTIVE_GAME_KEY);
      if (!activeGameJson) {
        return null;
      }
      const serializableActiveGame: SerializableActiveGame = JSON.parse(activeGameJson);
      return this.deserializeActiveGame(serializableActiveGame);
    } catch (e) {
      console.error('Error loading active game:', e);
      return null;
    }
  }

  // Save active game
  saveActiveGame(activeGame: ActiveGame | null): void {
    try {
      if (activeGame === null) {
        localStorage.removeItem(ACTIVE_GAME_KEY);
      } else {
        const serializableActiveGame = this.serializeActiveGame(activeGame);
        localStorage.setItem(ACTIVE_GAME_KEY, JSON.stringify(serializableActiveGame));
      }
    } catch (e) {
      console.error('Error saving active game:', e);
      throw e;
    }
  }

  // Serialization helpers
  private serializeFrame(frame: Frame): SerializableFrame {
    return {
      timestamp: frame.timestamp.getTime(),
      player: frame.player,
      scoreChange: frame.scoreChange,
      playerOneScore: frame.playerOneScore,
      playerTwoScore: frame.playerTwoScore,
      dishType: frame.dishType || undefined
    };
  }

  private deserializeFrame(frame: SerializableFrame): Frame {
    let dishType: DishType | undefined = undefined;
    if (frame.dishType) {
      // Validate that the dishType is a valid enum value
      if (Object.values(DishType).includes(frame.dishType as DishType)) {
        dishType = frame.dishType as DishType;
      } else {
        console.warn(`Invalid dishType: ${frame.dishType}`);
      }
    }
    return {
      timestamp: new Date(frame.timestamp),
      player: frame.player,
      scoreChange: frame.scoreChange,
      playerOneScore: frame.playerOneScore,
      playerTwoScore: frame.playerTwoScore,
      dishType
    };
  }

  private serializeSet(set: Set): SerializableSet {
    return {
      setNumber: set.setNumber,
      playerOneScore: set.playerOneScore,
      playerTwoScore: set.playerTwoScore,
      winner: set.winner,
      frames: set.frames.map(f => this.serializeFrame(f))
    };
  }

  private deserializeSet(set: SerializableSet): Set {
    return {
      setNumber: set.setNumber,
      playerOneScore: set.playerOneScore,
      playerTwoScore: set.playerTwoScore,
      winner: set.winner,
      frames: set.frames.map(f => this.deserializeFrame(f))
    };
  }

  private serializeGame(game: Game): SerializableGame {
    return {
      id: game.id,
      playerOneName: game.playerOneName,
      playerTwoName: game.playerTwoName,
      playerOneScore: game.playerOneScore,
      playerTwoScore: game.playerTwoScore,
      targetScore: game.targetScore,
      gameMode: game.gameMode,
      winner: game.winner,
      date: game.date.getTime(),
      startTime: game.startTime.getTime(),
      endTime: game.endTime.getTime(),
      frameHistory: game.frameHistory.map(f => this.serializeFrame(f)),
      playerOneSetsWon: game.playerOneSetsWon,
      playerTwoSetsWon: game.playerTwoSetsWon,
      sets: game.sets.map(s => this.serializeSet(s)),
      breakPlayer: game.breakPlayer
    };
  }

  private deserializeGame(game: SerializableGame): Game {
    return {
      id: game.id,
      playerOneName: game.playerOneName,
      playerTwoName: game.playerTwoName,
      playerOneScore: game.playerOneScore,
      playerTwoScore: game.playerTwoScore,
      targetScore: game.targetScore,
      gameMode: game.gameMode as GameMode,
      winner: game.winner,
      date: new Date(game.date),
      startTime: new Date(game.startTime),
      endTime: new Date(game.endTime),
      frameHistory: game.frameHistory.map(f => this.deserializeFrame(f)),
      playerOneSetsWon: game.playerOneSetsWon,
      playerTwoSetsWon: game.playerTwoSetsWon,
      sets: game.sets.map(s => this.deserializeSet(s)),
      breakPlayer: game.breakPlayer,
      killerOptions: game.killerOptions,
      killerPlayers: game.killerPlayers ? game.killerPlayers.map((p: any) => ({
        ...p,
        id: p.id || crypto.randomUUID(), // Add id if missing (backward compatibility)
      })) : undefined
    };
  }

  private serializeActiveGame(activeGame: ActiveGame): SerializableActiveGame {
    return {
      id: activeGame.id,
      playerOneName: activeGame.playerOneName,
      playerTwoName: activeGame.playerTwoName,
      playerOneScore: activeGame.playerOneScore,
      playerTwoScore: activeGame.playerTwoScore,
      playerOneGamesWon: activeGame.playerOneGamesWon,
      playerTwoGamesWon: activeGame.playerTwoGamesWon,
      targetScore: activeGame.targetScore,
      gameMode: activeGame.gameMode,
      startTime: activeGame.startTime.getTime(),
      frameHistory: activeGame.frameHistory.map(f => this.serializeFrame(f)),
      playerOneSetsWon: activeGame.playerOneSetsWon,
      playerTwoSetsWon: activeGame.playerTwoSetsWon,
      completedSets: activeGame.completedSets.map(s => this.serializeSet(s)),
      breakPlayer: activeGame.breakPlayer,
      playerOneColor: activeGame.playerOneColor,
      playerTwoColor: activeGame.playerTwoColor,
      killerOptions: activeGame.killerOptions,
      killerPlayers: activeGame.killerPlayers
    };
  }

  private deserializeActiveGame(activeGame: SerializableActiveGame): ActiveGame {
    return {
      id: activeGame.id,
      playerOneName: activeGame.playerOneName,
      playerTwoName: activeGame.playerTwoName,
      playerOneScore: activeGame.playerOneScore,
      playerTwoScore: activeGame.playerTwoScore,
      playerOneGamesWon: activeGame.playerOneGamesWon,
      playerTwoGamesWon: activeGame.playerTwoGamesWon,
      targetScore: activeGame.targetScore,
      gameMode: activeGame.gameMode as GameMode,
      startTime: new Date(activeGame.startTime),
      frameHistory: activeGame.frameHistory.map(f => this.deserializeFrame(f)),
      playerOneSetsWon: activeGame.playerOneSetsWon,
      playerTwoSetsWon: activeGame.playerTwoSetsWon,
      completedSets: activeGame.completedSets.map(s => this.deserializeSet(s)),
      breakPlayer: activeGame.breakPlayer,
      playerOneColor: activeGame.playerOneColor ? (activeGame.playerOneColor as BallColor) : null,
      playerTwoColor: activeGame.playerTwoColor ? (activeGame.playerTwoColor as BallColor) : null,
      killerOptions: activeGame.killerOptions,
      killerPlayers: activeGame.killerPlayers ? activeGame.killerPlayers.map((p: any) => ({
        ...p,
        id: p.id || crypto.randomUUID(), // Add id if missing (backward compatibility)
      })) : undefined
    };
  }
}

// Export singleton instance
export const gameRepository = new GameRepository();

