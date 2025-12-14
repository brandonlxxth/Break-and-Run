import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { theme } from './theme/theme';
import HomeScreen from './components/HomeScreen';
import GameScreen from './components/GameScreen';
import ScoreboardScreen from './components/ScoreboardScreen';
import PastGamesScreen from './components/PastGamesScreen';
import { gameRepository } from './services/GameRepository';
import { ActiveGame, Game, GameMode, BallColor } from './data/types';
import { normalizeName } from './utils/nameUtils';

function AppRoutes() {
  const navigate = useNavigate();
  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);
  const [pastGames, setPastGames] = useState<Game[]>([]);

  useEffect(() => {
    // Load active game and past games on mount
    setActiveGame(gameRepository.getActiveGame());
    setPastGames(gameRepository.getPastGames());
  }, []);

  const handleCreateGame = (
    playerOne: string,
    playerTwo: string,
    gameMode: GameMode,
    targetScore: number,
    breakPlayer: string,
    p1Color: BallColor | null,
    p2Color: BallColor | null
  ) => {
    const encodedP1 = encodeURIComponent(playerOne);
    const encodedP2 = encodeURIComponent(playerTwo);
    const encodedBreak = encodeURIComponent(breakPlayer);
    const color1 = p1Color?.toString() || 'NONE';
    const color2 = p2Color?.toString() || 'NONE';
    navigate(
      `/scoreboard/${encodedP1}/${encodedP2}/${gameMode}/${targetScore}/${encodedBreak}/${color1}/${color2}`
    );
  };

  const handleActiveGameUpdate = (updatedGame: ActiveGame) => {
    setActiveGame(updatedGame);
    gameRepository.saveActiveGame(updatedGame);
  };

  const handleGameEnd = (game: Game) => {
    gameRepository.addGame(game);
    setPastGames([...pastGames, game]);
    setActiveGame(null);
    gameRepository.saveActiveGame(null);
    navigate('/');
  };

  const handleBackFromScoreboard = (savedGame: ActiveGame | null) => {
    setActiveGame(savedGame);
    if (savedGame) {
      gameRepository.saveActiveGame(savedGame);
    } else {
      gameRepository.saveActiveGame(null);
    }
    navigate('/');
  };

  const handleCancelActiveGame = () => {
    setActiveGame(null);
    gameRepository.saveActiveGame(null);
  };

  return (
    <Routes>
      <Route
        path="/"
        element={
          <HomeScreen
            activeGame={activeGame}
            onNewGameClick={() => navigate('/new-game')}
            onResumeGameClick={() => {
              if (activeGame) {
                navigate(`/resume/${activeGame.id}`);
              }
            }}
            onPastGamesClick={() => navigate('/past-games')}
            onCancelActiveGame={handleCancelActiveGame}
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
        path="/scoreboard/:playerOne/:playerTwo/:gameMode/:targetScore/:breakPlayer/:p1Color/:p2Color"
        element={<ScoreboardRoute pastGames={pastGames} onActiveGameUpdate={handleActiveGameUpdate} onGameEnd={handleGameEnd} onBackClick={handleBackFromScoreboard} />}
      />
      <Route
        path="/resume/:gameId"
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
            onDeleteGame={(gameId) => {
              gameRepository.deleteGame(gameId);
              setPastGames(gameRepository.getPastGames());
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
  const params = useParams();
  const playerOne = decodeURIComponent(params.playerOne || 'Player 1');
  const playerTwo = decodeURIComponent(params.playerTwo || 'Player 2');
  const gameMode = (params.gameMode as GameMode) || GameMode.RACE_TO;
  const targetScore = parseInt(params.targetScore || '7', 10);
  const breakPlayer = decodeURIComponent(params.breakPlayer || '');
  const p1ColorStr = params.p1Color || 'NONE';
  const p2ColorStr = params.p2Color || 'NONE';
  const p1Color = p1ColorStr !== 'NONE' ? (p1ColorStr as BallColor) : null;
  const p2Color = p2ColorStr !== 'NONE' ? (p2ColorStr as BallColor) : null;

  return (
    <ScoreboardScreen
      playerOneName={normalizeName(playerOne)}
      playerTwoName={normalizeName(playerTwo)}
      gameMode={gameMode}
      targetScore={targetScore}
      breakPlayer={breakPlayer ? normalizeName(breakPlayer) : null}
      playerOneColor={p1Color}
      playerTwoColor={p2Color}
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
  const params = useParams();
  const gameId = params.gameId;
  const gameToResume = activeGame?.id === gameId ? activeGame : null;

  if (!gameToResume) {
    return <div>Game not found</div>;
  }

  return (
    <ScoreboardScreen
      playerOneName={gameToResume.playerOneName}
      playerTwoName={gameToResume.playerTwoName}
      gameMode={gameToResume.gameMode}
      targetScore={gameToResume.targetScore}
      breakPlayer={gameToResume.breakPlayer}
      playerOneColor={gameToResume.playerOneColor}
      playerTwoColor={gameToResume.playerTwoColor}
      activeGame={gameToResume}
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
        <AppRoutes />
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
