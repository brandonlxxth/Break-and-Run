package com.brandonlxxth.breakandrun.data

import java.util.Date

enum class GameMode(val displayName: String) {
    RACE_TO("Race to"),
    FIRST_TO("Sets of"),
    BEST_OF("Best of")
}

enum class DishType(val displayName: String) {
    BREAK_DISH("Break Dish"),
    REVERSE_DISH("Reverse Dish")
}

data class Frame(
    val timestamp: Date,
    val player: String,
    val scoreChange: Int,
    val playerOneScore: Int,
    val playerTwoScore: Int,
    val dishType: DishType? = null
)

data class Set(
    val setNumber: Int,
    val playerOneScore: Int,
    val playerTwoScore: Int,
    val winner: String?,
    val frames: List<Frame>
)

data class Game(
    val id: String = java.util.UUID.randomUUID().toString(),
    val playerOneName: String = "Player 1",
    val playerTwoName: String = "Player 2",
    val playerOneScore: Int,
    val playerTwoScore: Int,
    val targetScore: Int,
    val gameMode: GameMode = GameMode.RACE_TO,
    val winner: String?,
    val date: Date = Date(),
    val startTime: Date = Date(),
    val endTime: Date = Date(),
    val frameHistory: List<Frame> = emptyList(),
    // For "Sets of" mode: track sets won
    val playerOneSetsWon: Int = 0,
    val playerTwoSetsWon: Int = 0,
    val sets: List<Set> = emptyList(),
    // Track whose break it was (normalized name)
    val breakPlayer: String? = null
)

