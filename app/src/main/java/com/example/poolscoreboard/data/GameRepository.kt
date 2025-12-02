package com.example.poolscoreboard.data

import android.content.Context
import androidx.datastore.core.DataStore
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.edit
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.datastore.preferences.preferencesDataStore
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.map
import kotlinx.serialization.Serializable
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import java.util.Date
import java.util.UUID

private val Context.dataStore: DataStore<Preferences> by preferencesDataStore(name = "games")
private val GAMES_KEY = stringPreferencesKey("past_games")
private val ACTIVE_GAME_KEY = stringPreferencesKey("active_game")

@Serializable
data class SerializableFrame(
    val timestamp: Long,
    val player: String,
    val scoreChange: Int,
    val playerOneScore: Int,
    val playerTwoScore: Int,
    val dishType: String? = null
)

@Serializable
data class SerializableSet(
    val setNumber: Int,
    val playerOneScore: Int,
    val playerTwoScore: Int,
    val winner: String?,
    val frames: List<SerializableFrame>
)

@Serializable
data class SerializableGame(
    val id: String,
    val playerOneName: String,
    val playerTwoName: String,
    val playerOneScore: Int,
    val playerTwoScore: Int,
    val targetScore: Int,
    val gameMode: String,
    val winner: String?,
    val date: Long,
    val startTime: Long,
    val endTime: Long,
    val frameHistory: List<SerializableFrame>,
    val playerOneSetsWon: Int = 0,
    val playerTwoSetsWon: Int = 0,
    val sets: List<SerializableSet> = emptyList(),
    val breakPlayer: String? = null
)

@Serializable
data class SerializableActiveGame(
    val id: String,
    val playerOneName: String,
    val playerTwoName: String,
    val playerOneScore: Int,
    val playerTwoScore: Int,
    val playerOneGamesWon: Int,
    val playerTwoGamesWon: Int,
    val targetScore: Int,
    val gameMode: String,
    val startTime: Long,
    val frameHistory: List<SerializableFrame>,
    val playerOneSetsWon: Int = 0,
    val playerTwoSetsWon: Int = 0,
    val completedSets: List<SerializableSet> = emptyList(),
    val breakPlayer: String? = null
)

class GameRepository(private val context: Context) {
    private val json = Json { 
        ignoreUnknownKeys = true
        encodeDefaults = true
        explicitNulls = true
    }

    val pastGames: Flow<List<Game>> = context.dataStore.data.map { preferences ->
        val gamesJson = preferences[GAMES_KEY] ?: "[]"
        try {
            if (gamesJson.isBlank() || gamesJson == "[]") {
                emptyList()
            } else {
                val serializableGames = json.decodeFromString<List<SerializableGame>>(gamesJson)
                serializableGames.map { it.toGame() }
            }
        } catch (e: Exception) {
            // Log error but return empty list to prevent crashes
            android.util.Log.e("GameRepository", "Error loading games: ${e.message}", e)
            emptyList()
        }
    }

    suspend fun saveGames(games: List<Game>) {
        context.dataStore.edit { preferences ->
            val serializableGames = games.map { it.toSerializable() }
            val gamesJson = json.encodeToString(serializableGames)
            preferences[GAMES_KEY] = gamesJson
        }
    }

    suspend fun addGame(game: Game) {
        try {
            android.util.Log.d("GameRepository", "Adding game: winner=${game.winner}, p1Score=${game.playerOneScore}, p2Score=${game.playerTwoScore}, mode=${game.gameMode}")
            context.dataStore.edit { preferences ->
                val gamesJson = preferences[GAMES_KEY] ?: "[]"
                val currentGames = try {
                    if (gamesJson.isBlank() || gamesJson == "[]") {
                        emptyList()
                    } else {
                        val serializableGames = json.decodeFromString<List<SerializableGame>>(gamesJson)
                        serializableGames.map { it.toGame() }
                    }
                } catch (e: Exception) {
                    android.util.Log.e("GameRepository", "Error parsing existing games: ${e.message}", e)
                    emptyList()
                }
                val updatedGames = currentGames + game
                val serializableGames = updatedGames.map { it.toSerializable() }
                val updatedJson = json.encodeToString(serializableGames)
                preferences[GAMES_KEY] = updatedJson
                android.util.Log.d("GameRepository", "Saved game successfully. Total games: ${updatedGames.size}, winner=${game.winner}")
            }
        } catch (e: Exception) {
            android.util.Log.e("GameRepository", "Error saving game: ${e.message}", e)
            android.util.Log.e("GameRepository", "Game details: winner=${game.winner}, p1Score=${game.playerOneScore}, p2Score=${game.playerTwoScore}")
            throw e
        }
    }

