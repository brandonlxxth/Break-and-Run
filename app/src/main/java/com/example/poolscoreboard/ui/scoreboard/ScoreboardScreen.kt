package com.brandonlxxth.breakandrun.ui.scoreboard

import androidx.activity.compose.BackHandler
import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clipToBounds
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import android.content.res.Configuration
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.compose.ui.zIndex
import com.brandonlxxth.breakandrun.data.ActiveGame
import com.brandonlxxth.breakandrun.data.DishType
import com.brandonlxxth.breakandrun.data.Frame
import com.brandonlxxth.breakandrun.data.Game
import com.brandonlxxth.breakandrun.data.GameMode
import com.brandonlxxth.breakandrun.data.Set
import com.brandonlxxth.breakandrun.util.formatNameForDisplay
import com.brandonlxxth.breakandrun.util.normalizeName
import java.util.Date

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScoreboardScreen(
    playerOneName: String,
    playerTwoName: String,
    gameMode: GameMode,
    targetScore: Int,
    breakPlayer: String? = null,
    activeGame: ActiveGame? = null,
    pastGames: List<Game> = emptyList(),
    onBackClick: (ActiveGame?) -> Unit,
    onGameEnd: (Game) -> Unit,
    onActiveGameUpdate: (ActiveGame) -> Unit = {}
) {
    // Track game start time (use existing if resuming)
    val startTime = remember { activeGame?.startTime ?: Date() }
    
    // Track break player (restore from active game if resuming, otherwise use passed value)
    var currentBreakPlayer by remember { mutableStateOf(activeGame?.breakPlayer ?: breakPlayer) }
    
    // State for player scores (restore from active game if resuming)
    var playerOneScore by remember { mutableStateOf(activeGame?.playerOneScore ?: 0) }
    var playerTwoScore by remember { mutableStateOf(activeGame?.playerTwoScore ?: 0) }
    
    // For "Best of" mode: track games won (restore from active game if resuming)
    var playerOneGamesWon by remember { mutableStateOf(activeGame?.playerOneGamesWon ?: 0) }
    var playerTwoGamesWon by remember { mutableStateOf(activeGame?.playerTwoGamesWon ?: 0) }
    
    // For "Sets of" mode: track sets won (restore from active game if resuming)
    var playerOneSetsWon by remember { mutableStateOf(activeGame?.playerOneSetsWon ?: 0) }
    var playerTwoSetsWon by remember { mutableStateOf(activeGame?.playerTwoSetsWon ?: 0) }
    var completedSets by remember { mutableStateOf(activeGame?.completedSets ?: emptyList()) }
    
    // Track frame history for stats (restore from active game if resuming)
    var frameHistory by remember { mutableStateOf(activeGame?.frameHistory ?: emptyList()) }
    
    // Track current set frame history (for "Sets of" mode)
    var currentSetFrames by remember { mutableStateOf<List<Frame>>(emptyList()) }

    // Track if current game ended (for Best of mode)
    var currentGameEnded by remember { mutableStateOf(false) }
    
    // Dish dialog state
    var showDishDialog by remember { mutableStateOf(false) }
    var dishPlayer by remember { mutableStateOf<String?>(null) } // Track which player clicked dish
    
    // Normalize names for comparison (lowercase, trimmed)
    val normalizedP1Name = remember(playerOneName) { normalizeName(playerOneName) }
    val normalizedP2Name = remember(playerTwoName) { normalizeName(playerTwoName) }
    
    // Format names for display (capitalize first letter)
    val displayP1Name = remember(playerOneName) { formatNameForDisplay(playerOneName) }
    val displayP2Name = remember(playerTwoName) { formatNameForDisplay(playerTwoName) }
    
    // Calculate whose turn it is to break (alternates after each frame)
    val totalFramesPlayed = playerOneScore + playerTwoScore
    val playerToBreak = remember(currentBreakPlayer, totalFramesPlayed, normalizedP1Name, normalizedP2Name) {
        if (currentBreakPlayer == null) {
            null
        } else {
            // If even number of frames, it's the initial break player's turn
            // If odd number of frames, it's the other player's turn
            if (totalFramesPlayed % 2 == 0) {
                currentBreakPlayer
            } else {
                // Switch to the other player
                if (currentBreakPlayer == normalizedP1Name) normalizedP2Name else normalizedP1Name
            }
        }
    }
    val p1ToBreak = playerToBreak == normalizedP1Name
    val p2ToBreak = playerToBreak == normalizedP2Name
    
    // Auto-save active game state whenever it changes (scores, frame history, etc.)
    LaunchedEffect(playerOneScore, playerTwoScore, playerOneGamesWon, playerTwoGamesWon, 
                   playerOneSetsWon, playerTwoSetsWon, frameHistory, completedSets, 
                   currentSetFrames, currentGameEnded) {
        // Only save if there's actual game activity (not just initial state)
        if (frameHistory.isNotEmpty() || playerOneScore > 0 || playerTwoScore > 0 || 
            playerOneGamesWon > 0 || playerTwoGamesWon > 0 || 
            playerOneSetsWon > 0 || playerTwoSetsWon > 0) {
            val activeGameState = ActiveGame(
                id = activeGame?.id ?: java.util.UUID.randomUUID().toString(),
                playerOneName = normalizedP1Name,
                playerTwoName = normalizedP2Name,
                playerOneScore = playerOneScore,
                playerTwoScore = playerTwoScore,
                playerOneGamesWon = playerOneGamesWon,
                playerTwoGamesWon = playerTwoGamesWon,
                targetScore = targetScore,
                gameMode = gameMode,
                startTime = startTime,
                frameHistory = frameHistory,
                playerOneSetsWon = playerOneSetsWon,
                playerTwoSetsWon = playerTwoSetsWon,
                completedSets = completedSets,
                breakPlayer = currentBreakPlayer
            )
            onActiveGameUpdate(activeGameState)
        }
    }
    
    // Calculate aggregate statistics for this player pair
    // Use LaunchedEffect to calculate asynchronously to avoid blocking UI
    var aggregateStats by remember { mutableStateOf<Triple<Int, Int, Int>?>(null) }
    
    LaunchedEffect(pastGames, normalizedP1Name, normalizedP2Name) {
        aggregateStats = try {
            // Safety checks
            if (pastGames.isEmpty() || normalizedP1Name.isBlank() || normalizedP2Name.isBlank()) {
                null
            } else {
                val matchingGames = pastGames.filter { game ->
                    // Check if names match in either order using normalized names
                    try {
                        val gameP1Normalized = normalizeName(game.playerOneName)
                        val gameP2Normalized = normalizeName(game.playerTwoName)
                        (gameP1Normalized == normalizedP1Name && gameP2Normalized == normalizedP2Name) ||
                        (gameP1Normalized == normalizedP2Name && gameP2Normalized == normalizedP1Name)
                    } catch (e: Exception) {
                        false
                    }
                }
                
                if (matchingGames.isEmpty()) {
                    null
                } else {
                    var p1Wins = 0
                    var p2Wins = 0
                    var draws = 0
                    
                    matchingGames.forEach { game ->
                        try {
                            val gameP1Normalized = normalizeName(game.playerOneName)
                            val isP1First = gameP1Normalized == normalizedP1Name
                            val winnerNormalized = game.winner?.let { normalizeName(it) }
                            when {
                                winnerNormalized == null -> draws++
                                isP1First && winnerNormalized == normalizedP1Name -> p1Wins++
                                isP1First && winnerNormalized == normalizedP2Name -> p2Wins++
                                !isP1First && winnerNormalized == normalizedP2Name -> p1Wins++
                                !isP1First && winnerNormalized == normalizedP1Name -> p2Wins++
                            }
                        } catch (e: Exception) {
                            // Skip games with errors
                            android.util.Log.e("ScoreboardScreen", "Error processing game for aggregate stats: ${e.message}")
                        }
                    }
                    
                    Triple(p1Wins, p2Wins, draws)
                }
            }
        } catch (e: Exception) {
            android.util.Log.e("ScoreboardScreen", "Error calculating aggregate stats: ${e.message}", e)
            null
        }
    }
    
    // Calculate win conditions based on game mode
    val winConditions = when (gameMode) {
        GameMode.RACE_TO -> {
            val p1Won = playerOneScore >= targetScore
            val p2Won = playerTwoScore >= targetScore
            Pair(Triple(p1Won, p2Won, p1Won || p2Won), false)
        }
        GameMode.FIRST_TO -> {
            val p1WonSet = playerOneScore >= targetScore
            val p2WonSet = playerTwoScore >= targetScore
            val setEndedNow = p1WonSet || p2WonSet
            val p1WonMatch = playerOneSetsWon >= targetScore
            val p2WonMatch = playerTwoSetsWon >= targetScore
            Pair(Triple(p1WonMatch, p2WonMatch, p1WonMatch || p2WonMatch), setEndedNow)
        }
        GameMode.BEST_OF -> {
            // Game ends when total frame count reaches target
            val currentFrameCount = playerOneScore + playerTwoScore
            val gameEndedNow = currentFrameCount >= targetScore
            
            val majority = (targetScore / 2) + 1
            val totalGamesPlayed = playerOneGamesWon + playerTwoGamesWon
            
            // Match ends when total games played reaches target (7) OR when someone reaches majority
            // If total games = 7, match is complete regardless of who has more wins
            val matchComplete = totalGamesPlayed >= targetScore
            
            // A player wins if they reach majority OR if match is complete and they have more wins
            val p1WonMatch = playerOneGamesWon >= majority || (matchComplete && playerOneGamesWon > playerTwoGamesWon)
            val p2WonMatch = playerTwoGamesWon >= majority || (matchComplete && playerTwoGamesWon > playerOneGamesWon)
            
            Pair(Triple(p1WonMatch, p2WonMatch, matchComplete), gameEndedNow)
        }
    }
    val (playerOneWon, playerTwoWon, gameEnded) = winConditions.first
    val setEnded = winConditions.second
    
    // Update currentGameEnded for Best of mode
    if (gameMode == GameMode.BEST_OF && setEnded && !currentGameEnded) {
        currentGameEnded = true
    }

    // Detect orientation (needed for TopAppBar)
    val configuration = LocalConfiguration.current
    val isLandscape = configuration.orientation == Configuration.ORIENTATION_LANDSCAPE

    Scaffold(
        topBar = {
            TopAppBar(
                title = { 
                    if (isLandscape && aggregateStats != null) {
                        // In landscape, show aggregate stats in header
                        aggregateStats?.let { stats ->
                            val (p1Wins, p2Wins, draws) = stats
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column(horizontalAlignment = Alignment.Start) {
                                Text("${gameMode.displayName} $targetScore", fontSize = 14.sp)
                                if (gameMode == GameMode.FIRST_TO) {
                                    Text(
                                        text = "Sets: $playerOneSetsWon - $playerTwoSetsWon",
                                        fontSize = 10.sp,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                                    )
                                }
                            }
                            // Aggregate stats in header
                            Row(
                                horizontalArrangement = Arrangement.spacedBy(12.dp),
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Column(horizontalAlignment = Alignment.End) {
                                    Text(
                                        text = displayP1Name,
                                        fontSize = 10.sp,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                                    )
                                    Text(
                                        text = "$p1Wins",
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                }
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Text(
                                        text = "${p1Wins + p2Wins + draws}",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.9f)
                                    )
                                    if (draws > 0) {
                                        Text(
                                            text = "$draws draw${if (draws > 1) "s" else ""}",
                                            fontSize = 8.sp,
                                            color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.6f)
                                        )
                                    }
                                }
                                Column(horizontalAlignment = Alignment.Start) {
                                    Text(
                                        text = displayP2Name,
                                        fontSize = 10.sp,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.8f)
                                    )
                                    Text(
                                        text = "$p2Wins",
                                        fontSize = 14.sp,
                                        fontWeight = FontWeight.Bold,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer
                                    )
                                }
                            }
                        }
                        } ?: run {
                            // Fallback if aggregateStats is null
                            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                Text("${gameMode.displayName} $targetScore", fontSize = 14.sp)
                                if (gameMode == GameMode.FIRST_TO) {
                                    Text(
                                        text = "Sets: $playerOneSetsWon - $playerTwoSetsWon",
                                        fontSize = 10.sp,
                                        color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                                    )
                                }
                            }
                        }
                    } else {
                        // Portrait mode - original layout
                        Column(horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("${gameMode.displayName} $targetScore")
                            if (gameMode == GameMode.FIRST_TO) {
                                Text(
                                    text = "Sets: $playerOneSetsWon - $playerTwoSetsWon",
                                    fontSize = 12.sp,
                                    color = MaterialTheme.colorScheme.onPrimaryContainer.copy(alpha = 0.7f)
                                )
                            }
                        }
                    }
                },
                navigationIcon = {
                    IconButton(onClick = {
                        // Save active game state when backing out
                        val activeGameState = ActiveGame(
                            id = activeGame?.id ?: java.util.UUID.randomUUID().toString(),
                            playerOneName = normalizedP1Name,
                            playerTwoName = normalizedP2Name,
                            playerOneScore = playerOneScore,
                            playerTwoScore = playerTwoScore,
                            playerOneGamesWon = playerOneGamesWon,
                            playerTwoGamesWon = playerTwoGamesWon,
                            targetScore = targetScore,
                            gameMode = gameMode,
                            startTime = startTime,
                            frameHistory = frameHistory,
                            playerOneSetsWon = playerOneSetsWon,
                            playerTwoSetsWon = playerTwoSetsWon,
                            completedSets = completedSets
                        )
                        onBackClick(activeGameState)
                    }) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    ) { paddingValues ->
        // Handle back gesture - navigate to home instead of going back to New Game
        BackHandler {
            val activeGameState = ActiveGame(
                id = activeGame?.id ?: java.util.UUID.randomUUID().toString(),
                playerOneName = normalizedP1Name,
                playerTwoName = normalizedP2Name,
                playerOneScore = playerOneScore,
                playerTwoScore = playerTwoScore,
                playerOneGamesWon = playerOneGamesWon,
                playerTwoGamesWon = playerTwoGamesWon,
                targetScore = targetScore,
                gameMode = gameMode,
                startTime = startTime,
                frameHistory = frameHistory,
                playerOneSetsWon = playerOneSetsWon,
                playerTwoSetsWon = playerTwoSetsWon,
                completedSets = completedSets,
                breakPlayer = currentBreakPlayer
            )
            onBackClick(activeGameState)
        }
        
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Aggregate stats card (overlay on top - render first so it appears on top)
            // Only show as overlay in portrait mode - in landscape it's in the header
            if (!isLandscape) {
                aggregateStats?.let { stats ->
                val (p1Wins, p2Wins, draws) = stats
                Card(
                    modifier = Modifier
                        .align(Alignment.TopCenter)
                        .fillMaxWidth()
                        .padding(horizontal = if (isLandscape) 8.dp else 16.dp, vertical = if (isLandscape) 4.dp else 8.dp)
                        .zIndex(1f),
                    colors = CardDefaults.cardColors(
                        containerColor = MaterialTheme.colorScheme.surfaceVariant
                    ),
                    elevation = CardDefaults.cardElevation(defaultElevation = if (isLandscape) 4.dp else 8.dp),
                    shape = MaterialTheme.shapes.large
                ) {
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = if (isLandscape) 6.dp else 12.dp, horizontal = if (isLandscape) 8.dp else 16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // Player 1 stats
                        Column(
                            horizontalAlignment = Alignment.Start,
                            modifier = Modifier.weight(1f)
                        ) {
                            Text(
                                text = displayP1Name,
                                fontSize = if (isLandscape) 10.sp else 12.sp,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f)
                            )
                            Spacer(modifier = Modifier.height(if (isLandscape) 2.dp else 4.dp))
                            Text(
                                text = "$p1Wins",
                                fontSize = if (isLandscape) 14.sp else 20.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = "wins",
                                fontSize = if (isLandscape) 9.sp else 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                            )
                        }
                        
                        // Center divider with total
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally,
                            modifier = Modifier.padding(horizontal = if (isLandscape) 8.dp else 16.dp)
                        ) {
                            Text(
                                text = "${p1Wins + p2Wins + draws}",
                                fontSize = if (isLandscape) 12.sp else 16.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                            Text(
                                text = "total",
                                fontSize = if (isLandscape) 8.sp else 10.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                            )
                            if (draws > 0) {
                                Spacer(modifier = Modifier.height(1.dp))
                                Text(
                                    text = "$draws draw${if (draws > 1) "s" else ""}",
                                    fontSize = if (isLandscape) 8.sp else 10.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.5f)
                                )
                            }
                        }
                        
                        // Player 2 stats
                        Column(
                            horizontalAlignment = Alignment.End,
                            modifier = Modifier.weight(1f)
                        ) {
                            Text(
                                text = displayP2Name,
                                fontSize = if (isLandscape) 10.sp else 12.sp,
                                fontWeight = FontWeight.Medium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.8f)
                            )
                            Spacer(modifier = Modifier.height(if (isLandscape) 2.dp else 4.dp))
                            Text(
                                text = "$p2Wins",
                                fontSize = if (isLandscape) 14.sp else 20.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = "wins",
                                fontSize = if (isLandscape) 9.sp else 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                            )
                        }
                    }
                }
            }
            }
            
            // Split screen layout (full size, no padding)
            Row(
                modifier = Modifier
                    .fillMaxSize()
                    .zIndex(0f)
            ) {
                // Left half - Player 1
                PlayerHalf(
                    playerName = displayP1Name,
                    score = playerOneScore,
                    gamesWon = if (gameMode == GameMode.BEST_OF) playerOneGamesWon else null,
                    isWinner = playerOneWon,
                    isEnabled = !gameEnded && !setEnded && !currentGameEnded,
                    backgroundColor = MaterialTheme.colorScheme.primaryContainer,
                    topPadding = if (aggregateStats != null && !isLandscape) 100.dp else 0.dp,
                    isToBreak = p1ToBreak,
                    isLandscape = isLandscape,
                    onIncrement = {
                        if (!gameEnded && !setEnded && !currentGameEnded) {
                            // Calculate current frame count
                            val currentFrameCount = playerOneScore + playerTwoScore
                            
                            // For Best of mode: prevent incrementing if frame count equals target
                            if (gameMode == GameMode.BEST_OF && currentFrameCount >= targetScore) {
                                return@PlayerHalf
                            }
                            
                            // For Race to mode: prevent incrementing if either player reached target
                            if (gameMode == GameMode.RACE_TO && (playerOneScore >= targetScore || playerTwoScore >= targetScore)) {
                                return@PlayerHalf
                            }
                            
                            playerOneScore++
                            val newFrame = Frame(
                                timestamp = Date(),
                                player = normalizedP1Name,
                                scoreChange = 1,
                                playerOneScore = playerOneScore,
                                playerTwoScore = playerTwoScore
                            )
                            frameHistory = frameHistory + newFrame
                            currentSetFrames = currentSetFrames + newFrame
                            
                            // For Best of mode, check if frame count reached target
                            val newFrameCount = playerOneScore + playerTwoScore
                            if (gameMode == GameMode.BEST_OF && newFrameCount >= targetScore) {
                                // Game ended - disable buttons, show "New Game" or "End Match"
                                currentGameEnded = true
                            }
                            // For Sets of mode, check if this set is won
                            if (gameMode == GameMode.FIRST_TO && playerOneScore >= targetScore) {
                                playerOneSetsWon++
                                // Set ended - will show buttons to continue or end
                            }
                        }
                    },
                    onDecrement = {
                        // Prevent decrementing if frame count equals target (for Best of mode)
                        val currentFrameCount = playerOneScore + playerTwoScore
                        if (gameMode == GameMode.BEST_OF && currentFrameCount >= targetScore) {
                            return@PlayerHalf
                        }
                        if (playerOneScore > 0) {
                            // Check if last frame was a dish for this player
                            val lastFrame = frameHistory.lastOrNull()
                            if (lastFrame != null && 
                                lastFrame.player == normalizedP1Name && 
                                lastFrame.dishType != null) {
                                // Remove the dish frame from history
                                frameHistory = frameHistory.dropLast(1)
                                currentSetFrames = currentSetFrames.dropLast(1)
                            }
                            playerOneScore--
                        }
                    },
                    onDish = {
                        dishPlayer = normalizedP1Name
                        showDishDialog = true
                    },
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                )

                VerticalDivider(
                    color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
                    thickness = 1.dp
                )

                // Right half - Player 2
                PlayerHalf(
                    playerName = displayP2Name,
                    score = playerTwoScore,
                    gamesWon = if (gameMode == GameMode.BEST_OF) playerTwoGamesWon else null,
                    isWinner = playerTwoWon,
                    isEnabled = !gameEnded && !setEnded && !currentGameEnded,
                    backgroundColor = MaterialTheme.colorScheme.surfaceVariant,
                    topPadding = if (aggregateStats != null && !isLandscape) 100.dp else 0.dp,
                    isToBreak = p2ToBreak,
                    isLandscape = isLandscape,
                    onIncrement = {
                        if (!gameEnded && !setEnded && !currentGameEnded) {
                            // Calculate current frame count
                            val currentFrameCount = playerOneScore + playerTwoScore
                            
                            // For Best of mode: prevent incrementing if frame count equals target
                            if (gameMode == GameMode.BEST_OF && currentFrameCount >= targetScore) {
                                return@PlayerHalf
                            }
                            
                            // For Race to mode: prevent incrementing if either player reached target
                            if (gameMode == GameMode.RACE_TO && (playerOneScore >= targetScore || playerTwoScore >= targetScore)) {
                                return@PlayerHalf
                            }
                            
                            playerTwoScore++
                            val newFrame = Frame(
                                timestamp = Date(),
                                player = normalizedP2Name,
                                scoreChange = 1,
                                playerOneScore = playerOneScore,
                                playerTwoScore = playerTwoScore
                            )
                            frameHistory = frameHistory + newFrame
                            currentSetFrames = currentSetFrames + newFrame
                            
                            // For Best of mode, check if frame count reached target
                            val newFrameCount = playerOneScore + playerTwoScore
                            if (gameMode == GameMode.BEST_OF && newFrameCount >= targetScore) {
                                // Game ended - disable buttons, show "New Game" or "End Match"
                                currentGameEnded = true
                            }
                            // For Sets of mode, check if this set is won
                            if (gameMode == GameMode.FIRST_TO && playerTwoScore >= targetScore) {
                                playerTwoSetsWon++
                                // Set ended - will show buttons to continue or end
                            }
                        }
                    },
                    onDecrement = {
                        // Prevent decrementing if frame count equals target (for Best of mode)
                        val currentFrameCount = playerOneScore + playerTwoScore
                        if (gameMode == GameMode.BEST_OF && currentFrameCount >= targetScore) {
                            return@PlayerHalf
                        }
                        if (playerTwoScore > 0) {
                            // Check if last frame was a dish for this player
                            val lastFrame = frameHistory.lastOrNull()
                            if (lastFrame != null && 
                                lastFrame.player == normalizedP2Name && 
                                lastFrame.dishType != null) {
                                // Remove the dish frame from history
                                frameHistory = frameHistory.dropLast(1)
                                currentSetFrames = currentSetFrames.dropLast(1)
                            }
                            playerTwoScore--
                        }
                    },
                    onDish = {
                        dishPlayer = normalizedP2Name
                        showDishDialog = true
                    },
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxHeight()
                )
            }

            // Dish - automatically determine type based on break player
            LaunchedEffect(showDishDialog, dishPlayer, currentBreakPlayer) {
                val currentDishPlayer = dishPlayer
                val currentBreak = currentBreakPlayer
                if (showDishDialog && currentDishPlayer != null && currentBreak != null) {
                    // Determine dish type: if the player who clicked dish is the break player, it's a break dish
                    val dishType = if (currentDishPlayer == currentBreak) {
                        DishType.BREAK_DISH
                    } else {
                        DishType.REVERSE_DISH
                    }
                    
                    // Increment the score for the player who dished
                    if (currentDishPlayer == normalizedP1Name) {
                        playerOneScore++
                    } else {
                        playerTwoScore++
                    }
                    
                    // Create a frame with dish information
                    val newFrame = Frame(
                        timestamp = Date(),
                        player = currentDishPlayer,
                        scoreChange = 1, // Dish increments score
                        playerOneScore = playerOneScore,
                        playerTwoScore = playerTwoScore,
                        dishType = dishType
                    )
                    frameHistory = frameHistory + newFrame
                    currentSetFrames = currentSetFrames + newFrame
                    
                    // Check win conditions after dish
                    val newFrameCount = playerOneScore + playerTwoScore
                    if (gameMode == GameMode.BEST_OF && newFrameCount >= targetScore) {
                        currentGameEnded = true
                    }
                    if (gameMode == GameMode.FIRST_TO) {
                        if (playerOneScore >= targetScore) {
                            playerOneSetsWon++
                        } else if (playerTwoScore >= targetScore) {
                            playerTwoSetsWon++
                        }
                    }
                    
                    showDishDialog = false
                    dishPlayer = null
                }
            }

            // Action buttons at the bottom
            Column(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Show "New Set" button when set ends in "Sets of" mode
                if (setEnded && gameMode == GameMode.FIRST_TO && !gameEnded) {
                    Button(
                        onClick = {
                            // Save completed set
                            val setWinner = if (playerOneScore >= targetScore) playerOneName else playerTwoName
                            val newSet = Set(
                                setNumber = completedSets.size + 1,
                                playerOneScore = playerOneScore,
                                playerTwoScore = playerTwoScore,
                                winner = setWinner,
                                frames = currentSetFrames
                            )
                            completedSets = completedSets + newSet
                            
                            // Reset scores for new set
                            playerOneScore = 0
                            playerTwoScore = 0
                            currentSetFrames = emptyList()
                        },
                        modifier = Modifier.fillMaxWidth(),
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary
                        )
                    ) {
                        Text(
                            text = "New Set",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.SemiBold,
                            modifier = Modifier.padding(vertical = 4.dp)
                        )
                    }
                }
                
                Button(
                    onClick = {
                        // For "Best of" mode, calculate final games won
                        // If current game ended, increment the winner's count
                        var finalP1GamesWon = playerOneGamesWon
                        var finalP2GamesWon = playerTwoGamesWon
                        if (gameMode == GameMode.BEST_OF && currentGameEnded) {
                            // Determine winner based on who has more frames
                            if (playerOneScore > playerTwoScore) {
                                finalP1GamesWon++
                            } else if (playerTwoScore > playerOneScore) {
                                finalP2GamesWon++
                            }
                            // If tie in current game, neither player gets a win (counts stay the same)
                        }
                        // If current game hasn't ended, use existing counts (they're already correct)
                        
                        // For "Best of" mode, calculate total frames from frame history for the skip check
                        // Best of tracks individual games, so we need to check total frames, not games won
                        val (checkP1Score, checkP2Score) = if (gameMode == GameMode.BEST_OF) {
                            if (frameHistory.isNotEmpty()) {
                                // Calculate total frames from frame history (using normalized names)
                                val p1Frames = frameHistory.count { it.player == normalizedP1Name }
                                val p2Frames = frameHistory.count { it.player == normalizedP2Name }
                                Pair(p1Frames, p2Frames)
                            } else {
                                // If no frame history, use games won as fallback
                                Pair(finalP1GamesWon, finalP2GamesWon)
                            }
                        } else {
                            // For other modes, use the standard scores
                            val p1 = when (gameMode) {
                                GameMode.FIRST_TO -> playerOneSetsWon
                                else -> playerOneScore
                            }
                            val p2 = when (gameMode) {
                                GameMode.FIRST_TO -> playerTwoSetsWon
                                else -> playerTwoScore
                            }
                            Pair(p1, p2)
                        }
                        
                        // Only skip if score is 0-0 (no games played)
                        if (checkP1Score == 0 && checkP2Score == 0) {
                            // Score is 0-0, don't save - just navigate back
                            onBackClick(null)
                            return@Button
                        }
                        
                        val endTime = Date()
                        
                        // For "Sets of" mode, save final set if current set has frames
                        val finalSets = if (gameMode == GameMode.FIRST_TO && currentSetFrames.isNotEmpty()) {
                            // Determine set winner: if target reached, use that; otherwise use higher score
                            val setWinner = when {
                                playerOneScore >= targetScore -> normalizedP1Name
                                playerTwoScore >= targetScore -> normalizedP2Name
                                playerOneScore > playerTwoScore -> normalizedP1Name
                                playerTwoScore > playerOneScore -> normalizedP2Name
                                else -> null // Tie
                            }
                            val newSet = Set(
                                setNumber = completedSets.size + 1,
                                playerOneScore = playerOneScore,
                                playerTwoScore = playerTwoScore,
                                winner = setWinner,
                                frames = currentSetFrames
                            )
                            completedSets + newSet
                        } else {
                            completedSets
                        }
                        
                        // For "Sets of" mode, count sets won from the actual sets list
                        val (finalP1SetsWon, finalP2SetsWon) = if (gameMode == GameMode.FIRST_TO) {
                            val p1Won = finalSets.count { it.winner == playerOneName }
                            val p2Won = finalSets.count { it.winner == playerTwoName }
                            Pair(p1Won, p2Won)
                        } else {
                            Pair(playerOneSetsWon, playerTwoSetsWon)
                        }
                        
                        // For winner calculation, use appropriate scores for each mode
                        val p1ScoreForWinner = when (gameMode) {
                            GameMode.BEST_OF -> finalP1GamesWon
                            GameMode.FIRST_TO -> finalP1SetsWon
                            else -> playerOneScore
                        }
                        val p2ScoreForWinner = when (gameMode) {
                            GameMode.BEST_OF -> finalP2GamesWon
                            GameMode.FIRST_TO -> finalP2SetsWon
                            else -> playerTwoScore
                        }
                        
                        // Determine winner based on actual sets won (for "Sets of" mode) or scores/games won
                        // Use normalized names for storage
                        val winner = when (gameMode) {
                            GameMode.FIRST_TO -> {
                                // Always use sets won from saved sets list
                                when {
                                    finalP1SetsWon > finalP2SetsWon -> normalizedP1Name
                                    finalP2SetsWon > finalP1SetsWon -> normalizedP2Name
                                    else -> null // Tie
                                }
                            }
                            GameMode.BEST_OF -> {
                                // Winner is determined by who has more games won (using final counts)
                                // For even target scores, ties are possible (e.g., 4-4 in best of 8)
                                when {
                                    finalP1GamesWon > finalP2GamesWon -> normalizedP1Name
                                    finalP2GamesWon > finalP1GamesWon -> normalizedP2Name
                                    else -> null // Tie - this is valid for even target scores
                                }
                            }
                            else -> {
                                if (gameEnded) {
                                    // Game reached target score - winner already determined
                                    if (playerOneWon) normalizedP1Name else normalizedP2Name
                                } else {
                                    // Game ended early - determine winner by highest score
                                    when {
                                        p1ScoreForWinner > p2ScoreForWinner -> normalizedP1Name
                                        p2ScoreForWinner > p1ScoreForWinner -> normalizedP2Name
                                        else -> null // Tie
                                    }
                                }
                            }
                        }
                        // For "Best of" mode, calculate total frames from frame history
                        // Best of tracks individual games, not sets, so we need total frames across all games
                        val (totalP1Frames, totalP2Frames) = if (gameMode == GameMode.BEST_OF && frameHistory.isNotEmpty()) {
                            // Calculate total frames from frame history (using normalized names)
                            val p1Frames = frameHistory.count { it.player == normalizedP1Name }
                            val p2Frames = frameHistory.count { it.player == normalizedP2Name }
                            Pair(p1Frames, p2Frames)
                        } else {
                            // For other modes or if no frame history, use the check scores
                            Pair(checkP1Score, checkP2Score)
                        }
                        
                        // Keep p1Score and p2Score for winner calculation (which uses games won for BEST_OF)
                        val p1Score = when (gameMode) {
                            GameMode.BEST_OF -> finalP1GamesWon
                            GameMode.FIRST_TO -> playerOneSetsWon
                            else -> playerOneScore
                        }
                        val p2Score = when (gameMode) {
                            GameMode.BEST_OF -> finalP2GamesWon
                            GameMode.FIRST_TO -> playerTwoSetsWon
                            else -> playerTwoScore
                        }
                        
                        // onGameEnd will handle navigation and clearing active game
                        onGameEnd(
                            Game(
                                playerOneName = normalizedP1Name,
                                playerTwoName = normalizedP2Name,
                                playerOneScore = when (gameMode) {
                                    GameMode.FIRST_TO -> finalP1SetsWon
                                    GameMode.BEST_OF -> totalP1Frames  // Use total frames, not games won
                                    else -> p1Score
                                },
                                playerTwoScore = when (gameMode) {
                                    GameMode.FIRST_TO -> finalP2SetsWon
                                    GameMode.BEST_OF -> totalP2Frames  // Use total frames, not games won
                                    else -> p2Score
                                },
                                targetScore = targetScore,
                                gameMode = gameMode,
                                winner = winner,
                                date = endTime,
                                startTime = startTime,
                                endTime = endTime,
                                frameHistory = frameHistory,
                                playerOneSetsWon = finalP1SetsWon,
                                playerTwoSetsWon = finalP2SetsWon,
                                sets = finalSets
                            )
                        )
                    },
                    modifier = Modifier.fillMaxWidth(),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = MaterialTheme.colorScheme.errorContainer,
                        contentColor = if (isSystemInDarkTheme()) {
                            Color.White
                        } else {
                            MaterialTheme.colorScheme.onErrorContainer
                        }
                    )
                ) {
                    Text(
                        text = "End Match",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(vertical = 4.dp)
                    )
                }
            }
        }
    }
}

