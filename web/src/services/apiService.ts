import { supabaseConfig } from './supabase';
import { Game, ActiveGame, SerializableGame, SerializableActiveGame } from '../data/types';
import { gameRepository } from './GameRepository';
import { authService } from './authService';

// This service handles API calls to Supabase
// Uses GameRepository for serialization via composition
export class ApiService {
  private userId: string | null = null;
  private repository = gameRepository;
  private _loggedToken: string | null = null; // Track logged token to avoid duplicate logs from React StrictMode

  // Set user ID for API calls (called from auth context)
  setUserId(userId: string | null) {
    this.userId = userId;
    this._loggedToken = null; // Reset when user changes
  }

  private getUserIdInternal(): string {
    if (!this.userId) {
      throw new Error('User not authenticated');
    }
    return this.userId;
  }

  // Make direct REST API calls to PostgREST instead of using Supabase client
  // This avoids issues with the client library interfering with custom JWTs
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = authService.getToken();
    if (!token) {
      throw new Error('No authentication token available');
    }

    // Debug: Log token once per unique request (avoid React StrictMode double logging)
    if (import.meta.env.DEV && !this._loggedToken) {
      this._loggedToken = token;
      console.log('JWT Token (first 50 chars):', token.substring(0, 50) + '...');
      // Decode JWT payload to verify structure (for debugging)
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('JWT Payload:', payload);
        console.log('JWT Secret must match Legacy JWT Secret from Supabase Dashboard');
      } catch (e) {
        console.error('Failed to decode JWT payload:', e);
      }
    }

    const url = `${supabaseConfig.supabaseUrl}/rest/v1${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseConfig.supabaseKey,
        'Authorization': `Bearer ${token}`,
        'Prefer': 'return=representation',
        ...options.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: response.statusText }));
      console.error('PostgREST Error:', error);
      console.error('Response Status:', response.status);
      console.error('Response Headers:', Object.fromEntries(response.headers.entries()));
      throw error;
    }

    if (response.status === 204 || response.headers.get('content-length') === '0') {
      return {} as T;
    }

    return response.json();
  }

  // Helper to access serialization methods
  private serializeGame = (game: Game) => (this.repository as any).serializeGame(game);
  private deserializeGame = (game: SerializableGame) => (this.repository as any).deserializeGame(game);
  private serializeActiveGame = (game: ActiveGame) => (this.repository as any).serializeActiveGame(game);
  private deserializeActiveGame = (game: SerializableActiveGame) => (this.repository as any).deserializeActiveGame(game);

  // Get all past games for the current user
  async getPastGames(): Promise<Game[]> {
    try {
      const data = await this.makeRequest<any[]>(`/games?select=*&order=date.desc`);

      if (!data || !Array.isArray(data)) return [];

      // Map database column names (snake_case) to our format
      const mappedData = data.map((dbGame: any) => ({
        id: dbGame.id,
        playerOneName: dbGame.player_one_name,
        playerTwoName: dbGame.player_two_name,
        playerOneScore: dbGame.player_one_score,
        playerTwoScore: dbGame.player_two_score,
        targetScore: dbGame.target_score,
        gameMode: dbGame.game_mode,
        winner: dbGame.winner,
        date: dbGame.date,
        startTime: dbGame.start_time,
        endTime: dbGame.end_time,
        frameHistory: dbGame.frame_history,
        playerOneSetsWon: dbGame.player_one_sets_won,
        playerTwoSetsWon: dbGame.player_two_sets_won,
        sets: dbGame.sets,
        breakPlayer: dbGame.break_player,
      }));

      // Deserialize games
      return mappedData.map((game: SerializableGame) => this.deserializeGame(game));
    } catch (error) {
      console.error('Error in getPastGames:', error);
      return [];
    }
  }

  // Add a completed game
  async addGame(game: Game): Promise<void> {
    try {
      const userId = this.getUserIdInternal();
      const serializableGame = this.serializeGame(game);
      
      // Map to database column names (snake_case)
      const dbGame = {
        id: serializableGame.id,
        user_id: userId,
        player_one_name: serializableGame.playerOneName,
        player_two_name: serializableGame.playerTwoName,
        player_one_score: serializableGame.playerOneScore,
        player_two_score: serializableGame.playerTwoScore,
        target_score: serializableGame.targetScore,
        game_mode: serializableGame.gameMode,
        winner: serializableGame.winner,
        date: serializableGame.date,
        start_time: serializableGame.startTime,
        end_time: serializableGame.endTime,
        frame_history: serializableGame.frameHistory,
        player_one_sets_won: serializableGame.playerOneSetsWon,
        player_two_sets_won: serializableGame.playerTwoSetsWon,
        sets: serializableGame.sets,
        break_player: serializableGame.breakPlayer,
      };
      
      await this.makeRequest('/games', {
        method: 'POST',
        body: JSON.stringify(dbGame),
      });
    } catch (error) {
      console.error('Error in addGame:', error);
      throw error;
    }
  }

  // Delete a game
  async deleteGame(gameId: string): Promise<void> {
    try {
      await this.makeRequest(`/games?id=eq.${gameId}`, {
        method: 'DELETE',
      });
    } catch (error) {
      console.error('Error in deleteGame:', error);
      throw error;
    }
  }

  // Get active game for the current user
  async getActiveGame(): Promise<ActiveGame | null> {
    try {
      const data = await this.makeRequest<any[]>(`/active_games?select=*`);

      if (!data || !Array.isArray(data) || data.length === 0) return null;
      
      const dbGame = data[0]; // Get first (and should be only) result

      // Map database column names (snake_case) to our format
      const mappedData = {
        id: dbGame.id,
        playerOneName: dbGame.player_one_name,
        playerTwoName: dbGame.player_two_name,
        playerOneScore: dbGame.player_one_score,
        playerTwoScore: dbGame.player_two_score,
        playerOneGamesWon: dbGame.player_one_games_won,
        playerTwoGamesWon: dbGame.player_two_games_won,
        targetScore: dbGame.target_score,
        gameMode: dbGame.game_mode,
        startTime: dbGame.start_time,
        frameHistory: dbGame.frame_history,
        playerOneSetsWon: dbGame.player_one_sets_won,
        playerTwoSetsWon: dbGame.player_two_sets_won,
        completedSets: dbGame.completed_sets,
        breakPlayer: dbGame.break_player,
        playerOneColor: dbGame.player_one_color,
        playerTwoColor: dbGame.player_two_color,
      };

      return this.deserializeActiveGame(mappedData as SerializableActiveGame);
    } catch (error) {
      console.error('Error in getActiveGame:', error);
      return null;
    }
  }

  // Save active game
  async saveActiveGame(activeGame: ActiveGame | null): Promise<void> {
    try {
      const userId = this.getUserIdInternal();
      
      if (activeGame === null) {
        // Delete active game
        await this.makeRequest('/active_games', {
          method: 'DELETE',
        });
      } else {
        // Upsert active game
        const serializableActiveGame = this.serializeActiveGame(activeGame);
        
        // Map to database column names (snake_case)
        const dbActiveGame = {
          id: serializableActiveGame.id,
          user_id: userId,
          player_one_name: serializableActiveGame.playerOneName,
          player_two_name: serializableActiveGame.playerTwoName,
          player_one_score: serializableActiveGame.playerOneScore,
          player_two_score: serializableActiveGame.playerTwoScore,
          player_one_games_won: serializableActiveGame.playerOneGamesWon,
          player_two_games_won: serializableActiveGame.playerTwoGamesWon,
          target_score: serializableActiveGame.targetScore,
          game_mode: serializableActiveGame.gameMode,
          start_time: serializableActiveGame.startTime,
          frame_history: serializableActiveGame.frameHistory,
          player_one_sets_won: serializableActiveGame.playerOneSetsWon,
          player_two_sets_won: serializableActiveGame.playerTwoSetsWon,
          completed_sets: serializableActiveGame.completedSets,
          break_player: serializableActiveGame.breakPlayer,
          player_one_color: serializableActiveGame.playerOneColor,
          player_two_color: serializableActiveGame.playerTwoColor,
        };
        
        await this.makeRequest('/active_games', {
          method: 'POST',
          headers: {
            'Prefer': 'resolution=merge-duplicates',
          },
          body: JSON.stringify(dbActiveGame),
        });
      }
    } catch (error) {
      console.error('Error in saveActiveGame:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();

