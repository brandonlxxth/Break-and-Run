import { supabase } from './supabase';
import { Game, ActiveGame, SerializableGame, SerializableActiveGame } from '../data/types';
import { gameRepository } from './GameRepository';

// This service handles API calls to Supabase
// Uses GameRepository for serialization via composition
export class ApiService {
  private repository = gameRepository;

  // Get current user ID from Supabase session
  private async getUserIdInternal(): Promise<string> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User not authenticated');
    }
    return user.id;
  }

  // Helper to access serialization methods
  private serializeGame = (game: Game) => (this.repository as any).serializeGame(game);
  private deserializeGame = (game: SerializableGame) => (this.repository as any).deserializeGame(game);
  private serializeActiveGame = (game: ActiveGame) => (this.repository as any).serializeActiveGame(game);
  private deserializeActiveGame = (game: SerializableActiveGame) => (this.repository as any).deserializeActiveGame(game);

  // Get all past games for the current user
  async getPastGames(): Promise<Game[]> {
    try {
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .order('date', { ascending: false });

      if (error) {
        console.error('Error in getPastGames:', error);
        return [];
      }

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
      const userId = await this.getUserIdInternal();
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
      
      const { error } = await supabase
        .from('games')
        .insert(dbGame);

      if (error) {
        console.error('Error in addGame:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in addGame:', error);
      throw error;
    }
  }

  // Delete a game
  async deleteGame(gameId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('games')
        .delete()
        .eq('id', gameId);

      if (error) {
        console.error('Error in deleteGame:', error);
        throw error;
      }
    } catch (error) {
      console.error('Error in deleteGame:', error);
      throw error;
    }
  }

  // Get active game for the current user
  async getActiveGame(): Promise<ActiveGame | null> {
    try {
      const { data, error } = await supabase
        .from('active_games')
        .select('*')
        .limit(1);

      if (error) {
        console.error('Error in getActiveGame:', error);
        return null;
      }

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
      if (activeGame === null) {
        // Delete active game - RLS will automatically filter by auth.uid()
        const { error } = await supabase
          .from('active_games')
          .delete();

        if (error) {
          console.error('Error deleting active game:', error);
          throw error;
        }
      } else {
        // Upsert active game
        const userId = await this.getUserIdInternal();
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
        
        const { error } = await supabase
          .from('active_games')
          .upsert(dbActiveGame, { onConflict: 'user_id' });

        if (error) {
          console.error('Error in saveActiveGame:', error);
          throw error;
        }
      }
    } catch (error) {
      console.error('Error in saveActiveGame:', error);
      throw error;
    }
  }
}

export const apiService = new ApiService();

