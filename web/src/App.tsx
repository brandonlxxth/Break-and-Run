import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme/theme';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import HomeScreen from './components/HomeScreen';
import GameScreen from './components/GameScreen';
import ScoreboardScreen from './components/ScoreboardScreen';
import PastGamesScreen from './components/PastGamesScreen';
import LoginScreen from './components/LoginScreen';
import { unifiedGameRepository } from './services/UnifiedGameRepository';
import { ActiveGame, Game, GameMode, BallColor } from './data/types';
import { normalizeName } from './utils/nameUtils';
import { Box, CircularProgress } from '@mui/material';

// Store game data in sessionStorage temporarily for navigation
const SESSION_STORAGE_KEY = 'breakandrun_newgame';

interface NewGameData {
  playerOne: string;
  playerTwo: string;
  gameMode: GameMode;
  targetScore: number;
  breakPlayer: string;
  p1Color: BallColor | null;
  p2Color: BallColor | null;
}

function AppRoutes() {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);
  const [pastGames, setPastGames] = useState<Game[]>([]);
  const [gamesLoading, setGamesLoading] = useState(true);

  // Configure repository based on auth state
  useEffect(() => {
    unifiedGameRepository.setUseApi(!!user);
  }, [user]);

  // Load games when auth state changes
  useEffect(() => {
    const loadGames = async () => {
      setGamesLoading(true);
      try {
        const [active, past] = await Promise.all([
          unifiedGameRepository.getActiveGame(),
          unifiedGameRepository.getPastGames(),
        ]);
        setActiveGame(active);
        setPastGames(past);
      } catch (error) {
        console.error('Error loading games:', error);
      } finally {
        setGamesLoading(false);
      }
    };

    if (!loading) {
      loadGames();
    }
  }, [user, loading]);

  const handleCreateGame = (
    playerOne: string,
    playerTwo: string,
    gameMode: GameMode,
    targetScore: number,
    breakPlayer: string,
    p1Color: BallColor | null,
    p2Color: BallColor | null
  ) => {
    // Store game data in sessionStorage temporarily
    const gameData: NewGameData = {
      playerOne,
      playerTwo,
      gameMode,
      targetScore,
      breakPlayer,
      p1Color,
      p2Color,
    };
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(gameData));
    navigate('/scoreboard');
  };

  const handleActiveGameUpdate = async (updatedGame: ActiveGame) => {
    setActiveGame(updatedGame);
    try {
      await unifiedGameRepository.saveActiveGame(updatedGame);
    } catch (error) {
      // Error is already handled in UnifiedGameRepository with fallback
      // Just log it here for debugging
      console.error('Error saving active game:', error);
    }
  };

  const handleGameEnd = async (game: Game) => {
    await unifiedGameRepository.addGame(game);
    setPastGames([...pastGames, game]);
    setActiveGame(null);
    await unifiedGameRepository.saveActiveGame(null);
    navigate('/');
  };

  const handleBackFromScoreboard = async (savedGame: ActiveGame | null) => {
    setActiveGame(savedGame);
    await unifiedGameRepository.saveActiveGame(savedGame);
    navigate('/');
  };

  const handleCancelActiveGame = async () => {
    setActiveGame(null);
    await unifiedGameRepository.saveActiveGame(null);
  };

  // Show loading spinner while checking auth or loading games
  if (loading || gamesLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Routes>
      <Route
        path="/login"
        element={<LoginScreen />}
      />
      <Route
        path="/"
        element={
          <HomeScreen
            activeGame={activeGame}
            user={user}
            onNewGameClick={() => navigate('/new-game')}
            onResumeGameClick={() => {
              if (activeGame) {
                // Store game ID in sessionStorage temporarily
                sessionStorage.setItem('breakandrun_resume', activeGame.id);
                navigate('/resume');
              }
            }}
            onPastGamesClick={() => navigate('/past-games')}
            onCancelActiveGame={handleCancelActiveGame}
            onLoginClick={() => navigate('/login')}
          />
        }
      />
      <Route
        path="/new-game"
        element={
          <GameScreen
            onBackClick={() => navigate('/')}
            onCreateGame={handleCreateGame}
          />
        }
      />
      <Route
        path="/scoreboard"
        element={<ScoreboardRoute pastGames={pastGames} onActiveGameUpdate={handleActiveGameUpdate} onGameEnd={handleGameEnd} onBackClick={handleBackFromScoreboard} />}
      />
      <Route
        path="/resume"
        element={
          <ResumeGameRoute
            activeGame={activeGame}
            pastGames={pastGames}
            onActiveGameUpdate={handleActiveGameUpdate}
            onGameEnd={handleGameEnd}
            onBackClick={handleBackFromScoreboard}
          />
        }
      />
      <Route
        path="/past-games"
        element={
          <PastGamesScreen
            games={[...pastGames].sort((a, b) => b.date.getTime() - a.date.getTime())}
            onBackClick={() => navigate('/')}
            onDeleteGame={async (gameId) => {
              await unifiedGameRepository.deleteGame(gameId);
              const updatedGames = await unifiedGameRepository.getPastGames();
              setPastGames(updatedGames);
            }}
          />
        }
      />
    </Routes>
  );
}

