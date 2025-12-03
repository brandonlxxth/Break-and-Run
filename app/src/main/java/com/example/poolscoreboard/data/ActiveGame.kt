package com.brandonlxxth.breakandrun.data

import java.util.Date

data class ActiveGame(
    val id: String = java.util.UUID.randomUUID().toString(),
    val playerOneName: String,
    val playerTwoName: String,
    val playerOneScore: Int,
    val playerTwoScore: Int,
    val playerOneGamesWon: Int,
    val playerTwoGamesWon: Int,
    val targetScore: Int,
    val gameMode: GameMode,
    val startTime: Date,
    val frameHistory: List<Frame>,
    // For "Sets of" mode: track sets won
    val playerOneSetsWon: Int = 0,
    val playerTwoSetsWon: Int = 0,
    val completedSets: List<Set> = emptyList(),
    // Track whose break it is (normalized name)
    val breakPlayer: String? = null,
    // Ball colors assigned to players
    val playerOneColor: BallColor? = null,
    val playerTwoColor: BallColor? = null
)