    suspend fun deleteGame(gameId: String) {
        try {
            context.dataStore.edit { preferences ->
                val gamesJson = preferences[GAMES_KEY] ?: "[]"
                val currentGames = try {
                    if (gamesJson.isBlank() || gamesJson == "[]") {
                        emptyList()
                    } else {
                        val serializableGames = json.decodeFromString<List<SerializableGame>>(gamesJson)
                        serializableGames.map { it.toGame() }
                    }
                } catch (e: Exception) {
                    android.util.Log.e("GameRepository", "Error parsing existing games: ${e.message}", e)
                    emptyList()
                }
                val updatedGames = currentGames.filter { it.id != gameId }
                val serializableGames = updatedGames.map { it.toSerializable() }
                val updatedJson = json.encodeToString(serializableGames)
                preferences[GAMES_KEY] = updatedJson
                android.util.Log.d("GameRepository", "Deleted game. Total games: ${updatedGames.size}")
            }
        } catch (e: Exception) {
            android.util.Log.e("GameRepository", "Error deleting game: ${e.message}", e)
            throw e
        }
    }

    val activeGame: Flow<ActiveGame?> = context.dataStore.data.map { preferences ->
        val activeGameJson = preferences[ACTIVE_GAME_KEY]
        try {
            if (activeGameJson.isNullOrBlank()) {
                null
            } else {
                val serializableActiveGame = json.decodeFromString<SerializableActiveGame>(activeGameJson)
                serializableActiveGame.toActiveGame()
            }
        } catch (e: Exception) {
            android.util.Log.e("GameRepository", "Error loading active game: ${e.message}", e)
            null
        }
    }