@Composable
fun PlayerHalf(
    playerName: String,
    score: Int,
    gamesWon: Int?,
    isWinner: Boolean,
    isEnabled: Boolean,
    backgroundColor: Color,
    topPadding: androidx.compose.ui.unit.Dp = 0.dp,
    isToBreak: Boolean = false,
    isLandscape: Boolean = false,
    onIncrement: () -> Unit,
    onDecrement: () -> Unit,
    onDish: () -> Unit,
    modifier: Modifier = Modifier
) {
    // Adjust sizes for landscape
    val playerNameSize = if (isLandscape) 16.sp else 24.sp
    val scoreSize = if (isLandscape) 60.sp else 120.sp
    val buttonTextSize = if (isLandscape) 16.sp else 24.sp
    val dishButtonTextSize = if (isLandscape) 14.sp else 20.sp
    val padding = if (isLandscape) 8.dp else 24.dp
    val buttonSpacing = if (isLandscape) 6.dp else 12.dp
    Surface(
        modifier = modifier,
        color = if (isWinner) {
            MaterialTheme.colorScheme.primary.copy(alpha = 0.3f)
        } else {
            backgroundColor
        }
    ) {
        if (isLandscape) {
            // Landscape layout: buttons in row, score below
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(top = topPadding)
                    .padding(padding),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                // Top section: Player name and games won
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = playerName,
                        fontSize = playerNameSize,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.padding(bottom = 4.dp)
                    )

                    if (gamesWon != null) {
                        Text(
                            text = "Games: $gamesWon",
                            fontSize = 10.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                            modifier = Modifier.padding(bottom = 4.dp)
                        )
                    }
                }

                // Buttons in a row
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                ) {
                    Button(
                        onClick = onIncrement,
                        modifier = Modifier.weight(1f),
                        enabled = isEnabled,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary,
                            contentColor = MaterialTheme.colorScheme.onPrimary
                        )
                    ) {
                        Text(
                            text = "+1",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(vertical = 4.dp)
                        )
                    }
                    
                    Button(
                        onClick = onDish,
                        modifier = Modifier.weight(1f),
                        enabled = isEnabled,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.secondary,
                            contentColor = MaterialTheme.colorScheme.onSecondary
                        )
                    ) {
                        Text(
                            text = "Dish",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(vertical = 4.dp)
                        )
                    }
                    
                    Button(
                        onClick = onDecrement,
                        modifier = Modifier.weight(1f),
                        enabled = isEnabled && score > 0,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer,
                            contentColor = MaterialTheme.colorScheme.onErrorContainer
                        )
                    ) {
                        Text(
                            text = "−1",
                            fontSize = 18.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(vertical = 4.dp)
                        )
                    }
                }

                // Score below buttons - moved up slightly
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier
                        .weight(1f)
                        .offset(y = (-16).dp),
                    verticalArrangement = Arrangement.Center
                ) {
                    Box(
                        modifier = Modifier
                            .height(32.dp)
                            .fillMaxWidth(),
                        contentAlignment = Alignment.Center
                    ) {
                        if (isToBreak) {
                            Text(
                                text = "To Break",
                                fontSize = 14.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                    
                    Text(
                        text = score.toString(),
                        fontSize = scoreSize,
                        fontWeight = FontWeight.Bold,
                        color = if (isWinner) {
                            MaterialTheme.colorScheme.primary
                        } else {
                            MaterialTheme.colorScheme.onSurface
                        }
                    )

                    if (isWinner) {
                        Spacer(modifier = Modifier.height(4.dp))
                        Text(
                            text = "Winner!",
                            fontSize = 12.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
        } else {
            // Portrait layout: original vertical arrangement
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(top = topPadding)
                    .padding(padding),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.SpaceBetween
            ) {
                // Top section: Player name and games won
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = playerName,
                        fontSize = playerNameSize,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurface,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )

                    if (gamesWon != null) {
                        Text(
                            text = "Games: $gamesWon",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Medium,
                            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.7f),
                            modifier = Modifier.padding(bottom = 16.dp)
                        )
                    }
                }

                // Control buttons - vertical
                Column(
                    modifier = Modifier.fillMaxWidth(),
                    verticalArrangement = Arrangement.spacedBy(buttonSpacing)
                ) {
                    Button(
                        onClick = onIncrement,
                        modifier = Modifier.fillMaxWidth(),
                        enabled = isEnabled,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.primary,
                            contentColor = MaterialTheme.colorScheme.onPrimary
                        )
                    ) {
                        Text(
                            text = "+1",
                            fontSize = buttonTextSize,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(vertical = 8.dp)
                        )
                    }
                    
                    Button(
                        onClick = onDish,
                        modifier = Modifier.fillMaxWidth(),
                        enabled = isEnabled,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.secondary,
                            contentColor = MaterialTheme.colorScheme.onSecondary
                        )
                    ) {
                        Text(
                            text = "Dish",
                            fontSize = dishButtonTextSize,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(vertical = 6.dp)
                        )
                    }
                    
                    Button(
                        onClick = onDecrement,
                        modifier = Modifier.fillMaxWidth(),
                        enabled = isEnabled && score > 0,
                        colors = ButtonDefaults.buttonColors(
                            containerColor = MaterialTheme.colorScheme.errorContainer,
                            contentColor = MaterialTheme.colorScheme.onErrorContainer
                        )
                    ) {
                        Text(
                            text = "−1",
                            fontSize = buttonTextSize,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(vertical = 8.dp)
                        )
                    }
                }

                // Score - centered in remaining space
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.weight(1f),
                    verticalArrangement = Arrangement.Center
                ) {
                    Box(
                        modifier = Modifier
                            .height(50.dp)
                            .fillMaxWidth(),
                        contentAlignment = Alignment.Center
                    ) {
                        if (isToBreak) {
                            Text(
                                text = "To Break",
                                fontSize = 22.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                    
                    Text(
                        text = score.toString(),
                        fontSize = scoreSize,
                        fontWeight = FontWeight.Bold,
                        color = if (isWinner) {
                            MaterialTheme.colorScheme.primary
                        } else {
                            MaterialTheme.colorScheme.onSurface
                        }
                    )

                    if (isWinner) {
                        Spacer(modifier = Modifier.height(16.dp))
                        Text(
                            text = "Winner!",
                            fontSize = 20.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
        }
    }
}

