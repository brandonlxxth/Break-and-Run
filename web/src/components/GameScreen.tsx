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

      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 600, mx: 'auto' }}>
        {/* Game Mode Selection */}
        <Card sx={{ mb: { xs: 2, sm: 3 } }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Typography variant="subtitle1" gutterBottom sx={{ mb: { xs: 1.5, sm: 2 }, textAlign: 'center', color: 'text.primary', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
              {GameModeDisplayNames[gameMode]}
            </Typography>
            <ToggleButtonGroup
              value={gameMode}
              exclusive
              onChange={(_, value) => value && setGameMode(value)}
              fullWidth
              sx={{ mb: { xs: 1.5, sm: 2 } }}
            >
              {Object.values(GameMode).map((mode) => (
                <ToggleButton 
                  key={mode} 
                  value={mode} 
                  sx={{ 
                    fontSize: { xs: '0.75rem', sm: '0.875rem' }, 
                    py: { xs: 1, sm: 1.5 },
                    textTransform: 'none'
                  }}
                >
                  {GameModeDisplayNames[mode]}
                </ToggleButton>
              ))}
            </ToggleButtonGroup>

            {gameMode !== GameMode.FREE_PLAY && (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: { xs: 1.5, sm: 2 } }}>
                <IconButton
                  onClick={() => setTargetScore(Math.max(1, targetScore - 1))}
                  sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, minWidth: { xs: 44, sm: 40 }, minHeight: { xs: 44, sm: 40 } }}
                >
                  −
                </IconButton>
                <Typography variant="h3" fontWeight="bold" sx={{ color: 'text.primary', fontSize: { xs: '2.5rem', sm: '3rem' } }}>
                  {targetScore}
                </Typography>
                <IconButton
                  onClick={() => setTargetScore(targetScore + 1)}
                  sx={{ fontSize: { xs: '1.5rem', sm: '2rem' }, minWidth: { xs: 44, sm: 40 }, minHeight: { xs: 44, sm: 40 } }}
                >
                  +
                </IconButton>
              </Box>
            )}
          </CardContent>
        </Card>

        {/* Player Names */}
        <Card sx={{ mb: { xs: 2, sm: 3 } }}>
          <CardContent sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 }, p: { xs: 2, sm: 3 } }}>
            <TextField
              label="Player 1 Name"
              value={playerOneName}
              onChange={(e) => setPlayerOneName(e.target.value)}
              fullWidth
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                },
              }}
            />
            <TextField
              label="Player 2 Name"
              value={playerTwoName}
              onChange={(e) => setPlayerTwoName(e.target.value)}
              fullWidth
              sx={{
                '& .MuiInputBase-root': {
                  fontSize: { xs: '0.875rem', sm: '1rem' },
                },
              }}
            />
          </CardContent>
        </Card>

        {/* Create Game Button */}
        <Button
          variant="contained"
          fullWidth
          size="large"
          onClick={() => setShowBreakSelection(true)}
          sx={{ 
            py: { xs: 1.25, sm: 1.5 }, 
            fontSize: { xs: '1rem', sm: '1.25rem' }, 
            fontWeight: 'bold',
            minHeight: { xs: 48, sm: 'auto' }
          }}
        >
          Create Game
        </Button>
      </Box>

      {/* Break Selection Dialog */}
      <Dialog open={showBreakSelection} onClose={() => setShowBreakSelection(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>Who Breaks First?</DialogTitle>
        <DialogContent sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: { xs: 1.5, sm: 2 }, minWidth: { xs: 'auto', sm: 250 } }}>
            <Button
              variant="contained"
              fullWidth
              onClick={() => handleCreateGame(playerOneName || 'Player 1')}
              sx={{ 
                py: { xs: 1.25, sm: 1.5 },
                fontSize: { xs: '0.9rem', sm: '1rem' },
                minHeight: { xs: 48, sm: 'auto' }
              }}
            >
              {formatNameForDisplay(playerOneName || 'Player 1')}
            </Button>
            <Button
              variant="contained"
              fullWidth
              onClick={() => handleCreateGame(playerTwoName || 'Player 2')}
              sx={{ 
                py: { xs: 1.25, sm: 1.5 },
                fontSize: { xs: '0.9rem', sm: '1rem' },
                minHeight: { xs: 48, sm: 'auto' }
              }}
            >
              {formatNameForDisplay(playerTwoName || 'Player 2')}
            </Button>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: { xs: 2, sm: 3 }, pb: { xs: 2, sm: 3 } }}>
          <Button 
            onClick={() => setShowBreakSelection(false)}
            sx={{ fontSize: { xs: '0.875rem', sm: '1rem' }, minHeight: { xs: 44, sm: 'auto' } }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

