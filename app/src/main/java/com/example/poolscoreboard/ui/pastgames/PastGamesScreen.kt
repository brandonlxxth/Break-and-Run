package com.brandonlxxth.breakandrun.ui.pastgames

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.KeyboardArrowDown
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.rotate
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.brandonlxxth.breakandrun.data.DishType
import com.brandonlxxth.breakandrun.data.Frame
import com.brandonlxxth.breakandrun.data.Game
import com.brandonlxxth.breakandrun.data.GameMode
import com.brandonlxxth.breakandrun.data.Set
import com.brandonlxxth.breakandrun.util.formatNameForDisplay
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PastGamesScreen(
    games: List<Game>,
    onBackClick: () -> Unit,
    onDeleteGame: (String) -> Unit
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Past Games") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Filled.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primaryContainer,
                    titleContentColor = MaterialTheme.colorScheme.onPrimaryContainer
                )
            )
        }
    ) { paddingValues ->
        if (games.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text(
                        text = "No past games",
                        fontSize = 20.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(16.dp)
                    )
                    Text(
                        text = "Start a new game to see it here",
                        fontSize = 16.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(
                    items = games,
                    key = { game -> game.id }
                ) { game ->
                    ExpandableGameCard(
                        game = game,
                        onDelete = { onDeleteGame(game.id) }
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExpandableGameCard(
    game: Game,
    onDelete: () -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    var showDeleteConfirmation by remember { mutableStateOf(false) }
    val dateFormat = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
    val timeFormat = SimpleDateFormat("HH:mm:ss", Locale.getDefault())
    
    // Calculate stats with null safety
    val duration = try {
        game.endTime.time - game.startTime.time
    } catch (e: Exception) {
        0L
    }
    val durationSeconds = duration / 1000
    val durationMinutes = durationSeconds / 60
    val durationSecs = durationSeconds % 60
    
    val avgTimeBetweenFrames = try {
        when {
            game.frameHistory.isEmpty() -> 0.0
            game.frameHistory.size == 1 -> {
                // If only one frame, calculate time from start to that frame
                val timeFromStart = game.frameHistory.first().timestamp.time - game.startTime.time
                timeFromStart.toDouble()
            }
            else -> {
                // Multiple frames: calculate average time between frames
                val totalTime = game.frameHistory.last().timestamp.time - game.frameHistory.first().timestamp.time
                totalTime.toDouble() / (game.frameHistory.size - 1)
            }
        }
    } catch (e: Exception) {
        0.0
    }
    val avgSeconds = avgTimeBetweenFrames / 1000.0
    val avgMinutes = (avgSeconds / 60).toInt()
    val avgSecs = avgSeconds % 60
    
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        ),
        onClick = { expanded = !expanded }
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = "${formatNameForDisplay(game.playerOneName)} vs ${formatNameForDisplay(game.playerTwoName)}",
                        fontSize = 18.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Spacer(modifier = Modifier.height(4.dp))
                    Text(
                        text = dateFormat.format(game.date),
                        fontSize = 12.sp,
                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                    )
                }
                
                Row(
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Column(
                        horizontalAlignment = Alignment.End
                    ) {
                    Text(
                        text = if (game.gameMode == GameMode.FIRST_TO && game.sets.isNotEmpty()) {
                            "${game.playerOneSetsWon} - ${game.playerTwoSetsWon}"
                        } else {
                            "${game.playerOneScore} - ${game.playerTwoScore}"
                        },
                        fontSize = 20.sp,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = if (game.winner != null) {
                            "Winner: ${formatNameForDisplay(game.winner)}"
                        } else {
                            "Draw"
                        },
                        fontSize = 12.sp,
                        color = if (game.winner != null) {
                            MaterialTheme.colorScheme.primary
                        } else {
                            MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                        },
                        fontWeight = FontWeight.Medium
                    )
                    }
                    
                    IconButton(
                        onClick = { showDeleteConfirmation = true },
                        modifier = Modifier.size(40.dp)
                    ) {
                        Icon(
                            imageVector = Icons.Default.Delete,
                            contentDescription = "Delete game",
                            tint = MaterialTheme.colorScheme.error
                        )
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = if (game.gameMode == GameMode.FREE_PLAY) {
                    game.gameMode.displayName
                } else {
                    "${game.gameMode.displayName}: ${game.targetScore}"
                },
                fontSize = 14.sp,
                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
            )
            
            // Compact stats
            if (game.frameHistory.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Column {
                        Text(
                            text = "Start: ${timeFormat.format(game.startTime)}",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                        )
                        Text(
                            text = "End: ${timeFormat.format(game.endTime)}",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                        )
                    }
                    Column(horizontalAlignment = Alignment.End) {
                        Text(
                            text = "Duration: ${durationMinutes}m ${durationSecs}s",
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                        )
                        Text(
                            text = if (avgMinutes > 0) {
                                "Avg: ${avgMinutes}m ${String.format("%.1f", avgSecs)}s/frame"
                            } else {
                                "Avg: ${String.format("%.1f", avgSeconds)}s/frame"
                            },
                            fontSize = 11.sp,
                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                        )
                    }
                }
            }
            
            // Expanded breakdown
            if (expanded) {
                Spacer(modifier = Modifier.height(12.dp))
                HorizontalDivider(modifier = Modifier.padding(vertical = 8.dp))
                
                // Show sets breakdown for "Sets of" mode
                if (game.gameMode == GameMode.FIRST_TO && game.sets.isNotEmpty()) {
                    Text(
                        text = "Set-by-Set Breakdown",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    
                    game.sets.forEachIndexed { index, set ->
                        Column(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp)
                        ) {
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Set ${set.setNumber}: ${set.playerOneScore} - ${set.playerTwoScore}",
                                    fontSize = 13.sp,
                                    fontWeight = FontWeight.SemiBold,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant
                                )
                                Text(
                                    text = if (set.winner != null) {
                                        "Winner: ${formatNameForDisplay(set.winner)}"
                                    } else {
                                        "Draw"
                                    },
                                    fontSize = 11.sp,
                                    color = if (set.winner != null) {
                                        MaterialTheme.colorScheme.primary
                                    } else {
                                        MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                                    },
                                    fontWeight = FontWeight.Medium
                                )
                            }
                            
                            // Show frames for this set
                            if (set.frames.isNotEmpty()) {
                                var previousTime = if (index == 0) game.startTime else game.sets[index - 1].frames.lastOrNull()?.timestamp ?: game.startTime
                                set.frames.forEachIndexed { frameIndex, frame ->
                                    val timeSincePrevious = try {
                                        frame.timestamp.time - previousTime.time
                                    } catch (e: Exception) {
                                        0L
                                    }
                                    val secondsSincePrevious = timeSincePrevious / 1000.0
                                    
                                    Row(
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .padding(start = 16.dp, top = 2.dp, bottom = 2.dp),
                                        horizontalArrangement = Arrangement.SpaceBetween
                                    ) {
                                        Column(modifier = Modifier.weight(1f)) {
                                            if (frame.dishType != null) {
                                                // Dish frame - make it visually distinct
                                                Row(
                                                    verticalAlignment = Alignment.CenterVertically,
                                                    horizontalArrangement = Arrangement.spacedBy(6.dp)
                                                ) {
                                                    Text(
                                                        text = formatNameForDisplay(frame.player),
                                                        fontSize = 11.sp,
                                                        fontWeight = FontWeight.SemiBold,
                                                        color = MaterialTheme.colorScheme.primary
                                                    )
                                                    Surface(
                                                        shape = MaterialTheme.shapes.small,
                                                        color = MaterialTheme.colorScheme.secondaryContainer,
                                                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                                    ) {
                                                        Text(
                                                            text = frame.dishType.displayName,
                                                            fontSize = 10.sp,
                                                            fontWeight = FontWeight.Bold,
                                                            color = MaterialTheme.colorScheme.onSecondaryContainer,
                                                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                                        )
                                                    }
                                                    Text(
                                                        text = "${frame.playerOneScore} - ${frame.playerTwoScore}",
                                                        fontSize = 11.sp,
                                                        color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                                                    )
                                                }
                                            } else {
                                                // Normal frame
                                                Text(
                                                    text = "${formatNameForDisplay(frame.player)} ${if (frame.scoreChange > 0) "+" else ""}${frame.scoreChange} ${frame.playerOneScore} - ${frame.playerTwoScore}",
                                                    fontSize = 11.sp,
                                                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                                                )
                                            }
                                        }
                                        Text(
                                            text = "+${String.format("%.1f", secondsSincePrevious)}s",
                                            fontSize = 10.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                                        )
                                    }
                                    
                                    previousTime = frame.timestamp
                                }
                            }
                        }
                        
                        if (index < game.sets.size - 1) {
                            HorizontalDivider(
                                modifier = Modifier.padding(vertical = 4.dp),
                                thickness = 1.dp,
                                color = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f)
                            )
                        }
                    }
                } else if (game.frameHistory.isNotEmpty()) {
                    // Regular frame-by-frame breakdown for other modes
                    Text(
                        text = "Frame-by-Frame Breakdown",
                        fontSize = 14.sp,
                        fontWeight = FontWeight.SemiBold,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        modifier = Modifier.padding(bottom = 8.dp)
                    )
                    
                    var previousTime = game.startTime
                    game.frameHistory.forEachIndexed { index, frame ->
                        val timeSincePrevious = try {
                            frame.timestamp.time - previousTime.time
                        } catch (e: Exception) {
                            0L
                        }
                        val secondsSincePrevious = timeSincePrevious / 1000.0
                        
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 4.dp),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            Column(modifier = Modifier.weight(1f)) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                                    modifier = Modifier.padding(bottom = 4.dp)
                                ) {
                                    Text(
                                        text = "Frame ${index + 1}:",
                                        fontSize = 12.sp,
                                        fontWeight = FontWeight.SemiBold,
                                        color = MaterialTheme.colorScheme.onSurfaceVariant
                                    )
                                    if (frame.dishType != null) {
                                        // Dish frame - make it visually distinct
                                        Text(
                                            text = formatNameForDisplay(frame.player),
                                            fontSize = 12.sp,
                                            fontWeight = FontWeight.SemiBold,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                        Surface(
                                            shape = MaterialTheme.shapes.small,
                                            color = MaterialTheme.colorScheme.secondaryContainer,
                                            modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                        ) {
                                            Text(
                                                text = frame.dishType.displayName,
                                                fontSize = 10.sp,
                                                fontWeight = FontWeight.Bold,
                                                color = MaterialTheme.colorScheme.onSecondaryContainer,
                                                modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                                            )
                                        }
                                    } else {
                                        // Normal frame
                                        Text(
                                            text = "${formatNameForDisplay(frame.player)} ${if (frame.scoreChange > 0) "+" else ""}${frame.scoreChange}",
                                            fontSize = 12.sp,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                                Text(
                                    text = "Score: ${frame.playerOneScore} - ${frame.playerTwoScore}",
                                    fontSize = 11.sp,
                                    color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.7f)
                                )
                            }
                            Text(
                                text = "+${String.format("%.1f", secondsSincePrevious)}s",
                                fontSize = 11.sp,
                                color = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                            )
                        }
                        
                        previousTime = frame.timestamp
                    }
                }
            }
            
            // Expand/collapse indicator
            if (game.frameHistory.isNotEmpty() || (game.gameMode == GameMode.FIRST_TO && game.sets.isNotEmpty())) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                    horizontalArrangement = Arrangement.Center
                ) {
                    Icon(
                        imageVector = Icons.Default.KeyboardArrowDown,
                        contentDescription = if (expanded) "Collapse" else "Expand",
                        modifier = Modifier.rotate(if (expanded) 180f else 0f),
                        tint = MaterialTheme.colorScheme.onSurfaceVariant.copy(alpha = 0.6f)
                    )
                }
            }
        }
    }
    
    // Delete confirmation dialog
    if (showDeleteConfirmation) {
        AlertDialog(
            onDismissRequest = { showDeleteConfirmation = false },
            title = {
                Text(
                    text = "Delete Game?",
                    fontWeight = FontWeight.Bold
                )
            },
            text = {
                Text(
                    text = "Are you sure you want to delete this game? This action cannot be undone.",
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        showDeleteConfirmation = false
                        onDelete()
                    },
                    colors = ButtonDefaults.textButtonColors(
                        contentColor = MaterialTheme.colorScheme.error
                    )
                ) {
                    Text("Delete", fontWeight = FontWeight.SemiBold)
                }
            },
            dismissButton = {
                TextButton(
                    onClick = { showDeleteConfirmation = false }
                ) {
                    Text("Cancel")
                }
            }
        )
    }
}

