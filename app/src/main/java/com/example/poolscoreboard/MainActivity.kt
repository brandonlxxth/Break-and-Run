package com.brandonlxxth.breakandrun

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.lifecycle.compose.collectAsStateWithLifecycle
import androidx.navigation.NavHostController
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.brandonlxxth.breakandrun.data.ActiveGame
import com.brandonlxxth.breakandrun.data.BallColor
import com.brandonlxxth.breakandrun.data.Game
import com.brandonlxxth.breakandrun.data.GameMode
import com.brandonlxxth.breakandrun.data.GameRepository
import com.brandonlxxth.breakandrun.ui.game.GameScreen
import com.brandonlxxth.breakandrun.ui.home.HomeScreen
import com.brandonlxxth.breakandrun.ui.pastgames.PastGamesScreen
import com.brandonlxxth.breakandrun.ui.scoreboard.ScoreboardScreen
import com.brandonlxxth.breakandrun.ui.theme.PoolScoreboardTheme
import com.brandonlxxth.breakandrun.util.normalizeName
import kotlinx.coroutines.launch

sealed class Screen(val route: String) {
    object Home : Screen("home")
    object NewGame : Screen("new_game")
    object Scoreboard : Screen("scoreboard") {
        fun createRoute(playerOne: String, playerTwo: String, gameMode: String, targetScore: Int, breakPlayer: String, p1Color: BallColor?, p2Color: BallColor?): String {
            val p1 = java.net.URLEncoder.encode(playerOne, "UTF-8")
            val p2 = java.net.URLEncoder.encode(playerTwo, "UTF-8")
            val breakP = java.net.URLEncoder.encode(breakPlayer, "UTF-8")
            val color1 = p1Color?.name ?: "NONE"
            val color2 = p2Color?.name ?: "NONE"
            return "scoreboard/$p1/$p2/$gameMode/$targetScore/$breakP/$color1/$color2"
        }
    }
    object PastGames : Screen("past_games")
}

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            PoolScoreboardTheme {
                PoolScoreboardApp()
            }
        }
    }
}

