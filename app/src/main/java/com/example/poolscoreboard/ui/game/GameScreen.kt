package com.example.poolscoreboard.ui.game

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.selection.selectable
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalConfiguration
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import android.content.res.Configuration
import kotlinx.coroutines.delay
import com.example.poolscoreboard.data.GameMode
import com.example.poolscoreboard.util.formatNameForDisplay
import com.example.poolscoreboard.util.normalizeName

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GameScreen(
    onBackClick: () -> Unit,
    onCreateGame: (String, String, GameMode, Int, String) -> Unit
) {
    // Target score
    var targetScore by remember { mutableStateOf(7) }
    
    // Game mode selection
    var gameMode by remember { mutableStateOf(GameMode.RACE_TO) }
    
    // Player names
    var playerOneName by remember { mutableStateOf("Player 1") }
    var playerTwoName by remember { mutableStateOf("Player 2") }
    
    // Break selection state
    var showBreakSelection by remember { mutableStateOf(false) }
    var selectedBreakPlayer by remember { mutableStateOf<String?>(null) }
    var pendingGameCreation by remember { mutableStateOf<Pair<String, String>?>(null) }
    
    // Handle pending game creation after dialog dismisses
    LaunchedEffect(showBreakSelection, pendingGameCreation) {
        if (!showBreakSelection && pendingGameCreation != null) {
            val (breakP, normP1) = pendingGameCreation!!
            val normP2 = normalizeName(playerTwoName.ifBlank { "Player 2" })
            delay(50) // Small delay to ensure dialog is fully dismissed
            onCreateGame(normP1, normP2, gameMode, targetScore, breakP)
            pendingGameCreation = null
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("New Game") },
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
        // Detect orientation
        val configuration = LocalConfiguration.current
        val isLandscape = configuration.orientation == Configuration.ORIENTATION_LANDSCAPE
        val scrollState = rememberScrollState()
        
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(scrollState)
                .padding(if (isLandscape) 16.dp else 20.dp),
            verticalArrangement = Arrangement.spacedBy(if (isLandscape) 16.dp else 24.dp)
        ) {
            // Game mode and target score section
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.secondaryContainer
                ),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(if (isLandscape) 12.dp else 20.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    // Game mode selector
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceEvenly
                    ) {
                        GameMode.values().forEach { mode ->
                            val isSelected = gameMode == mode
                            Card(
                                modifier = Modifier
                                    .weight(1f)
                                    .clickable { gameMode = mode }
                                    .then(
                                        if (isSelected) {
                                            Modifier.border(
                                                width = 2.dp,
                                                color = MaterialTheme.colorScheme.primary,
                                                shape = MaterialTheme.shapes.small
                                            )
                                        } else {
                                            Modifier
                                        }
                                    ),
                                shape = MaterialTheme.shapes.small,
                                colors = CardDefaults.cardColors(
                                    containerColor = if (isSelected) {
                                        MaterialTheme.colorScheme.primaryContainer
                                    } else {
                                        MaterialTheme.colorScheme.surfaceVariant
                                    }
                                ),
                                elevation = CardDefaults.cardElevation(defaultElevation = 0.dp)
                            ) {
                                Box(
                                    modifier = Modifier
                                        .fillMaxWidth()
                                        .padding(horizontal = 12.dp, vertical = 8.dp),
                                    contentAlignment = Alignment.Center
                                ) {
                                    Text(
                                        text = mode.displayName,
                                        color = if (isSelected) {
                                            MaterialTheme.colorScheme.onPrimaryContainer
                                        } else {
                                            MaterialTheme.colorScheme.onSurfaceVariant
                                        },
                                        style = MaterialTheme.typography.labelLarge
                                    )
                                }
                            }
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(if (isLandscape) 8.dp else 16.dp))
                    
                    Text(
                        text = gameMode.displayName,
                        fontSize = if (isLandscape) 14.sp else 16.sp,
                        color = MaterialTheme.colorScheme.onSecondaryContainer.copy(alpha = 0.7f)
                    )
                    Spacer(modifier = Modifier.height(if (isLandscape) 4.dp else 8.dp))
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.Center
                    ) {
                        IconButton(
                            onClick = { if (targetScore > 1) targetScore-- },
                            modifier = Modifier.size(if (isLandscape) 40.dp else 48.dp)
                        ) {
                            Text(
                                text = "−",
                                fontSize = if (isLandscape) 28.sp else 32.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSecondaryContainer
                            )
                        }
                        Text(
                            text = targetScore.toString(),
                            fontSize = if (isLandscape) 36.sp else 48.sp,
                            fontWeight = FontWeight.Bold,
                            color = MaterialTheme.colorScheme.onSecondaryContainer,
                            modifier = Modifier.padding(horizontal = if (isLandscape) 16.dp else 24.dp)
                        )
                        IconButton(
                            onClick = { targetScore++ },
                            modifier = Modifier.size(if (isLandscape) 40.dp else 48.dp)
                        ) {
                            Text(
                                text = "+",
                                fontSize = if (isLandscape) 28.sp else 32.sp,
                                fontWeight = FontWeight.Bold,
                                color = MaterialTheme.colorScheme.onSecondaryContainer
                            )
                        }
                    }
                    
                }
            }

            // Player names section
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = MaterialTheme.colorScheme.surfaceVariant
                ),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(if (isLandscape) 12.dp else 20.dp),
                    verticalArrangement = Arrangement.spacedBy(if (isLandscape) 12.dp else 16.dp)
                ) {
                    OutlinedTextField(
                        value = playerOneName,
                        onValueChange = { playerOneName = it },
                        label = { Text("Player 1 Name") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                    
                    OutlinedTextField(
                        value = playerTwoName,
                        onValueChange = { playerTwoName = it },
                        label = { Text("Player 2 Name") },
                        modifier = Modifier.fillMaxWidth(),
                        singleLine = true
                    )
                }
            }

            // Create Game button section
            Button(
                onClick = {
                    // Show break selection dialog
                    showBreakSelection = true
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(horizontal = if (isLandscape) 16.dp else 32.dp)
                    .padding(top = if (isLandscape) 8.dp else 0.dp)
                    .padding(bottom = if (isLandscape) 8.dp else 16.dp),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    contentColor = MaterialTheme.colorScheme.onPrimary
                )
            ) {
                Text(
                    text = "Create Game",
                    fontSize = if (isLandscape) 18.sp else 24.sp,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.padding(vertical = if (isLandscape) 8.dp else 12.dp)
                )
            }
        }
        
        // Break selection dialog
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
                        val p1Name = playerOneName.ifBlank { "Player 1" }
                        val p2Name = playerTwoName.ifBlank { "Player 2" }
                        
                        Button(
                            onClick = {
                                val breakP = normalizeName(p1Name)
                                selectedBreakPlayer = breakP
                                val normP1 = normalizeName(p1Name)
                                pendingGameCreation = Pair(breakP, normP1)
                                showBreakSelection = false
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = formatNameForDisplay(p1Name),
                                fontSize = 18.sp,
                                fontWeight = FontWeight.SemiBold,
                                modifier = Modifier.padding(vertical = 4.dp)
                            )
                        }
                        
                        Button(
                            onClick = {
                                val breakP = normalizeName(p2Name)
                                selectedBreakPlayer = breakP
                                val normP1 = normalizeName(p1Name)
                                pendingGameCreation = Pair(breakP, normP1)
                                showBreakSelection = false
                            },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(
                                text = formatNameForDisplay(p2Name),
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
    }
}