function ScoreboardRoute({
  pastGames,
  onActiveGameUpdate,
  onGameEnd,
  onBackClick,
}: {
  pastGames: Game[];
  onActiveGameUpdate: (game: ActiveGame) => void;
  onGameEnd: (game: Game) => void;
  onBackClick: (game: ActiveGame | null) => void;
}) {
  const navigate = useNavigate();
  
  // Get game data from sessionStorage
  const gameDataStr = sessionStorage.getItem(SESSION_STORAGE_KEY);
  
  useEffect(() => {
    // If no game data, redirect to home
    if (!gameDataStr) {
      navigate('/');
    } else {
      // Clear sessionStorage after reading (only once on mount)
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  }, [gameDataStr, navigate]);

  if (!gameDataStr) {
    return null; // Will redirect
  }

  const gameData: NewGameData = JSON.parse(gameDataStr);

  return (
    <ScoreboardScreen
      playerOneName={normalizeName(gameData.playerOne)}
      playerTwoName={normalizeName(gameData.playerTwo)}
      gameMode={gameData.gameMode}
      targetScore={gameData.targetScore}
      breakPlayer={gameData.breakPlayer ? normalizeName(gameData.breakPlayer) : null}
      playerOneColor={gameData.p1Color}
      playerTwoColor={gameData.p2Color}
      activeGame={null}
      pastGames={pastGames}
      onBackClick={onBackClick}
      onGameEnd={onGameEnd}
      onActiveGameUpdate={onActiveGameUpdate}
    />
  );
}

function ResumeGameRoute({
  activeGame,
  pastGames,
  onActiveGameUpdate,
  onGameEnd,
  onBackClick,
}: {
  activeGame: ActiveGame | null;
  pastGames: Game[];
  onActiveGameUpdate: (game: ActiveGame) => void;
  onGameEnd: (game: Game) => void;
  onBackClick: (game: ActiveGame | null) => void;
}) {
  const navigate = useNavigate();
  
  // Get game ID from sessionStorage
  const gameId = sessionStorage.getItem('breakandrun_resume');
  
  useEffect(() => {
    // If no game ID or game not found, redirect to home
    if (!gameId || !activeGame || activeGame.id !== gameId) {
      sessionStorage.removeItem('breakandrun_resume');
      navigate('/');
    }
  }, [gameId, activeGame, navigate]);

  // Clear sessionStorage after reading
  useEffect(() => {
    if (gameId) {
      sessionStorage.removeItem('breakandrun_resume');
    }
  }, [gameId]);

  if (!gameId || !activeGame || activeGame.id !== gameId) {
    return null; // Will redirect
  }

  return (
    <ScoreboardScreen
      playerOneName={activeGame.playerOneName}
      playerTwoName={activeGame.playerTwoName}
      gameMode={activeGame.gameMode}
      targetScore={activeGame.targetScore}
      breakPlayer={activeGame.breakPlayer}
      playerOneColor={activeGame.playerOneColor}
      playerTwoColor={activeGame.playerTwoColor}
      activeGame={activeGame}
      pastGames={pastGames}
      onBackClick={onBackClick}
      onGameEnd={onGameEnd}
      onActiveGameUpdate={onActiveGameUpdate}
    />
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