    suspend fun saveActiveGame(activeGame: ActiveGame?) {
        try {
            context.dataStore.edit { preferences ->
                if (activeGame == null) {
                    preferences.remove(ACTIVE_GAME_KEY)
                    android.util.Log.d("GameRepository", "Cleared active game")
                } else {
                    val serializableActiveGame = activeGame.toSerializable()
                    val activeGameJson = json.encodeToString(serializableActiveGame)
                    preferences[ACTIVE_GAME_KEY] = activeGameJson
                    android.util.Log.d("GameRepository", "Saved active game: ${activeGame.id}")
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("GameRepository", "Error saving active game: ${e.message}", e)
            throw e
        }
    }

    private fun Set.toSerializable(): SerializableSet {
        return SerializableSet(
            setNumber = setNumber,
            playerOneScore = playerOneScore,
            playerTwoScore = playerTwoScore,
            winner = winner,
            frames = frames.map { frame ->
                SerializableFrame(
                    timestamp = frame.timestamp.time,
                    player = frame.player,
                    scoreChange = frame.scoreChange,
                    playerOneScore = frame.playerOneScore,
                    playerTwoScore = frame.playerTwoScore,
                    dishType = frame.dishType?.name
                )
            }
        )
    }

    private fun Game.toSerializable(): SerializableGame {
        return SerializableGame(
            id = id,
            playerOneName = playerOneName,
            playerTwoName = playerTwoName,
            playerOneScore = playerOneScore,
            playerTwoScore = playerTwoScore,
            targetScore = targetScore,
            gameMode = gameMode.name,
            winner = winner,
            date = date.time,
            startTime = startTime.time,
            endTime = endTime.time,
            frameHistory = frameHistory.map { frame ->
                SerializableFrame(
                    timestamp = frame.timestamp.time,
                    player = frame.player,
                    scoreChange = frame.scoreChange,
                    playerOneScore = frame.playerOneScore,
                    playerTwoScore = frame.playerTwoScore,
                    dishType = frame.dishType?.name
                )
            },
            playerOneSetsWon = playerOneSetsWon,
            playerTwoSetsWon = playerTwoSetsWon,
            sets = sets.map { it.toSerializable() },
            breakPlayer = breakPlayer
        )
    }

    private fun SerializableSet.toSet(): Set {
        return Set(
            setNumber = setNumber,
            playerOneScore = playerOneScore,
            playerTwoScore = playerTwoScore,
            winner = winner,
            frames = frames.map { frame ->
                Frame(
                    timestamp = Date(frame.timestamp),
                    player = frame.player,
                    scoreChange = frame.scoreChange,
                    playerOneScore = frame.playerOneScore,
                    playerTwoScore = frame.playerTwoScore,
                    dishType = frame.dishType?.let { 
                        try {
                            DishType.valueOf(it)
                        } catch (e: Exception) {
                            null
                        }
                    }
                )
            }
        )
    }

    private fun SerializableGame.toGame(): Game {
        return Game(
            id = id,
            playerOneName = playerOneName,
            playerTwoName = playerTwoName,
            playerOneScore = playerOneScore,
            playerTwoScore = playerTwoScore,
            targetScore = targetScore,
            gameMode = try {
                GameMode.valueOf(gameMode)
            } catch (e: Exception) {
                GameMode.RACE_TO
            },
            winner = winner,
            date = Date(date),
            startTime = Date(startTime),
            endTime = Date(endTime),
            frameHistory = frameHistory.map { frame ->
                Frame(
                    timestamp = Date(frame.timestamp),
                    player = frame.player,
                    scoreChange = frame.scoreChange,
                    playerOneScore = frame.playerOneScore,
                    playerTwoScore = frame.playerTwoScore,
                    dishType = frame.dishType?.let { 
                        try {
                            DishType.valueOf(it)
                        } catch (e: Exception) {
                            null
                        }
                    }
                )
            },
            playerOneSetsWon = playerOneSetsWon,
            playerTwoSetsWon = playerTwoSetsWon,
            sets = sets.map { it.toSet() },
            breakPlayer = breakPlayer
        )
    }

    private fun ActiveGame.toSerializable(): SerializableActiveGame {
        return SerializableActiveGame(
            id = id,
            playerOneName = playerOneName,
            playerTwoName = playerTwoName,
            playerOneScore = playerOneScore,
            playerTwoScore = playerTwoScore,
            playerOneGamesWon = playerOneGamesWon,
            playerTwoGamesWon = playerTwoGamesWon,
            targetScore = targetScore,
            gameMode = gameMode.name,
            startTime = startTime.time,
            frameHistory = frameHistory.map { frame ->
                SerializableFrame(
                    timestamp = frame.timestamp.time,
                    player = frame.player,
                    scoreChange = frame.scoreChange,
                    playerOneScore = frame.playerOneScore,
                    playerTwoScore = frame.playerTwoScore,
                    dishType = frame.dishType?.name
                )
            },
            playerOneSetsWon = playerOneSetsWon,
            playerTwoSetsWon = playerTwoSetsWon,
            completedSets = completedSets.map { it.toSerializable() },
            breakPlayer = breakPlayer
        )
    }

    private fun SerializableActiveGame.toActiveGame(): ActiveGame {
        return ActiveGame(
            id = id,
            playerOneName = playerOneName,
            playerTwoName = playerTwoName,
            playerOneScore = playerOneScore,
            playerTwoScore = playerTwoScore,
            playerOneGamesWon = playerOneGamesWon,
            playerTwoGamesWon = playerTwoGamesWon,
            targetScore = targetScore,
            gameMode = try {
                GameMode.valueOf(gameMode)
            } catch (e: Exception) {
                GameMode.RACE_TO
            },
            startTime = Date(startTime),
            frameHistory = frameHistory.map { frame ->
                Frame(
                    timestamp = Date(frame.timestamp),
                    player = frame.player,
                    scoreChange = frame.scoreChange,
                    playerOneScore = frame.playerOneScore,
                    playerTwoScore = frame.playerTwoScore,
                    dishType = frame.dishType?.let { 
                        try {
                            DishType.valueOf(it)
                        } catch (e: Exception) {
                            null
                        }
                    }
                )
            },
            playerOneSetsWon = playerOneSetsWon,
            playerTwoSetsWon = playerTwoSetsWon,
            completedSets = completedSets.map { it.toSet() },
            breakPlayer = breakPlayer
        )
    }
}

