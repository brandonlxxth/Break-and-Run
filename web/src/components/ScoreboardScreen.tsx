import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import RemoveIcon from '@mui/icons-material/Remove';
import StarIcon from '@mui/icons-material/Star';
import { ActiveGame, Game, GameMode, GameModeDisplayNames, DishType, BallColor, Frame } from '../data/types';
import { normalizeName, formatNameForDisplay } from '../utils/nameUtils';

interface ScoreboardScreenProps {
  playerOneName: string;
  playerTwoName: string;
  gameMode: GameMode;
  targetScore: number;
  breakPlayer: string | null;
  playerOneColor: BallColor | null;
  playerTwoColor: BallColor | null;
  activeGame: ActiveGame | null;
  pastGames: Game[];
  onBackClick: (savedActiveGame: ActiveGame | null) => void;
  onGameEnd: (game: Game) => void;
  onActiveGameUpdate: (activeGame: ActiveGame) => void;
}

export default function ScoreboardScreen({
  playerOneName,
  playerTwoName,
  gameMode,
  targetScore,
  breakPlayer: initialBreakPlayer,
  playerOneColor: initialP1Color,
  playerTwoColor: initialP2Color,
  activeGame,
  pastGames,
  onBackClick,
  onGameEnd,
  onActiveGameUpdate,
}: ScoreboardScreenProps) {
  const normalizedP1 = normalizeName(playerOneName);
  const normalizedP2 = normalizeName(playerTwoName);
  const displayP1 = formatNameForDisplay(playerOneName);
  const displayP2 = formatNameForDisplay(playerTwoName);

  // Calculate aggregate statistics for this player pair
  const [aggregateStats, setAggregateStats] = useState<{ p1Wins: number; p2Wins: number; draws: number } | null>(null);

  useEffect(() => {
    if (pastGames.length === 0 || !normalizedP1 || !normalizedP2) {
      setAggregateStats(null);
      return;
    }

    try {
      // Find all games between these two players (in either order)
      const matchingGames = pastGames.filter((game) => {
        try {
          const gameP1Normalized = normalizeName(game.playerOneName);
          const gameP2Normalized = normalizeName(game.playerTwoName);
          return (
            (gameP1Normalized === normalizedP1 && gameP2Normalized === normalizedP2) ||
            (gameP1Normalized === normalizedP2 && gameP2Normalized === normalizedP1)
          );
        } catch (e) {
          return false;
        }
      });

      if (matchingGames.length === 0) {
        setAggregateStats(null);
        return;
      }

      let p1Wins = 0;
      let p2Wins = 0;
      let draws = 0;

      matchingGames.forEach((game) => {
        try {
          const gameP1Normalized = normalizeName(game.playerOneName);
          const gameP2Normalized = normalizeName(game.playerTwoName);
          const isP1First = gameP1Normalized === normalizedP1;
          const winnerNormalized = game.winner ? normalizeName(game.winner) : null;

          if (winnerNormalized === null) {
            draws++;
          } else if (isP1First && winnerNormalized === normalizedP1) {
            p1Wins++;
          } else if (isP1First && winnerNormalized === normalizedP2) {
            p2Wins++;
          } else if (!isP1First && winnerNormalized === gameP1Normalized) {
            // Past game has players swapped: gameP1Normalized == normalizedP2
            // Winner is past game's player 1, which is current game's player 2
            p2Wins++;
          } else if (!isP1First && winnerNormalized === gameP2Normalized) {
            // Past game has players swapped: gameP2Normalized == normalizedP1
            // Winner is past game's player 2, which is current game's player 1
            p1Wins++;
          }
        } catch (e) {
          // Skip games with errors
          console.error('Error processing game for aggregate stats:', e);
        }
      });

      setAggregateStats({ p1Wins, p2Wins, draws });
    } catch (e) {
      console.error('Error calculating aggregate stats:', e);
      setAggregateStats(null);
    }
  }, [pastGames, normalizedP1, normalizedP2]);

  const [startTime] = useState(activeGame?.startTime || new Date());
  const [currentBreakPlayer, setCurrentBreakPlayer] = useState<string | null>(
    activeGame?.breakPlayer || initialBreakPlayer || normalizedP1
  );
  const [playerOneScore, setPlayerOneScore] = useState(activeGame?.playerOneScore || 0);
  const [playerTwoScore, setPlayerTwoScore] = useState(activeGame?.playerTwoScore || 0);
  const [playerOneGamesWon, setPlayerOneGamesWon] = useState(activeGame?.playerOneGamesWon || 0);
  const [playerTwoGamesWon, setPlayerTwoGamesWon] = useState(activeGame?.playerTwoGamesWon || 0);
  const [playerOneSetsWon, setPlayerOneSetsWon] = useState(activeGame?.playerOneSetsWon || 0);
  const [playerTwoSetsWon, setPlayerTwoSetsWon] = useState(activeGame?.playerTwoSetsWon || 0);
  const [frameHistory, setFrameHistory] = useState<Frame[]>(activeGame?.frameHistory || []);
  const [currentSetFrames, setCurrentSetFrames] = useState<Frame[]>([]);
  const [completedSets, setCompletedSets] = useState(activeGame?.completedSets || []);
  const [currentGameEnded, setCurrentGameEnded] = useState(false);
  const [showEndGameDialog, setShowEndGameDialog] = useState(false);

  // Calculate win conditions
  const calculateWinConditions = () => {
    switch (gameMode) {
      case GameMode.RACE_TO:
        return {
          p1Won: playerOneScore >= targetScore,
          p2Won: playerTwoScore >= targetScore,
          gameEnded: playerOneScore >= targetScore || playerTwoScore >= targetScore,
          setEnded: false,
        };
      case GameMode.FIRST_TO:
        const p1WonSet = playerOneScore >= targetScore;
        const p2WonSet = playerTwoScore >= targetScore;
        return {
          p1Won: playerOneSetsWon >= targetScore,
          p2Won: playerTwoSetsWon >= targetScore,
          gameEnded: playerOneSetsWon >= targetScore || playerTwoSetsWon >= targetScore,
          setEnded: p1WonSet || p2WonSet,
        };
      case GameMode.BEST_OF:
        const totalGames = playerOneGamesWon + playerTwoGamesWon;
        const majority = Math.floor(targetScore / 2) + 1;
        return {
          p1Won: playerOneGamesWon >= majority || (totalGames >= targetScore && playerOneGamesWon > playerTwoGamesWon),
          p2Won: playerTwoGamesWon >= majority || (totalGames >= targetScore && playerTwoGamesWon > playerOneGamesWon),
          gameEnded: totalGames >= targetScore,
          setEnded: currentGameEnded,
        };
      case GameMode.FREE_PLAY:
        return { p1Won: false, p2Won: false, gameEnded: false, setEnded: false };
    }
  };

  const winConditions = calculateWinConditions();
  const { p1Won, p2Won, gameEnded, setEnded } = winConditions;

  // Auto-save active game
  useEffect(() => {
    if (frameHistory.length > 0 || playerOneScore > 0 || playerTwoScore > 0) {
      const activeGameState: ActiveGame = {
        id: activeGame?.id || crypto.randomUUID(),
        playerOneName: normalizedP1,
        playerTwoName: normalizedP2,
        playerOneScore,
        playerTwoScore,
        playerOneGamesWon,
        playerTwoGamesWon,
        targetScore,
        gameMode,
        startTime,
        frameHistory,
        playerOneSetsWon,
        playerTwoSetsWon,
        completedSets,
        breakPlayer: currentBreakPlayer,
        playerOneColor: initialP1Color,
        playerTwoColor: initialP2Color,
      };
      onActiveGameUpdate(activeGameState);
    }
  }, [
    playerOneScore,
    playerTwoScore,
    playerOneGamesWon,
    playerTwoGamesWon,
    playerOneSetsWon,
    playerTwoSetsWon,
    frameHistory,
    completedSets,
  ]);

  // Handle new set button click for FIRST_TO mode
  const handleNewSet = () => {
    if (gameMode !== GameMode.FIRST_TO || !setEnded) return;

    // Determine set winner
    let setWinner: string | null = null;
    if (playerOneScore >= targetScore) {
      setWinner = normalizedP1;
    } else if (playerTwoScore >= targetScore) {
      setWinner = normalizedP2;
    } else if (playerOneScore > playerTwoScore) {
      setWinner = normalizedP1;
    } else if (playerTwoScore > playerOneScore) {
      setWinner = normalizedP2;
    }

    // Save completed set
    const newSet = {
      setNumber: completedSets.length + 1,
      playerOneScore,
      playerTwoScore,
      winner: setWinner,
      frames: [...currentSetFrames],
    };
    setCompletedSets([...completedSets, newSet]);

    // Increment sets won for the winner
    if (setWinner === normalizedP1) {
      setPlayerOneSetsWon(playerOneSetsWon + 1);
    } else if (setWinner === normalizedP2) {
      setPlayerTwoSetsWon(playerTwoSetsWon + 1);
    }

    // Reset scores for new set
    setPlayerOneScore(0);
    setPlayerTwoScore(0);
    setCurrentSetFrames([]);

    // Calculate who breaks next - alternate based on completed frames
    if (currentBreakPlayer) {
      // Switch to the other player for the next set
      setCurrentBreakPlayer(currentBreakPlayer === normalizedP1 ? normalizedP2 : normalizedP1);
    }
  };

  // Handle game completion for BEST_OF mode
  useEffect(() => {
    if (gameMode === GameMode.BEST_OF && currentGameEnded && !gameEnded) {
      const winner = playerOneScore > playerTwoScore ? normalizedP1 : normalizedP2;
      if (winner === normalizedP1) {
        setPlayerOneGamesWon(playerOneGamesWon + 1);
      } else {
        setPlayerTwoGamesWon(playerTwoGamesWon + 1);
      }
      setPlayerOneScore(0);
      setPlayerTwoScore(0);
      setCurrentGameEnded(false);
    }
  }, [currentGameEnded]);

  const addFrame = (player: string, scoreChange: number, newP1Score: number, newP2Score: number, dishType?: DishType) => {
    const newFrame: Frame = {
      timestamp: new Date(),
      player,
      scoreChange,
      playerOneScore: newP1Score,
      playerTwoScore: newP2Score,
      dishType,
    };
    setFrameHistory([...frameHistory, newFrame]);
    if (gameMode === GameMode.FIRST_TO) {
      setCurrentSetFrames([...currentSetFrames, newFrame]);
    }
    // Switch break player
    setCurrentBreakPlayer(currentBreakPlayer === normalizedP1 ? normalizedP2 : normalizedP1);
  };

  const handleIncrement = (player: 'p1' | 'p2') => {
    if (gameEnded || setEnded || currentGameEnded) return;

    if (player === 'p1') {
      const newP1Score = playerOneScore + 1;
      setPlayerOneScore(newP1Score);
      addFrame(normalizedP1, 1, newP1Score, playerTwoScore);
      if (gameMode === GameMode.BEST_OF) {
        const newFrameCount = newP1Score + playerTwoScore;
        if (newFrameCount >= targetScore) {
          setCurrentGameEnded(true);
        }
      }
    } else {
      const newP2Score = playerTwoScore + 1;
      setPlayerTwoScore(newP2Score);
      addFrame(normalizedP2, 1, playerOneScore, newP2Score);
      if (gameMode === GameMode.BEST_OF) {
        const newFrameCount = playerOneScore + newP2Score;
        if (newFrameCount >= targetScore) {
          setCurrentGameEnded(true);
        }
      }
    }
  };

  const handleDecrement = (player: 'p1' | 'p2') => {
    if (player === 'p1' && playerOneScore > 0) {
      setPlayerOneScore(playerOneScore - 1);
      setFrameHistory(frameHistory.slice(0, -1));
      if (gameMode === GameMode.FIRST_TO && currentSetFrames.length > 0) {
        setCurrentSetFrames(currentSetFrames.slice(0, -1));
      }
      setCurrentBreakPlayer(currentBreakPlayer === normalizedP1 ? normalizedP2 : normalizedP1);
    } else if (player === 'p2' && playerTwoScore > 0) {
      setPlayerTwoScore(playerTwoScore - 1);
      setFrameHistory(frameHistory.slice(0, -1));
      if (gameMode === GameMode.FIRST_TO && currentSetFrames.length > 0) {
        setCurrentSetFrames(currentSetFrames.slice(0, -1));
      }
      setCurrentBreakPlayer(currentBreakPlayer === normalizedP1 ? normalizedP2 : normalizedP1);
    }
  };

  const handleDish = (player: 'p1' | 'p2') => {
    if (gameEnded || setEnded || currentGameEnded) return;

    const currentBreak = currentBreakPlayer || normalizedP1;
    const dishType =
      (player === 'p1' && currentBreak === normalizedP1) ||
      (player === 'p2' && currentBreak === normalizedP2)
        ? DishType.BREAK_DISH
        : DishType.REVERSE_DISH;

    if (player === 'p1') {
      const newP1Score = playerOneScore + 1;
      setPlayerOneScore(newP1Score);
      addFrame(normalizedP1, 1, newP1Score, playerTwoScore, dishType);
    } else {
      const newP2Score = playerTwoScore + 1;
      setPlayerTwoScore(newP2Score);
      addFrame(normalizedP2, 1, playerOneScore, newP2Score, dishType);
    }
  };

  const handleEndGame = () => {
    // Check if score is 0-0 (no frames played)
    // For "Best of" mode, check games won; for "Sets of", check sets won; otherwise check scores
    let checkP1Score = playerOneScore;
    let checkP2Score = playerTwoScore;
    
    if (gameMode === GameMode.BEST_OF) {
      // For Best of, check if any frames were played
      if (frameHistory.length === 0) {
        // No frames played, just clear active game and go back
        onBackClick(null);
        return;
      }
      // Use games won for Best of mode
      checkP1Score = playerOneGamesWon;
      checkP2Score = playerTwoGamesWon;
    } else if (gameMode === GameMode.FIRST_TO) {
      // For Sets of, check sets won
      checkP1Score = playerOneSetsWon;
      checkP2Score = playerTwoSetsWon;
    }
    
    // Only skip if score is 0-0 and no frames played
    if (checkP1Score === 0 && checkP2Score === 0 && frameHistory.length === 0) {
      // Score is 0-0 with no frames, don't save - just navigate back
      onBackClick(null);
      return;
    }
    
    // For FIRST_TO mode, if there's an incomplete set, complete it with current scores
    let finalCompletedSets = [...completedSets];
    let finalPlayerOneSetsWon = playerOneSetsWon;
    let finalPlayerTwoSetsWon = playerTwoSetsWon;
    
    // Check if there's an incomplete set: 
    // - We're in FIRST_TO mode
    // - There are frames in the current set (currentSetFrames.length > 0)
    // This means a set has started but may not have been saved yet (even if setEnded is true, 
    // the set isn't saved until "New Set" is clicked)
    const hasIncompleteSet = gameMode === GameMode.FIRST_TO && currentSetFrames.length > 0;
    
    if (hasIncompleteSet) {
      // Determine set winner based on current scores
      let setWinner: string | null = null;
      if (playerOneScore > playerTwoScore) {
        setWinner = normalizedP1;
        finalPlayerOneSetsWon = playerOneSetsWon + 1;
      } else if (playerTwoScore > playerOneScore) {
        setWinner = normalizedP2;
        finalPlayerTwoSetsWon = playerTwoSetsWon + 1;
      } else {
        setWinner = null; // Tie
      }
      
      // Add the incomplete set to completed sets
      const incompleteSet = {
        setNumber: completedSets.length + 1,
        playerOneScore,
        playerTwoScore,
        winner: setWinner,
        frames: [...currentSetFrames],
      };
      finalCompletedSets = [...completedSets, incompleteSet];
    }
    
    // Determine winner
    let winner: string | null = null;
    if (gameEnded) {
      // Game reached target score - winner already determined
      winner = p1Won ? normalizedP1 : p2Won ? normalizedP2 : null;
    } else {
      // Game ended early - determine winner by highest score
      if (gameMode === GameMode.BEST_OF) {
        // For Best of, use games won
        if (playerOneGamesWon > playerTwoGamesWon) {
          winner = normalizedP1;
        } else if (playerTwoGamesWon > playerOneGamesWon) {
          winner = normalizedP2;
        } else {
          winner = null; // Tie
        }
      } else if (gameMode === GameMode.FIRST_TO) {
        // For Sets of, count sets won from the final sets array
        const finalP1SetsWon = finalCompletedSets.filter(s => s.winner === normalizedP1).length;
        const finalP2SetsWon = finalCompletedSets.filter(s => s.winner === normalizedP2).length;
        if (finalP1SetsWon > finalP2SetsWon) {
          winner = normalizedP1;
        } else if (finalP2SetsWon > finalP1SetsWon) {
          winner = normalizedP2;
        } else {
          winner = null; // Tie
        }
      } else {
        // For Race to and Free Play, use current scores
        if (playerOneScore > playerTwoScore) {
          winner = normalizedP1;
        } else if (playerTwoScore > playerOneScore) {
          winner = normalizedP2;
        } else {
          winner = null; // Tie
        }
      }
    }
    const game: Game = {
      id: crypto.randomUUID(),
      playerOneName: normalizedP1,
      playerTwoName: normalizedP2,
      playerOneScore,
      playerTwoScore,
      targetScore,
      gameMode,
      winner,
      date: new Date(),
      startTime,
      endTime: new Date(),
      frameHistory,
      playerOneSetsWon: finalPlayerOneSetsWon,
      playerTwoSetsWon: finalPlayerTwoSetsWon,
      sets: finalCompletedSets,
      breakPlayer: currentBreakPlayer,
    };
    onGameEnd(game);
  };

  const PlayerCard = ({
    playerName,
    displayName,
    score,
    isPlayerOne,
    gamesWon,
    setsWon,
  }: {
    playerName: string;
    displayName: string;
    score: number;
    isPlayerOne: boolean;
    gamesWon?: number;
    setsWon?: number;
  }) => {
    const isBreaking = currentBreakPlayer === playerName;
    const isWinner = (isPlayerOne && p1Won) || (!isPlayerOne && p2Won);
    
    // Determine text color based on background
    const getTextColor = () => {
      if (isWinner) {
        // Success/winner background (light green) - use dark text
        return '#000000';
      } else if (isBreaking) {
        // Primary/breaking background (light blue) - use dark text
        return '#000000';
      } else {
        // Normal background (dark paper) - use light text
        return 'text.primary';
      }
    };
    
    const getSecondaryTextColor = () => {
      if (isWinner || isBreaking) {
        return 'rgba(0, 0, 0, 0.7)';
      } else {
        return 'text.secondary';
      }
    };

    return (
      <Card
        sx={{
          flex: 1,
          bgcolor: isWinner ? 'success.light' : isBreaking ? 'primary.light' : 'background.paper',
          border: isBreaking ? 2 : 0,
          borderColor: 'primary.main',
        }}
      >
        <CardContent sx={{ textAlign: 'center', py: 3 }}>
          <Typography 
            variant="h6" 
            fontWeight="bold" 
            gutterBottom
            sx={{ color: getTextColor() }}
          >
            {displayName}
          </Typography>
          {gameMode === GameMode.BEST_OF && gamesWon !== undefined && (
            <Typography 
              variant="body2" 
              sx={{ color: getSecondaryTextColor() }}
            >
              Games: {gamesWon}
            </Typography>
          )}
          {gameMode === GameMode.FIRST_TO && setsWon !== undefined && (
            <Typography 
              variant="body2" 
              sx={{ color: getSecondaryTextColor() }}
            >
              Sets: {setsWon}
            </Typography>
          )}
          <Typography 
            variant="h2" 
            fontWeight="bold" 
            sx={{ my: 2, color: getTextColor() }}
          >
            {score}
          </Typography>
          {/* Fixed height container for chips to prevent button movement */}
          <Box sx={{ minHeight: 40, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5, mb: 1 }}>
            {isBreaking && (
              <Chip label="Breaking" size="small" color="primary" />
            )}
            {isWinner && (
              <Chip label="Winner!" size="small" color="success" />
            )}
          </Box>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center', mt: 2 }}>
            <IconButton
              onClick={() => handleDecrement(isPlayerOne ? 'p1' : 'p2')}
              disabled={score === 0 || gameEnded}
              color="error"
            >
              <RemoveIcon />
            </IconButton>
            <Button
              variant="contained"
              onClick={() => handleIncrement(isPlayerOne ? 'p1' : 'p2')}
              disabled={gameEnded || setEnded || currentGameEnded}
              sx={{ minWidth: 100 }}
            >
              +1
            </Button>
            <Button
              variant="contained"
              onClick={() => handleDish(isPlayerOne ? 'p1' : 'p2')}
              disabled={gameEnded || setEnded || currentGameEnded}
              sx={{
                minWidth: 100,
                background: 'linear-gradient(135deg, #9c27b0 0%, #ba68c8 50%, #ce93d8 100%)',
                color: '#ffffff',
                fontWeight: 'bold',
                fontSize: '1rem',
                boxShadow: '0 4px 15px rgba(156, 39, 176, 0.4)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                position: 'relative',
                overflow: 'hidden',
                '&:hover': {
                  background: 'linear-gradient(135deg, #8e24aa 0%, #ab47bc 50%, #ba68c8 100%)',
                  boxShadow: '0 6px 20px rgba(156, 39, 176, 0.6)',
                  transform: 'translateY(-2px)',
                },
                '&:active': {
                  transform: 'translateY(0)',
                },
                '&:disabled': {
                  background: 'rgba(156, 39, 176, 0.3)',
                  boxShadow: 'none',
                },
                '&::before': {
                  content: '""',
                  position: 'absolute',
                  top: 0,
                  left: '-100%',
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
                  transition: 'left 0.5s',
                },
                '&:hover::before': {
                  left: '100%',
                },
              }}
              startIcon={<StarIcon sx={{ fontSize: '1.2rem' }} />}
            >
              Dish
            </Button>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: 2,
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <IconButton
          onClick={() => {
            const savedGame: ActiveGame = {
              id: activeGame?.id || crypto.randomUUID(),
              playerOneName: normalizedP1,
              playerTwoName: normalizedP2,
              playerOneScore,
              playerTwoScore,
              playerOneGamesWon,
              playerTwoGamesWon,
              targetScore,
              gameMode,
              startTime,
              frameHistory,
              playerOneSetsWon,
              playerTwoSetsWon,
              completedSets,
              breakPlayer: currentBreakPlayer,
              playerOneColor: initialP1Color,
              playerTwoColor: initialP2Color,
            };
            onBackClick(savedGame);
          }}
          sx={{ color: 'inherit', mr: 1 }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6" fontWeight="bold" sx={{ color: 'primary.contrastText' }}>
            {gameMode === GameMode.FREE_PLAY
              ? GameModeDisplayNames[gameMode]
              : `${GameModeDisplayNames[gameMode]} ${targetScore}`}
          </Typography>
          {gameMode === GameMode.FIRST_TO && (
            <Typography variant="caption" sx={{ color: 'primary.contrastText', opacity: 0.9 }}>
              Sets: {playerOneSetsWon} - {playerTwoSetsWon}
            </Typography>
          )}
        </Box>
        <Button
          variant="contained"
          color="error"
          onClick={() => setShowEndGameDialog(true)}
          size="small"
        >
          End Match
        </Button>
      </Box>

      {/* Aggregate Stats Card */}
      {aggregateStats && (
        <Box sx={{ p: 2, pb: 0 }}>
          <Card
            sx={{
              bgcolor: 'background.paper',
              boxShadow: 4,
            }}
          >
            <CardContent>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                {/* Player 1 stats */}
                <Box sx={{ flex: 1, textAlign: 'left' }}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>
                    {displayP1}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: 'primary.main' }}>
                    {aggregateStats.p1Wins}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    wins
                  </Typography>
                </Box>

                {/* Center divider with total */}
                <Box sx={{ textAlign: 'center', px: 2 }}>
                  <Typography variant="h6" fontWeight="bold" sx={{ color: 'text.primary' }}>
                    {aggregateStats.p1Wins + aggregateStats.p2Wins + aggregateStats.draws}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    total
                  </Typography>
                  {aggregateStats.draws > 0 && (
                    <Typography variant="caption" sx={{ display: 'block', mt: 0.5, color: 'text.secondary' }}>
                      {aggregateStats.draws} draw{aggregateStats.draws > 1 ? 's' : ''}
                    </Typography>
                  )}
                </Box>

                {/* Player 2 stats */}
                <Box sx={{ flex: 1, textAlign: 'right' }}>
                  <Typography variant="body2" sx={{ mb: 0.5, color: 'text.secondary' }}>
                    {displayP2}
                  </Typography>
                  <Typography variant="h4" fontWeight="bold" sx={{ color: 'primary.main' }}>
                    {aggregateStats.p2Wins}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                    wins
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      )}

      <Box sx={{ p: 2, display: 'flex', gap: 2, flexDirection: { xs: 'column', md: 'row' } }}>
        <PlayerCard
          playerName={normalizedP1}
          displayName={displayP1}
          score={playerOneScore}
          isPlayerOne={true}
          gamesWon={playerOneGamesWon}
          setsWon={playerOneSetsWon}
        />
        <PlayerCard
          playerName={normalizedP2}
          displayName={displayP2}
          score={playerTwoScore}
          isPlayerOne={false}
          gamesWon={playerTwoGamesWon}
          setsWon={playerTwoSetsWon}
        />
      </Box>

      {/* New Set Button - Show when set ends in "Sets of" mode */}
      {setEnded && gameMode === GameMode.FIRST_TO && !gameEnded && (
        <Box sx={{ p: 2, pt: 0 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={handleNewSet}
            sx={{
              py: 1.5,
              fontSize: '1.125rem',
              fontWeight: 'semiBold',
            }}
          >
            New Set
          </Button>
        </Box>
      )}

      <Dialog open={showEndGameDialog} onClose={() => setShowEndGameDialog(false)}>
        <DialogTitle>End Match?</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to end this match?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowEndGameDialog(false)}>Cancel</Button>
          <Button onClick={handleEndGame} color="error" variant="contained">
            End Match
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

