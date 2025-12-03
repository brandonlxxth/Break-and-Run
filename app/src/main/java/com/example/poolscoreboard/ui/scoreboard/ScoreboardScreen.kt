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
import com.brandonlxxth.breakandrun.data.BallColor
import com.brandonlxxth.breakandrun.data.DishType
import com.brandonlxxth.breakandrun.data.Frame
import com.brandonlxxth.breakandrun.data.Game
import com.brandonlxxth.breakandrun.data.GameMode
import com.brandonlxxth.breakandrun.data.Set
import com.brandonlxxth.breakandrun.util.formatNameForDisplay
import com.brandonlxxth.breakandrun.util.normalizeName
import kotlinx.coroutines.delay
import java.util.Date

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ScoreboardScreen(
    playerOneName: String,
    playerTwoName: String,
    gameMode: GameMode,
    targetScore: Int,
    breakPlayer: String? = null,
    playerOneColor: BallColor? = null,
    playerTwoColor: BallColor? = null,
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
    
    // Track ball colors (restore from active game if resuming, otherwise use passed values)
    var playerOneColorState by remember { mutableStateOf(activeGame?.playerOneColor ?: playerOneColor) }
    var playerTwoColorState by remember { mutableStateOf(activeGame?.playerTwoColor ?: playerTwoColor) }
    
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
    
    // Break and color selection for new sets and new frames
    var showBreakSelection by remember { mutableStateOf(false) }
    var showColorSelection by remember { mutableStateOf(false) }
    var pendingBreakPlayer by remember { mutableStateOf<String?>(null) }
    var selectedColor by remember { mutableStateOf<BallColor?>(null) }
    var isForNewFrame by remember { mutableStateOf(false) } // Track if selection is for a new frame vs new set
    var pendingFrameAction by remember { mutableStateOf<Pair<String, Int>?>(null) } // Track pending action: (playerName, scoreChange) where 1=increment, -1=decrement, 0=dish
    var lastScoreState by remember { mutableStateOf(Pair(0, 0)) } // Track last score to detect new frames
    var breakPlayerBeforeDialog by remember { mutableStateOf<String?>(null) } // Track who had "to break" before dialog opened
    var isBreakSituation by remember { mutableStateOf(false) } // Track if this is a break situation (for showing Foul Break option)
    
    
    // Normalize names for comparison (lowercase, trimmed)
    val normalizedP1Name = remember(playerOneName) { normalizeName(playerOneName) }
    val normalizedP2Name = remember(playerTwoName) { normalizeName(playerTwoName) }
    
    // Handle foul break: if colors are null and this is a new game (not resuming), switch break player
    LaunchedEffect(breakPlayer, playerOneColorState, playerTwoColorState, activeGame, normalizedP1Name, normalizedP2Name) {
        if (activeGame == null && breakPlayer != null && playerOneColorState == null && playerTwoColorState == null) {
            // Foul break detected on new game - switch to opponent
            currentBreakPlayer = if (breakPlayer == normalizedP1Name) normalizedP2Name else normalizedP1Name
        }
    }
    
    // Format names for display (capitalize first letter)
    val displayP1Name = remember(playerOneName) { formatNameForDisplay(playerOneName) }
    val displayP2Name = remember(playerTwoName) { formatNameForDisplay(playerTwoName) }
    
    // Helper function to calculate who breaks next based on total frames played
    fun getNextBreakPlayer(): String {
        val totalFrames = frameHistory.size
        return if (currentBreakPlayer == null) {
            normalizedP1Name // Default to player 1 if no break player set
        } else if (totalFrames % 2 == 0) {
            // Even number of frames (0, 2, 4, ...) → initial break player
            currentBreakPlayer!! // Safe to use !! here since we checked for null above
        } else {
            // Odd number of frames (1, 3, 5, ...) → other player
            if (currentBreakPlayer == normalizedP1Name) normalizedP2Name else normalizedP1Name
        }
    }
    
    // Calculate whose turn it is to break - simply use currentBreakPlayer
    // It gets updated after each frame to switch to the other player
    val playerToBreak = currentBreakPlayer
    val p1ToBreak = playerToBreak == normalizedP1Name
    val p2ToBreak = playerToBreak == normalizedP2Name
    
    // Auto-save active game state whenever it changes (scores, frame history, etc.)
    LaunchedEffect(playerOneScore, playerTwoScore, playerOneGamesWon, playerTwoGamesWon, 
                   playerOneSetsWon, playerTwoSetsWon, frameHistory, completedSets, 
                   currentSetFrames, currentGameEnded, playerOneColorState, playerTwoColorState) {
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
                breakPlayer = currentBreakPlayer,
                playerOneColor = playerOneColorState,
                playerTwoColor = playerTwoColorState
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
                    ballColor = playerOneColorState,
                    isLandscape = isLandscape,
                    onIncrement = {
                        if (!gameEnded && !setEnded && !currentGameEnded) {
                            // Show color selection dialog at the start of every frame (when clicking +1)
                            // Reset any previous state to ensure clean start
                            selectedColor = null
                            pendingBreakPlayer = null
                            pendingFrameAction = null
                            isForNewFrame = false
                            
                            // Always show color selection for the non-breaker (the opposite of who has "to break")
                            val currentBreak = playerToBreak ?: normalizedP1Name
                            val nonBreakPlayer = if (currentBreak == normalizedP1Name) normalizedP2Name else normalizedP1Name
                            
                            // Store who had "to break" BEFORE the dialog opens
                            breakPlayerBeforeDialog = currentBreak
                            // It's a break situation if someone is to break (regardless of who clicks)
                            isBreakSituation = true // Always a break situation when someone is to break
                            pendingBreakPlayer = nonBreakPlayer
                            
                            // The action player is who clicked +1, not who the dialog is for
                            pendingFrameAction = Pair(normalizedP1Name, 1) // 1 = increment
                            isForNewFrame = true
                            showColorSelection = true
                            return@PlayerHalf
                        }
                    },
                    onDecrement = {
                        if (playerOneScore > 0 && !gameEnded && !setEnded && !currentGameEnded) {
                            // Show color selection dialog when clicking -1 (same as +1)
                            // Reset any previous state to ensure clean start
                            selectedColor = null
                            pendingBreakPlayer = null
                            pendingFrameAction = null
                            isForNewFrame = false
                            
                            // Get who currently has "to break" and show color selection for the other player
                            val currentBreak = currentBreakPlayer ?: normalizedP1Name
                            val nonBreakPlayer = if (currentBreak == normalizedP1Name) normalizedP2Name else normalizedP1Name
                            
                            // Check if this is a break situation (break player clicking -1)
                            val isBreak = currentBreak == normalizedP1Name
                            
                            // Store who had "to break" BEFORE the dialog opens
                            breakPlayerBeforeDialog = currentBreak
                            isBreakSituation = isBreak // Track if this is a break situation
                            pendingBreakPlayer = nonBreakPlayer
                            pendingFrameAction = Pair(normalizedP1Name, -1) // -1 = decrement
                            isForNewFrame = true
                            showColorSelection = true
                            return@PlayerHalf
                        }
                    },
                    onDish = {
                        if (!gameEnded && !setEnded && !currentGameEnded) {
                            // Show color selection dialog for every frame (when clicking Dish)
                            // Reset any previous state to ensure clean start
                            selectedColor = null
                            pendingBreakPlayer = null
                            pendingFrameAction = null
                            isForNewFrame = false
                            
                            // Always show color selection for the non-breaker (the opposite of who has "to break")
                            val currentBreak = playerToBreak ?: normalizedP1Name
                            val nonBreakPlayer = if (currentBreak == normalizedP1Name) normalizedP2Name else normalizedP1Name
                            
                            // Store who had "to break" BEFORE the dialog opens
                            breakPlayerBeforeDialog = currentBreak
                            // It's a break situation if someone is to break (regardless of who clicks)
                            isBreakSituation = true // Always a break situation when someone is to break
                            pendingBreakPlayer = nonBreakPlayer
                            pendingFrameAction = Pair(normalizedP1Name, 0) // 0 = dish
                            isForNewFrame = true
                            showColorSelection = true
                            return@PlayerHalf
                        }
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
                    ballColor = playerTwoColorState,
                    isLandscape = isLandscape,
                    onIncrement = {
                        if (!gameEnded && !setEnded && !currentGameEnded) {
                            // Show color selection dialog at the start of every frame (when clicking +1)
                            // Reset any previous state to ensure clean start
                            selectedColor = null
                            pendingBreakPlayer = null
                            pendingFrameAction = null
                            isForNewFrame = false
                            
                            // Always show color selection for the non-breaker (the opposite of who has "to break")
                            val currentBreak = playerToBreak ?: normalizedP2Name
                            val nonBreakPlayer = if (currentBreak == normalizedP1Name) normalizedP2Name else normalizedP1Name
                            
                            // Store who had "to break" BEFORE the dialog opens
                            breakPlayerBeforeDialog = currentBreak
                            // It's a break situation if someone is to break (regardless of who clicks)
                            isBreakSituation = true // Always a break situation when someone is to break
                            pendingBreakPlayer = nonBreakPlayer
                            
                            // The action player is who clicked +1, not who the dialog is for
                            pendingFrameAction = Pair(normalizedP2Name, 1) // 1 = increment
                            isForNewFrame = true
                            showColorSelection = true
                            return@PlayerHalf
                        }
                    },
                    onDecrement = {
                        if (playerTwoScore > 0 && !gameEnded && !setEnded && !currentGameEnded) {
                            // Show color selection dialog when clicking -1 (same as +1)
                            // Reset any previous state to ensure clean start
                            selectedColor = null
                            pendingBreakPlayer = null
                            pendingFrameAction = null
                            isForNewFrame = false
                            
                            // Get who currently has "to break" and show color selection for the other player
                            val currentBreak = currentBreakPlayer ?: normalizedP2Name
                            val nonBreakPlayer = if (currentBreak == normalizedP1Name) normalizedP2Name else normalizedP1Name
                            
                            // Check if this is a break situation (break player clicking -1)
                            val isBreak = currentBreak == normalizedP2Name
                            
                            // Store who had "to break" BEFORE the dialog opens
                            breakPlayerBeforeDialog = currentBreak
                            isBreakSituation = isBreak // Track if this is a break situation
                            pendingBreakPlayer = nonBreakPlayer
                            pendingFrameAction = Pair(normalizedP2Name, -1) // -1 = decrement
                            isForNewFrame = true
                            showColorSelection = true
                            return@PlayerHalf
                        }
                    },
                    onDish = {
                        if (!gameEnded && !setEnded && !currentGameEnded) {
                            // Show color selection dialog for every frame (when clicking Dish)
                            // Reset any previous state to ensure clean start
                            selectedColor = null
                            pendingBreakPlayer = null
                            pendingFrameAction = null
                            isForNewFrame = false
                            
                            // Always show color selection for the non-breaker (the opposite of who has "to break")
                            val currentBreak = playerToBreak ?: normalizedP2Name
                            val nonBreakPlayer = if (currentBreak == normalizedP1Name) normalizedP2Name else normalizedP1Name
                            
                            // Store who had "to break" BEFORE the dialog opens
                            breakPlayerBeforeDialog = currentBreak
                            // It's a break situation if someone is to break (regardless of who clicks)
                            isBreakSituation = true // Always a break situation when someone is to break
                            pendingBreakPlayer = nonBreakPlayer
                            pendingFrameAction = Pair(normalizedP2Name, 0) // 0 = dish
                            isForNewFrame = true
                            showColorSelection = true
                            return@PlayerHalf
                        }
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
                            
                            // Calculate who breaks next based on completed frames (alternates)
                            val nextBreakPlayer = getNextBreakPlayer()
                            
                            // Store who had "to break" BEFORE the dialog opens (the winner of the previous set)
                            breakPlayerBeforeDialog = currentBreakPlayer
                            // New set is always a break situation
                            isBreakSituation = true
                            
                            // Show color selection dialog for new set
                            pendingBreakPlayer = nextBreakPlayer
                            isForNewFrame = true
                            showColorSelection = true
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
        
        // Break selection dialog for new sets
        if (showBreakSelection) {
            AlertDialog(
                onDismissRequest = { showBreakSelection = false },
                title = {
                    Text("Who Breaks First?")
                },
                text = {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(12.dp)
                    ) {
                        Button(
                            onClick = {
                                pendingBreakPlayer = normalizedP1Name
                                showBreakSelection = false
                                showColorSelection = true
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = displayP1Name,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.padding(vertical = 4.dp)
                            )
                        }
                        
                        Button(
                            onClick = {
                                pendingBreakPlayer = normalizedP2Name
                                showBreakSelection = false
                                showColorSelection = true
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = displayP2Name,
                                fontSize = 18.sp,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.padding(vertical = 4.dp)
                            )
                        }
                    }
                },
                confirmButton = {},
                dismissButton = {
                    TextButton(
                        onClick = { showBreakSelection = false }
                    ) {
                        Text("Cancel")
                    }
                }
            )
        }
        
        // Color selection dialog for new sets and new frames
        LaunchedEffect(selectedColor, pendingBreakPlayer, isForNewFrame, pendingFrameAction, showColorSelection) {
            // Process color selection when a color is selected and dialog is closed
            if (selectedColor != null && pendingBreakPlayer != null && !showColorSelection) {
                val breakP = pendingBreakPlayer!! // This is the non-breaker
                val selectedColorValue = selectedColor!!
                
                // Use a small delay to ensure state is stable
                kotlinx.coroutines.delay(50)
                
                when (selectedColorValue) {
                    BallColor.FOUL_BREAK -> {
                        // Foul break: switch break player and show color selection again
                        val newBreakPlayer = if (breakP == normalizedP1Name) normalizedP2Name else normalizedP1Name
                        pendingBreakPlayer = newBreakPlayer
                        selectedColor = null
                        showColorSelection = true
                    }
                    BallColor.RED, BallColor.YELLOW -> {
                        // Switch break player to the opposite of who had "to break" BEFORE the dialog opened
                        // This happens when Red or Yellow is clicked, not when the frame ends
                        val breakBeforeDialog = breakPlayerBeforeDialog ?: currentBreakPlayer ?: normalizedP1Name
                        val newBreakPlayer = if (breakBeforeDialog == normalizedP1Name) normalizedP2Name else normalizedP1Name
                        currentBreakPlayer = newBreakPlayer
                        
                        // Reset the stored break player
                        breakPlayerBeforeDialog = null
                        
                        // Assign colors: the player who selected the color (breakP) gets the selected color
                        // The other player gets the opposite color
                        if (selectedColorValue == BallColor.RED) {
                            if (breakP == normalizedP1Name) {
                                playerOneColorState = BallColor.RED
                                playerTwoColorState = BallColor.YELLOW
                            } else {
                                playerOneColorState = BallColor.YELLOW
                                playerTwoColorState = BallColor.RED
                            }
                        } else {
                            if (breakP == normalizedP1Name) {
                                playerOneColorState = BallColor.YELLOW
                                playerTwoColorState = BallColor.RED
                            } else {
                                playerOneColorState = BallColor.RED
                                playerTwoColorState = BallColor.YELLOW
                            }
                        }
                        
                        // Execute the pending action (increment, decrement, or dish)
                        if (isForNewFrame && pendingFrameAction != null) {
                            val (actionPlayer, scoreChange) = pendingFrameAction!!
                            
                            when (scoreChange) {
                                0 -> {
                                    // Execute dish action
                                    dishPlayer = actionPlayer
                                    showDishDialog = true
                                }
                                1 -> {
                                    // Execute increment action - update the score
                                    if (actionPlayer == normalizedP1Name) {
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
                                        // Break player will be updated by LaunchedEffect when frame ends
                                    } else {
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
                                        // Break player will be updated by LaunchedEffect when frame ends
                                    }
                                }
                                -1 -> {
                                    // Execute decrement action - remove the last frame and decrement score
                                    if (actionPlayer == normalizedP1Name && playerOneScore > 0) {
                                        val lastFrame = frameHistory.lastOrNull()
                                        if (lastFrame != null && lastFrame.player == normalizedP1Name) {
                                            frameHistory = frameHistory.dropLast(1)
                                            currentSetFrames = currentSetFrames.dropLast(1)
                                        }
                                        playerOneScore--
                                        
                                        // Check if decrementing brought the game back below target - re-enable game
                                        val newFrameCount = playerOneScore + playerTwoScore
                                        if (gameMode == GameMode.BEST_OF && newFrameCount < targetScore) {
                                            currentGameEnded = false
                                        }
                                    } else if (actionPlayer == normalizedP2Name && playerTwoScore > 0) {
                                        val lastFrame = frameHistory.lastOrNull()
                                        if (lastFrame != null && lastFrame.player == normalizedP2Name) {
                                            frameHistory = frameHistory.dropLast(1)
                                            currentSetFrames = currentSetFrames.dropLast(1)
                                        }
                                        playerTwoScore--
                                        
                                        // Check if decrementing brought the game back below target - re-enable game
                                        val newFrameCount = playerOneScore + playerTwoScore
                                        if (gameMode == GameMode.BEST_OF && newFrameCount < targetScore) {
                                            currentGameEnded = false
                                        }
                                    }
                                }
                            }
                            
                            // Reset state after processing - IMPORTANT: reset all state so dialog can show again
                            pendingFrameAction = null
                            isForNewFrame = false
                        }
                        
                        // Reset state - ensure everything is cleared for next frame
                        selectedColor = null
                        pendingBreakPlayer = null
                    }
                }
            }
        }
        
        if (showColorSelection && pendingBreakPlayer != null) {
            val breakPlayerName = if (pendingBreakPlayer == normalizedP1Name) {
                displayP1Name
            } else {
                displayP2Name
            }
            
            AlertDialog(
                onDismissRequest = { 
                    showColorSelection = false
                    pendingBreakPlayer = null
                    selectedColor = null
                    pendingFrameAction = null
                    isForNewFrame = false
                },
                title = {
                    Text("Select Color for $breakPlayerName")
                },
                text = {
                    if (isLandscape) {
                        // Landscape: Use grid layout (2 columns)
                        Column(
                            verticalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                // Red button
                                Button(
                                    onClick = {
                                        showColorSelection = false
                                        selectedColor = BallColor.RED
                                    },
                                    modifier = Modifier.weight(1f),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color(0xFFDC143C) // Red color
                                    )
                                ) {
                                    Text(
                                        text = "Red",
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Color.White,
                                        modifier = Modifier.padding(vertical = 4.dp)
                                    )
                                }
                                
                                // Yellow button
                                Button(
                                    onClick = {
                                        showColorSelection = false
                                        selectedColor = BallColor.YELLOW
                                    },
                                    modifier = Modifier.weight(1f),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = Color(0xFFFFD700) // Yellow/Gold color
                                    )
                                ) {
                                    Text(
                                        text = "Yellow",
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = Color.Black,
                                        modifier = Modifier.padding(vertical = 4.dp)
                                    )
                                }
                            }
                            
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                // Foul break button - only show if this is a break situation (not after Open Table)
                                if (isBreakSituation) {
                                    Button(
                                        onClick = {
                                            showColorSelection = false
                                            selectedColor = BallColor.FOUL_BREAK
                                        },
                                        modifier = Modifier.weight(1f),
                                        colors = ButtonDefaults.buttonColors(
                                            containerColor = MaterialTheme.colorScheme.errorContainer
                                        )
                                    ) {
                                        Text(
                                            text = "Foul Break",
                                            fontSize = 16.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = MaterialTheme.colorScheme.onErrorContainer,
                                            modifier = Modifier.padding(vertical = 4.dp)
                                        )
                                    }
                                }
                                
                                // Open Table button - show on every color selection dialog
                                Button(
                                    onClick = {
                                        // Switch to the opposite player and keep dialog open
                                        pendingBreakPlayer = if (pendingBreakPlayer == normalizedP1Name) {
                                            normalizedP2Name
                                        } else {
                                            normalizedP1Name
                                        }
                                        // After Open Table is selected, it's no longer a break situation
                                        isBreakSituation = false
                                        // Dialog stays open with new player name
                                    },
                                    modifier = Modifier.weight(1f),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = MaterialTheme.colorScheme.tertiary
                                    )
                                ) {
                                    Text(
                                        text = "Open Table",
                                        fontSize = 16.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = MaterialTheme.colorScheme.onTertiary,
                                        modifier = Modifier.padding(vertical = 4.dp)
                                    )
                                }
                            }
                        }
                    } else {
                        // Portrait: Use vertical layout
                        Column(
                            verticalArrangement = Arrangement.spacedBy(12.dp)
                        ) {
                            // Red button
                            Button(
                                onClick = {
                                    showColorSelection = false
                                    selectedColor = BallColor.RED
                                },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Color(0xFFDC143C) // Red color
                                )
                            ) {
                                Text(
                                    text = "Red",
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color.White,
                                    modifier = Modifier.padding(vertical = 4.dp)
                                )
                            }
                            
                            // Yellow button
                            Button(
                                onClick = {
                                    showColorSelection = false
                                    selectedColor = BallColor.YELLOW
                                },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = Color(0xFFFFD700) // Yellow/Gold color
                                )
                            ) {
                                Text(
                                    text = "Yellow",
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = Color.Black,
                                    modifier = Modifier.padding(vertical = 4.dp)
                                )
                            }
                            
                            // Foul break button - only show if this is a break situation (not after Open Table)
                            if (isBreakSituation) {
                                Button(
                                    onClick = {
                                        showColorSelection = false
                                        selectedColor = BallColor.FOUL_BREAK
                                    },
                                    modifier = Modifier.fillMaxWidth(),
                                    colors = ButtonDefaults.buttonColors(
                                        containerColor = MaterialTheme.colorScheme.errorContainer
                                    )
                                ) {
                                    Text(
                                        text = "Foul Break",
                                        fontSize = 18.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = MaterialTheme.colorScheme.onErrorContainer,
                                        modifier = Modifier.padding(vertical = 4.dp)
                                    )
                                }
                            }
                            
                            // Open Table button - show on every color selection dialog
                            Button(
                                onClick = {
                                    // Switch to the opposite player and keep dialog open
                                    pendingBreakPlayer = if (pendingBreakPlayer == normalizedP1Name) {
                                        normalizedP2Name
                                    } else {
                                        normalizedP1Name
                                    }
                                    // After Open Table is selected, it's no longer a break situation
                                    isBreakSituation = false
                                    // Dialog stays open with new player name
                                },
                                modifier = Modifier.fillMaxWidth(),
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = MaterialTheme.colorScheme.tertiary
                                )
                            ) {
                                Text(
                                    text = "Open Table",
                                    fontSize = 18.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onTertiary,
                                    modifier = Modifier.padding(vertical = 4.dp)
                                )
                            }
                        }
                    }
                },
                confirmButton = {},
                dismissButton = {
                    TextButton(
                        onClick = { 
                            showColorSelection = false
                            pendingBreakPlayer = null
                            selectedColor = null
                            pendingFrameAction = null
                            isForNewFrame = false
                        }
                    ) {
                        Text("Cancel")
                    }
                }
            )
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
    ballColor: BallColor? = null,
    isLandscape: Boolean = false,
    onIncrement: () -> Unit,
    onDecrement: () -> Unit,
    onDish: () -> Unit,
    onOpenTable: (() -> Unit)? = null,
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
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = playerName,
                            fontSize = playerNameSize,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.padding(bottom = 4.dp)
                        )
                        // Display ball color indicator
                        ballColor?.let { color ->
                            Surface(
                                shape = MaterialTheme.shapes.small,
                                color = when (color) {
                                    BallColor.RED -> Color(0xFFDC143C)
                                    BallColor.YELLOW -> Color(0xFFFFD700)
                                    BallColor.FOUL_BREAK -> Color.Transparent
                                },
                                modifier = Modifier
                                    .size(if (isLandscape) 16.dp else 20.dp)
                                    .padding(bottom = 4.dp)
                            ) {
                                // Empty surface for color indicator
                            }
                        }
                    }

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
                        enabled = score > 0, // Always allow decrementing if score > 0, even when game ended
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
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = playerName,
                            fontSize = playerNameSize,
                            fontWeight = FontWeight.SemiBold,
                            color = MaterialTheme.colorScheme.onSurface,
                            modifier = Modifier.padding(bottom = 8.dp)
                        )
                        // Display ball color indicator
                        ballColor?.let { color ->
                            Surface(
                                shape = MaterialTheme.shapes.small,
                                color = when (color) {
                                    BallColor.RED -> Color(0xFFDC143C)
                                    BallColor.YELLOW -> Color(0xFFFFD700)
                                    BallColor.FOUL_BREAK -> Color.Transparent
                                },
                                modifier = Modifier
                                    .size(if (isLandscape) 16.dp else 20.dp)
                                    .padding(bottom = 8.dp)
                            ) {
                                // Empty surface for color indicator
                            }
                        }
                    }

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
                        enabled = score > 0, // Always allow decrementing if score > 0, even when game ended
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

