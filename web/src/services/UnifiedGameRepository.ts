import { Game, ActiveGame } from '../data/types';
import { gameRepository } from './GameRepository';
import { apiService } from './apiService';

// Unified repository that uses API when authenticated, localStorage when not
export class UnifiedGameRepository {
  private useApi: boolean = false;

  setUseApi(useApi: boolean) {
    this.useApi = useApi;
  }

  // Get all past games
  async getPastGames(): Promise<Game[]> {
    if (this.useApi) {
      return await apiService.getPastGames();
    } else {
      return gameRepository.getPastGames();
    }
  }

  // Add a completed game
  async addGame(game: Game): Promise<void> {
    if (this.useApi) {
      await apiService.addGame(game);
    } else {
      gameRepository.addGame(game);
    }
  }

  // Delete a game
  async deleteGame(gameId: string): Promise<void> {
    if (this.useApi) {
      await apiService.deleteGame(gameId);
    } else {
      gameRepository.deleteGame(gameId);
    }
  }

  // Get active game
  async getActiveGame(): Promise<ActiveGame | null> {
    if (this.useApi) {
      return await apiService.getActiveGame();
    } else {
      return gameRepository.getActiveGame();
    }
  }

  // Save active game
  async saveActiveGame(activeGame: ActiveGame | null): Promise<void> {
    if (this.useApi) {
      try {
        await apiService.saveActiveGame(activeGame);
      } catch (error) {
        // If API fails due to auth or RLS, fall back to localStorage
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('not authenticated') || 
            errorMessage.includes('row-level security') ||
            errorMessage.includes('42501') ||
            errorMessage.includes('PGRST')) {
          gameRepository.saveActiveGame(activeGame);
        } else {
          // For other errors, still fall back to localStorage
          gameRepository.saveActiveGame(activeGame);
        }
      }
    } else {
      gameRepository.saveActiveGame(activeGame);
    }
  }
}

export const unifiedGameRepository = new UnifiedGameRepository();


