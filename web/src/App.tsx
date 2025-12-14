import { useState, useEffect, useRef, useCallback } from 'react';
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
import Footer from './components/Footer';
import { unifiedGameRepository } from './services/UnifiedGameRepository';
import { ActiveGame, Game, GameMode, BallColor } from './data/types';
import { normalizeName } from './utils/nameUtils';
import { Box, CircularProgress } from '@mui/material';

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
  const [newGameData, setNewGameData] = useState<NewGameData | null>(null);

  // Configure repository based on auth state
  useEffect(() => {
    unifiedGameRepository.setUseApi(!!user);
    
    // Clear games when user signs out
    if (!user) {
      setActiveGame(null);
      setPastGames([]);
    }
  }, [user]);

  // Load games when auth state changes (only if user is signed in)
  useEffect(() => {
    const loadGames = async () => {
      setGamesLoading(true);
      try {
        if (user) {
          // Only load games if user is signed in
          const [active, past] = await Promise.all([
            unifiedGameRepository.getActiveGame(),
            unifiedGameRepository.getPastGames(),
          ]);
          setActiveGame(active);
          setPastGames(past);
        } else {
          // Clear games when not signed in
          setActiveGame(null);
          setPastGames([]);
        }
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
    // Store game data in state - no sessionStorage needed
    const gameData: NewGameData = {
      playerOne,
      playerTwo,
      gameMode,
      targetScore,
      breakPlayer,
      p1Color,
      p2Color,
    };
    setNewGameData(gameData);
    navigate('/scoreboard');
  };

  const handleActiveGameUpdate = useCallback(async (updatedGame: ActiveGame) => {
    // Update state and save to database - this is called when a frame is added
    setActiveGame(updatedGame);
    await unifiedGameRepository.saveActiveGame(updatedGame);
  }, []);

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
        element={<ScoreboardRoute newGameData={newGameData} pastGames={pastGames} onActiveGameUpdate={handleActiveGameUpdate} onGameEnd={handleGameEnd} onBackClick={handleBackFromScoreboard} onGameDataCleared={() => setNewGameData(null)} />}
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
  newGameData,
  pastGames,
  onActiveGameUpdate,
  onGameEnd,
  onBackClick,
  onGameDataCleared,
}: {
  newGameData: NewGameData | null;
  pastGames: Game[];
  onActiveGameUpdate: (game: ActiveGame) => void;
  onGameEnd: (game: Game) => void;
  onBackClick: (game: ActiveGame | null) => void;
  onGameDataCleared: () => void;
}) {
  const navigate = useNavigate();
  // Store game data in ref so it persists after clearing from state
  const gameDataRef = useRef<NewGameData | null>(null);
  const hasClearedRef = useRef(false);
  
  // Store game data in ref on mount, clear from parent state
  useEffect(() => {
    if (newGameData && !gameDataRef.current) {
      gameDataRef.current = newGameData;
      // Clear from parent state (only once)
      if (!hasClearedRef.current) {
        onGameDataCleared();
        hasClearedRef.current = true;
      }
    }
  }, [newGameData, onGameDataCleared]);
  
  useEffect(() => {
    // If no game data, redirect to home
    if (!gameDataRef.current) {
      navigate('/');
    }
  }, [navigate]);

  if (!gameDataRef.current) {
    return null; // Will redirect
  }

  const gameData = gameDataRef.current;

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
  
  useEffect(() => {
    // If no active game, redirect to home
    if (!activeGame) {
      navigate('/');
    }
  }, [activeGame, navigate]);

  if (!activeGame) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
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
          <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Box sx={{ flex: 1 }}>
              <AppRoutes />
            </Box>
            <Footer />
          </Box>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
