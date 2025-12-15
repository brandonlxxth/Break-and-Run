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
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import CloudSyncIcon from '@mui/icons-material/CloudSync';
import DevicesIcon from '@mui/icons-material/Devices';
import { ActiveGame, GameMode, GameModeDisplayNames } from '../data/types';
import { formatNameForDisplay } from '../utils/nameUtils';
import { useAuth } from '../contexts/AuthContext';

interface HomeScreenProps {
  activeGame: ActiveGame | null;
  user: { id: string; email: string | undefined } | null;
  onNewGameClick: () => void;
  onResumeGameClick: () => void;
  onPastGamesClick: () => void;
  onCancelActiveGame?: () => void;
  onLoginClick: () => void;
}

export default function HomeScreen({
  activeGame,
  user,
  onNewGameClick,
  onResumeGameClick,
  onPastGamesClick,
  onCancelActiveGame,
  onLoginClick,
}: HomeScreenProps) {
  const theme = useTheme();
  const { signOut } = useAuth();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const handleSignOut = async () => {
    await signOut();
  };

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

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 3, sm: 4, md: 6 }, px: { xs: 2, sm: 3 } }}>
        {/* Auth Section */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
          {user ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                {user.email}
              </Typography>
              <Button
                variant="outlined"
                size="small"
                onClick={handleSignOut}
                startIcon={<LogoutIcon />}
                sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
              >
                Sign Out
              </Button>
            </Box>
          ) : (
            <Button
              variant="outlined"
              size="small"
              onClick={onLoginClick}
              startIcon={<LoginIcon />}
              sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}
            >
              Login
            </Button>
          )}
        </Box>

        {/* Hero Section */}
        <Fade in timeout={800}>
          <Box sx={{ textAlign: 'center', mb: { xs: 4, sm: 5, md: 6 } }}>
            <Box
              sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                mb: { xs: 1.5, sm: 2 },
                px: { xs: 1.5, sm: 2 },
                py: 0.5,
                borderRadius: 3,
                bgcolor: 'primary.main',
                color: 'white',
              }}
            >
              <SportsBarIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
              <Typography variant="body2" fontWeight="bold" sx={{ fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                Pool Scoreboard App
              </Typography>
            </Box>

            <Typography
              variant="h1"
              component="h1"
              sx={{
                fontSize: { xs: '2rem', sm: '3.5rem', md: '5.5rem' },
                fontWeight: 900,
                background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: { xs: 1.5, sm: 2 },
                lineHeight: 1.1,
                px: { xs: 1, sm: 0 },
              }}
            >
              Break & Run
            </Typography>

            <Typography
              variant="h5"
              sx={{
                color: 'text.secondary',
                mb: { xs: 3, sm: 4 },
                maxWidth: 600,
                mx: 'auto',
                fontWeight: 300,
                fontSize: { xs: '0.95rem', sm: '1.25rem', md: '1.5rem' },
                px: { xs: 1, sm: 0 },
                lineHeight: { xs: 1.4, sm: 1.5 },
              }}
            >
              Track your pool games with style. Simple, fast, and always ready when you need it.
            </Typography>

            {/* Quick Stats */}
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                gap: { xs: 2, sm: 3, md: 4 },
                flexWrap: 'wrap',
                mb: { xs: 4, sm: 5, md: 6 },
              }}
            >
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'primary.main', fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
                  Multiple
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Game Modes
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'secondary.main', fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
                  Cloud Sync
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  {user ? 'Active' : 'Available'}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="h4" fontWeight="bold" sx={{ color: 'primary.main', fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}>
                  Cross-Device
                </Typography>
                <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                  Access
                </Typography>
              </Box>
            </Box>
            
            {/* Login Prompt for Non-Authenticated Users */}
            {!user && (
              <Fade in timeout={1000}>
                <Box
                  sx={{
                    maxWidth: 600,
                    mx: 'auto',
                    mb: { xs: 4, sm: 5, md: 6 },
                    p: { xs: 2, sm: 3 },
                    borderRadius: 3,
                    background: `linear-gradient(135deg, ${theme.palette.info.main}15, ${theme.palette.info.dark}15)`,
                    border: `1px solid ${theme.palette.info.main}30`,
                    textAlign: 'center',
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1 }}>
                    <CloudSyncIcon sx={{ color: 'info.main', fontSize: { xs: 20, sm: 24 } }} />
                    <Typography variant="h6" fontWeight="bold" sx={{ color: 'info.main', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                      Sign In to Sync Your Games
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                    Create an account to save your games in the cloud and access them from any device. Never lose your game history again!
                  </Typography>
                  <Button
                    variant="contained"
                    color="info"
                    onClick={onLoginClick}
                    startIcon={<LoginIcon />}
                    sx={{ fontWeight: 'bold' }}
                  >
                    Sign In / Sign Up
                  </Button>
                </Box>
              </Fade>
            )}
          </Box>
        </Fade>

        {/* Main Action Cards */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {/* Resume Game Card - Only show if active game exists AND user is signed in */}
          {activeGame && user && (
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, mb: { xs: 1.5, sm: 2 } }}>
                      <PlayArrowIcon sx={{ fontSize: { xs: 32, sm: 40 }, color: 'rgba(0, 0, 0, 0.7)' }} />
                      <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                        Resume Game
                      </Typography>
                    </Box>
                    <Typography variant="body1" sx={{ mb: { xs: 1.5, sm: 2 }, opacity: 0.95, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
                      Continue your current match
                    </Typography>
                    <Box
                      sx={{
                        bgcolor: 'rgba(255, 255, 255, 0.2)',
                        borderRadius: 2,
                        p: { xs: 1.5, sm: 2 },
                        mt: { xs: 1.5, sm: 2 },
                      }}
                    >
                      {activeGame.gameMode === GameMode.KILLER ? (
                        <>
                          <Typography variant="body2" fontWeight="medium" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                            {GameModeDisplayNames[GameMode.KILLER]}
                          </Typography>
                          {activeGame.killerPlayers && activeGame.killerPlayers.length > 0 ? (
                            <>
                              <Typography variant="body2" sx={{ mt: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                                {activeGame.killerPlayers.length} {activeGame.killerPlayers.length === 1 ? 'player' : 'players'}
                              </Typography>
                              <Typography variant="body2" sx={{ mt: 0.5, fontSize: { xs: '0.7rem', sm: '0.8rem' }, color: 'text.secondary' }}>
                                {activeGame.killerPlayers.filter(p => p.lives > 0).length} remaining
                              </Typography>
                            </>
                          ) : (
                            <Typography variant="body2" sx={{ mt: 1, fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                              No players loaded
                            </Typography>
                          )}
                        </>
                      ) : (
                        <>
                          <Typography variant="body2" fontWeight="medium" sx={{ fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                            {formatNameForDisplay(activeGame.playerOneName)} vs{' '}
                            {formatNameForDisplay(activeGame.playerTwoName)}
                          </Typography>
                          <Typography variant="h6" fontWeight="bold" sx={{ mt: 1, fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                            {activeGame.playerOneScore} - {activeGame.playerTwoScore}
                          </Typography>
                        </>
                      )}
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
                <CardContent sx={{ p: { xs: 3, sm: 4 }, position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, mb: { xs: 1.5, sm: 2 } }}>
                    <PlayArrowIcon sx={{ fontSize: { xs: 32, sm: 40 } }} />
                    <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                      New Game
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: { xs: 2, sm: 3 }, opacity: 0.95, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
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
                      py: { xs: 1.25, sm: 1.5 },
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      minHeight: { xs: 44, sm: 'auto' },
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
                <CardContent sx={{ p: { xs: 3, sm: 4 }, position: 'relative', zIndex: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 1.5, sm: 2 }, mb: { xs: 1.5, sm: 2 } }}>
                    <HistoryIcon sx={{ fontSize: { xs: 32, sm: 40 }, color: 'white' }} />
                    <Typography variant="h5" fontWeight="bold" sx={{ fontSize: { xs: '1.25rem', sm: '1.5rem' } }}>
                      Past Games
                    </Typography>
                  </Box>
                  <Typography variant="body1" sx={{ mb: { xs: 2, sm: 3 }, opacity: 0.95, fontSize: { xs: '0.875rem', sm: '1rem' } }}>
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
                      py: { xs: 1.25, sm: 1.5 },
                      fontSize: { xs: '0.9rem', sm: '1rem' },
                      minHeight: { xs: 44, sm: 'auto' },
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
          <Box sx={{ mt: { xs: 4, sm: 6, md: 8 }, mb: { xs: 2, sm: 4 } }}>
            <Typography
              variant="h4"
              fontWeight="bold"
              textAlign="center"
              sx={{ mb: { xs: 3, sm: 4 }, color: 'text.primary', fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' } }}
            >
              Everything You Need
            </Typography>
            <Grid container spacing={3} justifyContent="center">
              {/* First Row - 4 Cards */}
              <Grid item xs={12} sm={6} md={3}>
                  <Box
                    sx={{
                      textAlign: 'center',
                      p: { xs: 2, sm: 3 },
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
                      width: { xs: 50, sm: 60 },
                      height: { xs: 50, sm: 60 },
                      borderRadius: '50%',
                      bgcolor: 'primary.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: { xs: 1.5, sm: 2 },
                    }}
                  >
                    <SportsBarIcon sx={{ fontSize: { xs: 24, sm: 30 }, color: 'primary.main' }} />
                  </Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'text.primary', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    Multiple Modes
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Race to, Sets of, Best of, and Free Play
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: { xs: 2, sm: 3 },
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
                      width: { xs: 50, sm: 60 },
                      height: { xs: 50, sm: 60 },
                      borderRadius: '50%',
                      bgcolor: 'secondary.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: { xs: 1.5, sm: 2 },
                    }}
                  >
                    <TrendingUpIcon sx={{ fontSize: { xs: 24, sm: 30 }, color: 'secondary.main' }} />
                  </Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'text.primary', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    Track Stats
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Frame-by-frame history and detailed breakdowns
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: { xs: 2, sm: 3 },
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
                      width: { xs: 50, sm: 60 },
                      height: { xs: 50, sm: 60 },
                      borderRadius: '50%',
                      bgcolor: 'success.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: { xs: 1.5, sm: 2 },
                    }}
                  >
                    <PlayArrowIcon sx={{ fontSize: { xs: 24, sm: 30 }, color: 'success.dark' }} />
                  </Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'text.primary', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    Resume Anytime
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Games auto-save so you never lose progress
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: { xs: 2, sm: 3 },
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
                      width: { xs: 50, sm: 60 },
                      height: { xs: 50, sm: 60 },
                      borderRadius: '50%',
                      bgcolor: 'info.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: { xs: 1.5, sm: 2 },
                    }}
                  >
                    <CloudSyncIcon sx={{ fontSize: { xs: 24, sm: 30 }, color: 'info.main' }} />
                  </Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'text.primary', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    Cloud Backup
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {user ? 'Your games are safely synced' : 'Sign in to enable cloud sync'}
                  </Typography>
                </Box>
              </Grid>

              {/* Second Row - 2 Cards Centered */}
              <Grid item xs={0} md={3} sx={{ display: { xs: 'none', md: 'block' } }} />
              <Grid item xs={12} sm={6} md={3}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: { xs: 2, sm: 3 },
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
                      width: { xs: 50, sm: 60 },
                      height: { xs: 50, sm: 60 },
                      borderRadius: '50%',
                      bgcolor: 'warning.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: { xs: 1.5, sm: 2 },
                    }}
                  >
                    <HistoryIcon sx={{ fontSize: { xs: 24, sm: 30 }, color: 'warning.dark' }} />
                  </Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'text.primary', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    Game History
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    Review past matches and track your progress
                  </Typography>
                </Box>
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <Box
                  sx={{
                    textAlign: 'center',
                    p: { xs: 2, sm: 3 },
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
                      width: { xs: 50, sm: 60 },
                      height: { xs: 50, sm: 60 },
                      borderRadius: '50%',
                      bgcolor: 'primary.light',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      mx: 'auto',
                      mb: { xs: 1.5, sm: 2 },
                    }}
                  >
                    <DevicesIcon sx={{ fontSize: { xs: 24, sm: 30 }, color: 'primary.main' }} />
                  </Box>
                  <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ color: 'text.primary', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                    Cross-Device
                  </Typography>
                  <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: { xs: '0.75rem', sm: '0.875rem' } }}>
                    {user ? 'Access your games anywhere' : 'Sign in to sync across devices'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={0} md={3} sx={{ display: { xs: 'none', md: 'block' } }} />
            </Grid>
          </Box>
        </Fade>
      </Container>
    </Box>
  );
}
