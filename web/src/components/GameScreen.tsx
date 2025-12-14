import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  ToggleButton,
  ToggleButtonGroup,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { GameMode, GameModeDisplayNames, BallColor } from '../data/types';
import { normalizeName, formatNameForDisplay } from '../utils/nameUtils';

interface GameScreenProps {
  onBackClick: () => void;
  onCreateGame: (
    playerOne: string,
    playerTwo: string,
    gameMode: GameMode,
    targetScore: number,
    breakPlayer: string,
    p1Color: BallColor | null,
    p2Color: BallColor | null
  ) => void;
}

export default function GameScreen({ onBackClick, onCreateGame }: GameScreenProps) {
  const [targetScore, setTargetScore] = useState(7);
  const [gameMode, setGameMode] = useState<GameMode>(GameMode.RACE_TO);
  const [playerOneName, setPlayerOneName] = useState('Player 1');
  const [playerTwoName, setPlayerTwoName] = useState('Player 2');
  const [showBreakSelection, setShowBreakSelection] = useState(false);

  const handleCreateGame = (breakPlayerName: string) => {
    const normP1 = normalizeName(playerOneName || 'Player 1');
    const normP2 = normalizeName(playerTwoName || 'Player 2');
    const breakP = normalizeName(breakPlayerName);
    setShowBreakSelection(false);
    onCreateGame(normP1, normP2, gameMode, targetScore, breakP, null, null);
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
        <IconButton onClick={onBackClick} sx={{ color: 'inherit', mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h6" fontWeight="bold">
          New Game
        </Typography>
      </Box>

      <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
        {/* Game Mode Selection */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="subtitle1" gutterBottom sx={{ mb: 2, textAlign: 'center', color: 'text.primary' }}>
              {GameModeDisplayNames[gameMode]}
            </Typography>
            <ToggleButtonGroup
              value={gameMode}
              exclusive
              onChange={(_, value) => value && setGameMode(value)}
              fullWidth
              sx={{ mb: 2 }}
            >
              {Object.values(GameMode).map((mode) => (
                <ToggleButton key={mode} value={mode}>
                  {GameModeDisplayNames[mode]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            {gameMode !== GameMode.FREE_PLAY && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                <IconButton
                  onClick={() => setTargetScore(Math.max(1, targetScore - 1))}
                  sx={{ fontSize: '2rem' }}
                >
                  −
                </IconButton>
                <Typography variant="h3" fontWeight="bold" sx={{ color: 'text.primary' }}>
                  {targetScore}
                </Typography>
                <IconButton
                  onClick={() => setTargetScore(targetScore + 1)}
                  sx={{ fontSize: '2rem' }}
                >
                  +
                </IconButton>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Player Names */}
        <Card sx={{ mb: 3 }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Player 1 Name"
              value={playerOneName}
              onChange={(e) => setPlayerOneName(e.target.value)}
              fullWidth
            />
            <TextField
              label="Player 2 Name"
              value={playerTwoName}
              onChange={(e) => setPlayerTwoName(e.target.value)}
              fullWidth
            />
          </CardContent>
        </Card>

        {/* Create Game Button */}
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={() => setShowBreakSelection(true)}
          sx={{ py: 1.5, fontSize: '1.25rem', fontWeight: 'bold' }}
        >
          Create Game
        </Button>
      </Box>

      {/* Break Selection Dialog */}
      <Dialog open={showBreakSelection} onClose={() => setShowBreakSelection(false)}>
        <DialogTitle>Who Breaks First?</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, minWidth: 250 }}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => handleCreateGame(playerOneName || 'Player 1')}
              sx={{ py: 1.5 }}
            >
              {formatNameForDisplay(playerOneName || 'Player 1')}
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={() => handleCreateGame(playerTwoName || 'Player 2')}
              sx={{ py: 1.5 }}
            >
              {formatNameForDisplay(playerTwoName || 'Player 2')}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowBreakSelection(false)}>Cancel</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