@Composable
fun PoolScoreboardApp() {
    val navController = rememberNavController()
    val context = LocalContext.current.applicationContext
    val repository = remember { GameRepository(context) }
    
    // Load past games from repository
    val pastGames by repository.pastGames.collectAsStateWithLifecycle(initialValue = emptyList())
    
    // Load active game from repository (persisted across app restarts)
    val persistedActiveGame by repository.activeGame.collectAsStateWithLifecycle(initialValue = null)
    var activeGame by remember { mutableStateOf<ActiveGame?>(null) }
    
    // Remember the coroutine scope
    val scope = rememberCoroutineScope()
    
    // Load persisted active game on app start
    LaunchedEffect(persistedActiveGame) {
        if (persistedActiveGame != null && activeGame == null) {
            activeGame = persistedActiveGame
            android.util.Log.d("PoolScoreboardApp", "Loaded persisted active game: ${persistedActiveGame?.id}")
        }
    }
    
    // Save active game to repository whenever it changes
    LaunchedEffect(activeGame) {
        scope.launch {
            try {
                repository.saveActiveGame(activeGame)
                android.util.Log.d("PoolScoreboardApp", "Saved active game: ${activeGame?.id ?: "null"}")
            } catch (e: Exception) {
                android.util.Log.e("PoolScoreboardApp", "Error saving active game: ${e.message}", e)
            }
        }
    }
    
    // Debug: Log when games change
    LaunchedEffect(pastGames.size) {
        android.util.Log.d("PoolScoreboardApp", "Past games count: ${pastGames.size}")
    }

    NavHost(
        navController = navController,
        startDestination = Screen.Home.route,
        modifier = Modifier.fillMaxSize()
    ) {
        composable(Screen.Home.route) {
            HomeScreen(
                activeGame = activeGame,
                onNewGameClick = {
                    navController.navigate(Screen.NewGame.route)
                },
                onResumeGameClick = {
                    activeGame?.let { game ->
                        navController.navigate("resume/${game.id}")
                    }
                },
                onPastGamesClick = {
                    navController.navigate(Screen.PastGames.route)
                }
            )
        }

        composable(Screen.NewGame.route) {
            GameScreen(
                onBackClick = {
                    navController.popBackStack()
                },
                onCreateGame = { playerOne, playerTwo, gameMode, targetScore, breakPlayer, p1Color, p2Color ->
                    navController.navigate(Screen.Scoreboard.createRoute(playerOne, playerTwo, gameMode.name, targetScore, breakPlayer, p1Color, p2Color))
                }
            )
        }

        composable(
            route = "scoreboard/{playerOne}/{playerTwo}/{gameMode}/{targetScore}/{breakPlayer}/{p1Color}/{p2Color}",
            arguments = listOf(
                navArgument("playerOne") { type = NavType.StringType },
                navArgument("playerTwo") { type = NavType.StringType },
                navArgument("gameMode") { type = NavType.StringType },
                navArgument("targetScore") { type = NavType.IntType },
                navArgument("breakPlayer") { type = NavType.StringType },
                navArgument("p1Color") { type = NavType.StringType },
                navArgument("p2Color") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val playerOne = java.net.URLDecoder.decode(backStackEntry.arguments?.getString("playerOne") ?: "Player 1", "UTF-8")
            val playerTwo = java.net.URLDecoder.decode(backStackEntry.arguments?.getString("playerTwo") ?: "Player 2", "UTF-8")
            val gameModeStr = backStackEntry.arguments?.getString("gameMode") ?: "RACE_TO"
            val targetScore = backStackEntry.arguments?.getInt("targetScore") ?: 7
            val breakPlayer = java.net.URLDecoder.decode(backStackEntry.arguments?.getString("breakPlayer") ?: "", "UTF-8")
            val p1ColorStr = backStackEntry.arguments?.getString("p1Color") ?: "NONE"
            val p2ColorStr = backStackEntry.arguments?.getString("p2Color") ?: "NONE"
            val gameMode = try {
                GameMode.valueOf(gameModeStr)
            } catch (e: IllegalArgumentException) {
                GameMode.RACE_TO
            }
            val p1Color = if (p1ColorStr.isNotBlank() && p1ColorStr != "NONE") {
                try { BallColor.valueOf(p1ColorStr) } catch (e: Exception) { null }
            } else null
            val p2Color = if (p2ColorStr.isNotBlank() && p2ColorStr != "NONE") {
                try { BallColor.valueOf(p2ColorStr) } catch (e: Exception) { null }
            } else null
            
            // Normalize names (lowercase, trimmed) for storage and comparison
            // Display will be handled in ScoreboardScreen with first letter capitalized
            ScoreboardScreen(
                playerOneName = normalizeName(playerOne),
                playerTwoName = normalizeName(playerTwo),
                gameMode = gameMode,
                targetScore = targetScore,
                breakPlayer = if (breakPlayer.isNotBlank()) normalizeName(breakPlayer) else null,
                playerOneColor = p1Color,
                playerTwoColor = p2Color,
                activeGame = null,
                pastGames = pastGames,
                onBackClick = { savedActiveGame ->
                    activeGame = savedActiveGame
                    // Navigate to home instead of going back to New Game screen
                    navController.navigate(Screen.Home.route) {
                        popUpTo(navController.graph.startDestinationId) { inclusive = false }
                    }
                },
                onGameEnd = { game ->
                    activeGame = null // Clear active game when finished
                    // Save game to repository
                    scope.launch {
                        repository.addGame(game)
                    }
                    // Navigate to home, clearing all intermediate screens
                    navController.navigate(Screen.Home.route) {
                        popUpTo(navController.graph.startDestinationId) { inclusive = false }
                    }
                },
                onActiveGameUpdate = { updatedActiveGame ->
                    activeGame = updatedActiveGame
                }
            )
        }

        composable(
            route = "resume/{gameId}",
            arguments = listOf(
                navArgument("gameId") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val gameId = backStackEntry.arguments?.getString("gameId")
            val gameToResume = activeGame?.takeIf { it.id == gameId }
            
            if (gameToResume != null) {
                // Names in ActiveGame are already normalized, but ensure they are
                ScoreboardScreen(
                    playerOneName = normalizeName(gameToResume.playerOneName),
                    playerTwoName = normalizeName(gameToResume.playerTwoName),
                    gameMode = gameToResume.gameMode,
                    targetScore = gameToResume.targetScore,
                    breakPlayer = gameToResume.breakPlayer,
                    playerOneColor = gameToResume.playerOneColor,
                    playerTwoColor = gameToResume.playerTwoColor,
                    activeGame = gameToResume,
                    pastGames = pastGames,
                    onBackClick = { savedActiveGame ->
                        activeGame = savedActiveGame
                        // Navigate to home instead of going back
                        navController.navigate(Screen.Home.route) {
                            popUpTo(navController.graph.startDestinationId) { inclusive = false }
                        }
                    },
                    onGameEnd = { game ->
                        activeGame = null // Clear active game when finished
                        // Save game to repository
                        scope.launch {
                            repository.addGame(game)
                        }
                        // Navigate to home, clearing all intermediate screens
                        navController.navigate(Screen.Home.route) {
                            popUpTo(navController.graph.startDestinationId) { inclusive = false }
                        }
                    },
                    onActiveGameUpdate = { updatedActiveGame ->
                        activeGame = updatedActiveGame
                    }
                )
            } else {
                // Game not found, go back to home
                navController.popBackStack()
            }
        }

        composable(Screen.PastGames.route) {
            PastGamesScreen(
                games = pastGames.reversed(), // Show most recent first
                onBackClick = {
                    navController.popBackStack()
                },
                onDeleteGame = { gameId ->
                    scope.launch {
                        try {
                            repository.deleteGame(gameId)
                        } catch (e: Exception) {
                            android.util.Log.e("MainActivity", "Error deleting game: ${e.message}", e)
                        }
                    }
                }
            )
        }
    }
}
