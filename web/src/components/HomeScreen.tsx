import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Container,
  Grid,
  Fade,
  useTheme,
  IconButton,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import HistoryIcon from '@mui/icons-material/History';
import SportsBarIcon from '@mui/icons-material/SportsBar';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import CloseIcon from '@mui/icons-material/Close';
import { ActiveGame } from '../data/types';
import { formatNameForDisplay } from '../utils/nameUtils';

interface HomeScreenProps {
  activeGame: ActiveGame | null;
  onNewGameClick: () => void;
  onResumeGameClick: () => void;
  onPastGamesClick: () => void;
  onCancelActiveGame?: () => void;
}

export default function HomeScreen({
  activeGame,
  onNewGameClick,
  onResumeGameClick,
  onPastGamesClick,
  onCancelActiveGame,
}: HomeScreenProps) {
  const theme = useTheme();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, ${theme.palette.secondary.main}08 100%)`,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative background elements */}
      <Box
        sx={{
          position: 'absolute',
          top: -100,
          right: -100,
          width: 400,
          height: 400,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${theme.palette.primary.main}15, ${theme.palette.secondary.main}15)`,
          filter: 'blur(80px)',
          zIndex: 0,
        }}
      />
      <Box
        sx={{
          position: 'absolute',
          bottom: -150,
          left: -150,
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${theme.palette.secondary.main}15, ${theme.palette.primary.main}15)`,
          filter: 'blur(100px)',
          zIndex: 0,
        }}
      />

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: 6 }}>
        {/* Hero Section */}
        <Fade in timeout={800}>
          <Box sx={{ textAlign: 'center', mb: 6 }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                mb: 2,
                px: 2,
                py: 0.5,
                borderRadius: 3,
                bgcolor: 'primary.main',
                color: 'white',
              }}
            >
              <SportsBarIcon />
              <Typography variant="body2" fontWeight="bold">
                Pool Scoreboard App
              </Typography>
            </Box>

            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontSize: { xs: '3rem', sm: '4.5rem', md: '5.5rem' },
                fontWeight: 900,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 2,
                lineHeight: 1.1,
              }}
            >
              Break & Run
            </Typography>

            <Typography
              variant="h5"
              sx={{
                color: 'text.secondary',
                mb: 4,
                maxWidth: 600,
                mx: 'auto',
                fontWeight: 300,
                fontSize: { xs: '1.1rem', sm: '1.5rem' },
              }}
            >
              Track your pool games with style. Simple, fast, and always ready when you need it.
            </Typography>

            {/* Quick Stats */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: 4,
                flexWrap: 'wrap',
                mb: 6,
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'primary.main' }}>
                  Multiple
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Game Modes
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'secondary.main' }}>
                  Instant
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Score Tracking
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'primary.main' }}>
                  Always
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                  Accessible
                </Typography>
              </Box>
            </Box>
          </Box>
        </Fade>

        {/* Main Action Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Resume Game Card - Only show if active game exists */}
          {activeGame && (
            <Grid item xs={12} md={activeGame ? 4 : 6}>
              <Fade in timeout={1000}>
                <Card
                  onMouseEnter={() => setHoveredCard('resume')}
                  onMouseLeave={() => setHoveredCard(null)}
                  onClick={onResumeGameClick}
                  sx={{
                    height: '100%',
                    cursor: 'pointer',
                    background: `linear-gradient(135deg, ${theme.palette.warning.main}, ${theme.palette.warning.dark})`,
                    color: 'white',
                    transform: hoveredCard === 'resume' ? 'translateY(-8px)' : 'translateY(0)',
                    transition: 'all 0.3s ease',
                    boxShadow: hoveredCard === 'resume' ? 8 : 4,
                    position: 'relative',
                    overflow: 'hidden',
                    '&::before': {
                      content: '""',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      background: 'rgba(255, 255, 255, 0.1)',
                      opacity: hoveredCard === 'resume' ? 1 : 0,
                      transition: 'opacity 0.3s ease',
                    },
                  }}
                >
                  <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
                    {onCancelActiveGame && (
                      <IconButton
                        onClick={(e) => {
                          e.stopPropagation();
                          onCancelActiveGame();
                        }}
                        sx={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          color: 'white',
                          '&:hover': {
                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                          },
                        }}
                      >
                        <CloseIcon />
                      </IconButton>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                      <PlayArrowIcon sx={{ fontSize: 40, color: 'rgba(0, 0, 0, 0.7)' }} />
                      <Typography variant="h5" fontWeight="bold">
                        Resume Game
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ mb: 2, opacity: 0.95 }}>
                      Continue your current match
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: 2,
                        p: 2,
                        mt: 2,
                      }}
                    >
                      <Typography variant="body2" fontWeight="medium">
                        {formatNameForDisplay(activeGame.playerOneName)} vs{' '}
                        {formatNameForDisplay(activeGame.playerTwoName)}
                      </Typography>
                      <Typography variant="h6" fontWeight="bold" sx={{ mt: 1 }}>
                        {activeGame.playerOneScore} - {activeGame.playerTwoScore}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Fade>
            </Grid>
          )}

          {/* New Game Card */}
          <Grid item xs={12} md={activeGame ? 4 : 6}>
            <Fade in timeout={1200}>
              <Card
                onMouseEnter={() => setHoveredCard('new')}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={onNewGameClick}
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`,
                  color: 'white',
                  transform: hoveredCard === 'new' ? 'translateY(-8px)' : 'translateY(0)',
                  transition: 'all 0.3s ease',
                  boxShadow: hoveredCard === 'new' ? 8 : 4,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255, 255, 255, 0.1)',
                    opacity: hoveredCard === 'new' ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                  },
                }}
              >
                <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <PlayArrowIcon sx={{ fontSize: 40 }} />
                    <Typography variant="h5" fontWeight="bold">
                      New Game
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 3, opacity: 0.95 }}>
                    Start tracking a new pool match
                  </Typography>
                  <Button
                    variant="contained"
                    size="large"
                    fullWidth
                    sx={{
                      bgcolor: 'white',
                      color: 'primary.main',
                      fontWeight: 'bold',
                      py: 1.5,
                      '&:hover': {
                        bgcolor: 'rgba(255, 255, 255, 0.9)',
                        transform: 'scale(1.05)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Start Now
                  </Button>
                </CardContent>
              </Card>
            </Fade>
          </Grid>

          {/* Past Games Card */}
          <Grid item xs={12} md={activeGame ? 4 : 6}>
            <Fade in timeout={1400}>
              <Card
                onMouseEnter={() => setHoveredCard('past')}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={onPastGamesClick}
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  background: `linear-gradient(135deg, ${theme.palette.secondary.main}, ${theme.palette.secondary.dark})`,
                  color: 'white',
                  transform: hoveredCard === 'past' ? 'translateY(-8px)' : 'translateY(0)',
                  transition: 'all 0.3s ease',
                  boxShadow: hoveredCard === 'past' ? 8 : 4,
                  position: 'relative',
                  overflow: 'hidden',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'rgba(255, 255, 255, 0.1)',
                    opacity: hoveredCard === 'past' ? 1 : 0,
                    transition: 'opacity 0.3s ease',
                  },
                }}
              >
                <CardContent sx={{ p: 4, position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    <HistoryIcon sx={{ fontSize: 40, color: 'white' }} />
                    <Typography variant="h5" fontWeight="bold">
                      Past Games
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: 3, opacity: 0.95 }}>
                    Review your game history and statistics
                  </Typography>
                  <Button
                    variant="outlined"
                    size="large"
                    fullWidth
                    sx={{
                      borderColor: 'white',
                      color: 'white',
                      fontWeight: 'bold',
                      py: 1.5,
                      '&:hover': {
                        borderColor: 'white',
                        bgcolor: 'rgba(255, 255, 255, 0.1)',
                        transform: 'scale(1.05)',
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    View History
                  </Button>
                </CardContent>
              </Card>
            </Fade>
          </Grid>
        </Grid>

        {/* Features Section */}
        <Fade in timeout={1600}>
          <Box sx={{ mt: 8, mb: 4 }}>
            <Typography
              variant="h4"
              fontWeight="bold"
              textAlign="center"
              sx={{ mb: 4, color: 'text.primary' }}
            >
              Everything You Need
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6} md={3}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    height: '100%',
                    boxShadow: 2,
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: 'primary.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <SportsBarIcon sx={{ fontSize: 30, color: 'primary.main' }} />
                  </Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'text.primary' }}>
                    Multiple Modes
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Race to, Sets of, Best of, and Free Play
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    height: '100%',
                    boxShadow: 2,
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: 'secondary.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <TrendingUpIcon sx={{ fontSize: 30, color: 'secondary.main' }} />
                  </Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'text.primary' }}>
                    Track Stats
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Frame-by-frame history and detailed breakdowns
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    height: '100%',
                    boxShadow: 2,
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: 'success.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <PlayArrowIcon sx={{ fontSize: 30, color: 'success.dark' }} />
                  </Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'text.primary' }}>
                    Resume Anytime
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Games auto-save so you never lose progress
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    borderRadius: 3,
                    bgcolor: 'background.paper',
                    height: '100%',
                    boxShadow: 2,
                    transition: 'transform 0.2s ease',
                    '&:hover': {
                      transform: 'translateY(-4px)',
                      boxShadow: 4,
                    },
                  }}
                >
                  <Box
                    sx={{
                      width: 60,
                      height: 60,
                      borderRadius: '50%',
                      bgcolor: 'warning.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: 2,
                    }}
                  >
                    <HistoryIcon sx={{ fontSize: 30, color: 'warning.dark' }} />
                  </Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'text.primary' }}>
                    Game History
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                    Review past matches and track your progress
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
}
