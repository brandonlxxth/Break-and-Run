package com.brandonlxxth.breakandrun.ui.game

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
import com.brandonlxxth.breakandrun.data.GameMode
import com.brandonlxxth.breakandrun.data.BallColor
import com.brandonlxxth.breakandrun.util.formatNameForDisplay
import com.brandonlxxth.breakandrun.util.normalizeName

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun GameScreen(
    onBackClick: () -> Unit,
    onCreateGame: (String, String, GameMode, Int, String, BallColor?, BallColor?) -> Unit
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
    var showColorSelection by remember { mutableStateOf(false) }
    var selectedBreakPlayer by remember { mutableStateOf<String?>(null) } // Original break player (doesn't change with Open Table)
    var selectedColor by remember { mutableStateOf<BallColor?>(null) }
    var pendingBreakPlayer by remember { mutableStateOf<String?>(null) } // Current player shown in dialog (can change with Open Table)
    var isBreakSituation by remember { mutableStateOf(false) } // Tracks if this is a break situation (for showing Foul Break option)
    
    // Handle color selection and game creation
    LaunchedEffect(showColorSelection, selectedColor, pendingBreakPlayer) {
        if (!showColorSelection && selectedColor != null && pendingBreakPlayer != null) {
            val breakP = pendingBreakPlayer!!
            val normP1 = normalizeName(playerOneName.ifBlank { "Player 1" })
            val normP2 = normalizeName(playerTwoName.ifBlank { "Player 2" })
            delay(50) // Small delay to ensure dialog is fully dismissed
            
            when (selectedColor) {
                BallColor.FOUL_BREAK -> {
                    // Foul break: switch break player and show color selection again for the opponent
                    val newBreakPlayer = if (breakP == normP1) normP2 else normP1
                    pendingBreakPlayer = newBreakPlayer
                    selectedColor = null // Reset to allow new selection
                    showColorSelection = true // Show dialog again for the opponent
                }
                BallColor.RED, BallColor.YELLOW -> {
                    // Determine colors based on selection
                    // Use the original break player (selectedBreakPlayer), not the current pendingBreakPlayer
                    // which may have been changed by "Open Table"
                    val originalBreakPlayer = selectedBreakPlayer ?: breakP
                    val p1Color: BallColor?
                    val p2Color: BallColor?
                    val finalBreakPlayer = originalBreakPlayer
                    
                    // breakP is the player who selected the color (may be different from original break player if Open Table was used)
                    if (selectedColor == BallColor.RED) {
                        // The player who selected red gets red, the other gets yellow
                        if (breakP == normP1) {
                            p1Color = BallColor.RED
                            p2Color = BallColor.YELLOW
                        } else {
                            p1Color = BallColor.YELLOW
                            p2Color = BallColor.RED
                        }
                    } else {
                        // The player who selected yellow gets yellow, the other gets red
                        if (breakP == normP1) {
                            p1Color = BallColor.YELLOW
                            p2Color = BallColor.RED
                        } else {
                            p1Color = BallColor.RED
                            p2Color = BallColor.YELLOW
                        }
                    }
                    
                    onCreateGame(normP1, normP2, gameMode, targetScore, finalBreakPlayer, p1Color, p2Color)
                    selectedColor = null
                    pendingBreakPlayer = null
                    selectedBreakPlayer = null
                }
                null -> {
                    // Cancel or no selection - do nothing
                    selectedColor = null
                    pendingBreakPlayer = null
                }
            }
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
                                pendingBreakPlayer = breakP
                                isBreakSituation = true // Initial game start is a break situation
                                showBreakSelection = false
                                showColorSelection = true
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
                                pendingBreakPlayer = breakP
                                isBreakSituation = true // Initial game start is a break situation
                                showBreakSelection = false
                                showColorSelection = true
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
        
        // Color selection dialog
        if (showColorSelection && pendingBreakPlayer != null) {
            val normP1 = normalizeName(playerOneName.ifBlank { "Player 1" })
            val normP2 = normalizeName(playerTwoName.ifBlank { "Player 2" })
            val breakPlayerName = if (pendingBreakPlayer == normP1) {
                formatNameForDisplay(playerOneName.ifBlank { "Player 1" })
            } else {
                formatNameForDisplay(playerTwoName.ifBlank { "Player 2" })
            }
            
            AlertDialog(
                onDismissRequest = { 
                    showColorSelection = false
                    pendingBreakPlayer = null
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
                                        selectedColor = BallColor.RED
                                        showColorSelection = false
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
                                        selectedColor = BallColor.YELLOW
                                        showColorSelection = false
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
                                // Foul break button - only show if it's a break situation
                                if (isBreakSituation) {
                                    Button(
                                        onClick = {
                                            selectedColor = BallColor.FOUL_BREAK
                                            showColorSelection = false
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
                                        val normP1 = normalizeName(playerOneName.ifBlank { "Player 1" })
                                        val normP2 = normalizeName(playerTwoName.ifBlank { "Player 2" })
                                        pendingBreakPlayer = if (pendingBreakPlayer == normP1) {
                                            normP2
                                        } else {
                                            normP1
                                        }
                                        isBreakSituation = false // No longer a break situation after open table
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
                                    selectedColor = BallColor.RED
                                    showColorSelection = false
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
                                    selectedColor = BallColor.YELLOW
                                    showColorSelection = false
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
                            
                            // Foul break button - only show if it's a break situation
                            if (isBreakSituation) {
                                Button(
                                    onClick = {
                                        selectedColor = BallColor.FOUL_BREAK
                                        showColorSelection = false
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
                                    val normP1 = normalizeName(playerOneName.ifBlank { "Player 1" })
                                    val normP2 = normalizeName(playerTwoName.ifBlank { "Player 2" })
                                    pendingBreakPlayer = if (pendingBreakPlayer == normP1) {
                                        normP2
                                    } else {
                                        normP1
                                    }
                                    isBreakSituation = false // No longer a break situation after open table
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
                        }
                    ) {
                        Text("Cancel")
                    }
                }
            )
        }
    }
}

