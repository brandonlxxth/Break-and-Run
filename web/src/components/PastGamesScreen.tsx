import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Collapse,
  Divider,
  Chip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Game, GameMode, GameModeDisplayNames, DishTypeDisplayNames, DishType } from '../data/types';
import { formatNameForDisplay } from '../utils/nameUtils';

interface PastGamesScreenProps {
  games: Game[];
  onBackClick: () => void;
  onDeleteGame: (gameId: string) => void;
}

export default function PastGamesScreen({
  games,
  onBackClick,
  onDeleteGame,
}: PastGamesScreenProps) {
  const [expandedGameId, setExpandedGameId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  if (games.length === 0) {
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
            Past Games
          </Typography>
        </Box>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '50vh',
            gap: 2,
          }}
        >
          <Typography variant="h6" sx={{ color: 'text.secondary' }}>
            No past games
          </Typography>
          <Typography variant="body2" sx={{ color: 'text.secondary' }}>
            Start a new game to see it here
          </Typography>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          p: { xs: 1.5, sm: 2 },
          bgcolor: 'primary.main',
          color: 'primary.contrastText',
        }}
      >
        <IconButton onClick={onBackClick} sx={{ color: 'inherit', mr: { xs: 0.5, sm: 1 }, minWidth: { xs: 44, sm: 40 }, minHeight: { xs: 44, sm: 40 } }}>
          <ArrowBackIcon sx={{ fontSize: { xs: 24, sm: 20 } }} />
        </IconButton>
        <Typography variant="h6" fontWeight="bold" sx={{ fontSize: { xs: '1rem', sm: '1.25rem' } }}>
          Past Games
        </Typography>
      </Box>

      <Box sx={{ p: { xs: 1.5, sm: 2 }, maxWidth: 800, mx: 'auto' }}>
        {games.map((game) => {
          const isExpanded = expandedGameId === game.id;
          // Ensure killerPlayers is available for killer mode games
          const killerPlayers = game.gameMode === GameMode.KILLER ? (game.killerPlayers || []) : [];
          const duration = game.endTime.getTime() - game.startTime.getTime();
          const durationSeconds = Math.floor(duration / 1000);
          const durationMinutes = Math.floor(durationSeconds / 60);
          const durationSecs = durationSeconds % 60;

          // Calculate average time between frames
          let avgTimeBetweenFrames = 0;
          if (game.frameHistory.length > 0) {
            if (game.frameHistory.length === 1) {
              // If only one frame, calculate time from start to that frame
              avgTimeBetweenFrames = game.frameHistory[0].timestamp.getTime() - game.startTime.getTime();
            } else {
              // Multiple frames: calculate average time between frames
              const totalTime = game.frameHistory[game.frameHistory.length - 1].timestamp.getTime() - 
                                game.frameHistory[0].timestamp.getTime();
              avgTimeBetweenFrames = totalTime / (game.frameHistory.length - 1);
            }
          }
          const avgSeconds = avgTimeBetweenFrames / 1000.0;
          const avgMinutes = Math.floor(avgSeconds / 60);
          const avgSecs = avgSeconds % 60;

          return (
            <Card
              key={game.id}
              sx={{ mb: 2, cursor: 'pointer' }}
              onClick={() => setExpandedGameId(isExpanded ? null : game.id)}
            >
              <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: { xs: 1, sm: 2 }, flexWrap: { xs: 'wrap', sm: 'nowrap' } }}>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {game.gameMode === GameMode.KILLER ? (
                      <>
                        <Typography variant="h6" fontWeight="semiBold" sx={{ color: 'text.primary', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                          {GameModeDisplayNames[GameMode.KILLER]}
                        </Typography>
                        {game.killerPlayers && game.killerPlayers.length > 0 && (
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                            {game.killerPlayers.length} {game.killerPlayers.length === 1 ? 'player' : 'players'}
                          </Typography>
                        )}
                      </>
                    ) : (
                      <>
                        <Typography variant="h6" fontWeight="semiBold" sx={{ color: 'text.primary', fontSize: { xs: '1rem', sm: '1.25rem' } }}>
                          {formatNameForDisplay(game.playerOneName)} vs{' '}
                          {formatNameForDisplay(game.playerTwoName)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                          {game.date.toLocaleDateString()}
                        </Typography>
                      </>
                    )}
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: { xs: 0.5, sm: 1 } }}>
                    <Box sx={{ textAlign: 'right', mr: { xs: 0.5, sm: 1 } }}>
                      {game.gameMode === GameMode.KILLER ? (
                        <>
                          <Typography variant="h6" fontWeight="bold" sx={{ color: 'white', fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
                            {(() => {
                              // If winner looks like a GUID (contains hyphens and is long), try to find the player
                              if (game.winner && game.winner.length > 30 && game.winner.includes('-')) {
                                // This might be an old game with ID stored - try to find by ID
                                const winnerById = killerPlayers.find(p => p && p.id === game.winner);
                                if (winnerById && winnerById.name) {
                                  return formatNameForDisplay(winnerById.name);
                                }
                              }
                              // Otherwise, treat it as a name
                              return game.winner
                                ? formatNameForDisplay(game.winner)
                                : 'No Winner';
                            })()}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                            Winner
                          </Typography>
                        </>
                      ) : (
                        <>
                          <Typography variant="h6" fontWeight="bold" sx={{ color: 'primary.main', fontSize: { xs: '1.125rem', sm: '1.25rem' } }}>
                            {game.gameMode === GameMode.FIRST_TO && game.sets.length > 0
                              ? `${game.playerOneSetsWon} - ${game.playerTwoSetsWon}`
                              : `${game.playerOneScore} - ${game.playerTwoScore}`}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                            {game.winner
                              ? `Winner: ${formatNameForDisplay(game.winner)}`
                              : 'Draw'}
                          </Typography>
                        </>
                      )}
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteConfirmId(game.id);
                      }}
                      sx={{ color: 'error.main', minWidth: { xs: 40, sm: 32 }, minHeight: { xs: 40, sm: 32 } }}
                    >
                      <DeleteIcon sx={{ fontSize: { xs: 20, sm: 18 } }} />
                    </IconButton>
                  </Box>
                </Box>

                {game.gameMode !== GameMode.KILLER && (
                  <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary', fontSize: { xs: '0.8rem', sm: '0.875rem' } }}>
                    {game.gameMode === GameMode.FREE_PLAY
                      ? GameModeDisplayNames[game.gameMode]
                      : `${GameModeDisplayNames[game.gameMode]}: ${game.targetScore}`}
                  </Typography>
                )}
                {game.gameMode === GameMode.KILLER && (
                  <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                    {game.date.toLocaleDateString()}
                  </Typography>
                )}

                {game.frameHistory.length > 0 && (
                  <Box sx={{ mt: 1, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: { xs: 1, sm: 0 } }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      Start: {game.startTime.toLocaleTimeString()}
                      <br />
                      End: {game.endTime.toLocaleTimeString()}
                    </Typography>
                    <Typography variant="caption" sx={{ textAlign: { xs: 'left', sm: 'right' }, color: 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}>
                      Duration: {durationMinutes}m {durationSecs}s
                      <br />
                      {avgMinutes > 0 ? (
                        <>Avg: {avgMinutes}m {avgSecs.toFixed(1)}s/frame</>
                      ) : (
                        <>Avg: {avgSeconds.toFixed(1)}s/frame</>
                      )}
                    </Typography>
                  </Box>
                )}

                <Collapse in={isExpanded}>
                  <Divider sx={{ my: 2 }} />
                  {game.gameMode === GameMode.FIRST_TO && game.sets.length > 0 ? (
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color: 'text.primary', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                        Set-by-Set Breakdown
                      </Typography>
                      {game.sets.map((set, index) => (
                        <Box key={index} sx={{ mb: 2 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              mb: 1,
                            }}
                          >
                            <Typography variant="body2" fontWeight="semiBold" sx={{ color: 'text.primary', fontSize: { xs: '0.875rem', sm: '0.875rem' } }}>
                              Set {set.setNumber}: {set.playerOneScore} - {set.playerTwoScore}
                            </Typography>
                            <Typography
                              variant="caption"
                              sx={{ color: set.winner ? 'primary.main' : 'text.secondary', fontSize: { xs: '0.7rem', sm: '0.75rem' } }}
                            >
                              {set.winner
                                ? `Winner: ${formatNameForDisplay(set.winner)}`
                                : 'Draw'}
                            </Typography>
                          </Box>
                          {set.frames.map((frame, frameIndex) => {
                            // Calculate time since previous frame
                            const previousTime = frameIndex === 0 
                              ? (index === 0 ? game.startTime : game.sets[index - 1].frames[game.sets[index - 1].frames.length - 1]?.timestamp || game.startTime)
                              : set.frames[frameIndex - 1].timestamp;
                            const timeSincePrevious = frame.timestamp.getTime() - previousTime.getTime();
                            const secondsSincePrevious = timeSincePrevious / 1000.0;

                            return (
                              <Box
                                key={frameIndex}
                                sx={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'space-between',
                                  gap: 1,
                                  ml: 2,
                                  mb: 0.5,
                                }}
                              >
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                  {frame.dishType && frame.dishType in DishTypeDisplayNames ? (
                                    <>
                                      <Typography
                                        variant="caption"
                                        sx={{
                                          fontWeight: 'semiBold',
                                          color: 'primary.main',
                                        }}
                                      >
                                        {formatNameForDisplay(frame.player)}
                                      </Typography>
                                      <Chip
                                        label={DishTypeDisplayNames[frame.dishType]}
                                        size="small"
                                        sx={{
                                          height: 20,
                                          fontSize: '0.65rem',
                                          fontWeight: 'bold',
                                          bgcolor: 'secondary.light',
                                          color: 'secondary.contrastText',
                                        }}
                                      />
                                      <Typography
                                        variant="caption"
                                        sx={{ fontSize: '0.7rem', color: 'text.secondary' }}
                                      >
                                        {frame.playerOneScore} - {frame.playerTwoScore}
                                      </Typography>
                                    </>
                                  ) : (
                                    <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                      {formatNameForDisplay(frame.player)}{' '}
                                      {frame.scoreChange > 0 ? '+' : ''}
                                      {frame.scoreChange} {frame.playerOneScore} -{' '}
                                      {frame.playerTwoScore}
                                    </Typography>
                                  )}
                                </Box>
                                <Typography
                                  variant="caption"
                                  sx={{ fontSize: '0.65rem', opacity: 0.7, color: 'text.secondary' }}
                                >
                                  +{secondsSincePrevious.toFixed(1)}s
                                </Typography>
                              </Box>
                            );
                          })}
                          {index < game.sets.length - 1 && <Divider sx={{ my: 1 }} />}
                        </Box>
                      ))}
                    </Box>
                  ) : game.gameMode === GameMode.KILLER ? (
                    <Box>
                      {/* Show final player standings - always show if killer mode */}
                      {game.gameMode === GameMode.KILLER && (
                        <Box sx={{ mb: 3 }}>
                          <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color: 'text.primary', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                            Final Standings
                          </Typography>
                          {killerPlayers && killerPlayers.length > 0 ? (
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                              {killerPlayers.map((player, idx) => {
                                // For killer mode, winner is stored as player name, so compare by name
                                const isWinner = game.winner === player.name;
                                // Only show as eliminated if NOT the winner and has 0 lives
                                const isEliminated = !isWinner && player.lives === 0;
                                return (
                                  <Box
                                    key={player.id || idx}
                                    sx={{
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center',
                                      p: 1.5,
                                      borderRadius: 1,
                                      bgcolor: isWinner ? '#4caf50' : isEliminated ? 'error.light' : 'background.paper',
                                      border: isWinner ? '2px solid' : '1px solid',
                                      borderColor: isWinner ? '#388e3c' : 'divider',
                                      opacity: isEliminated ? 0.6 : 1,
                                    }}
                                  >
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="body2" sx={{ fontWeight: 'bold', color: isWinner ? 'white' : 'text.primary' }}>
                                        {formatNameForDisplay(player.name)}
                                      </Typography>
                                      {isWinner && (
                                        <Chip 
                                          label="Winner" 
                                          size="small" 
                                          sx={{ 
                                            height: 20, 
                                            fontSize: '0.65rem',
                                            bgcolor: 'rgba(255, 255, 255, 0.2)',
                                            color: 'white',
                                            border: '1px solid rgba(255, 255, 255, 0.3)'
                                          }} 
                                        />
                                      )}
                                      {isEliminated && (
                                        <Chip label="Eliminated" size="small" color="error" sx={{ height: 20, fontSize: '0.65rem' }} />
                                      )}
                                    </Box>
                                    <Typography variant="body2" sx={{ fontWeight: 'bold', color: isEliminated ? 'error.main' : isWinner ? 'white' : 'primary.main' }}>
                                      {player.lives} {player.lives === 1 ? 'life' : 'lives'}
                                    </Typography>
                                  </Box>
                                );
                              })}
                            </Box>
                          ) : (
                            <Typography variant="body2" sx={{ color: 'text.secondary', py: 2, textAlign: 'center' }}>
                              No player data available
                            </Typography>
                          )}
                        </Box>
                      )}
                      
                      {/* Show action history */}
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color: 'text.primary', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                        Action History
                      </Typography>
                      {game.frameHistory.map((frame, index) => {
                        // Calculate time since previous frame
                        const previousTime = index === 0 ? game.startTime : game.frameHistory[index - 1].timestamp;
                        const timeSincePrevious = frame.timestamp.getTime() - previousTime.getTime();
                        const secondsSincePrevious = timeSincePrevious / 1000.0;

                        return (
                          <Box key={index} sx={{ mb: 1 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 1,
                                flexWrap: 'wrap',
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1 }}>
                                <Typography
                                  variant="body2"
                                  sx={{
                                    fontWeight: 'semiBold',
                                    color: 'text.primary',
                                  }}
                                >
                                  {formatNameForDisplay(frame.player)}
                                </Typography>
                                {frame.dishType && frame.dishType in DishTypeDisplayNames ? (
                                  <Chip
                                    label={DishTypeDisplayNames[frame.dishType]}
                                    size="small"
                                    sx={{
                                      height: 24,
                                      fontSize: '0.75rem',
                                      fontWeight: 'bold',
                                      bgcolor: frame.dishType === DishType.MISS ? 'error.light' : frame.dishType === DishType.TRICKSHOT_BLACK ? 'info.light' : 'secondary.light',
                                      color: frame.dishType === DishType.MISS ? 'error.contrastText' : frame.dishType === DishType.TRICKSHOT_BLACK ? 'info.contrastText' : 'secondary.contrastText',
                                    }}
                                  />
                                ) : (
                                  <Chip
                                    label="Ball Potted"
                                    size="small"
                                    sx={{
                                      height: 24,
                                      fontSize: '0.75rem',
                                      fontWeight: 'bold',
                                      bgcolor: 'secondary.light',
                                      color: 'secondary.contrastText',
                                    }}
                                  />
                                )}
                              </Box>
                              <Typography
                                variant="body2"
                                sx={{ fontSize: '0.875rem', opacity: 0.7, color: 'text.secondary' }}
                              >
                                +{secondsSincePrevious.toFixed(1)}s
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold" gutterBottom sx={{ color: 'text.primary', fontSize: { xs: '0.9rem', sm: '1rem' } }}>
                        Frame-by-Frame Breakdown
                      </Typography>
                      {game.frameHistory.map((frame, index) => {
                        // Calculate time since previous frame
                        const previousTime = index === 0 ? game.startTime : game.frameHistory[index - 1].timestamp;
                        const timeSincePrevious = frame.timestamp.getTime() - previousTime.getTime();
                        const secondsSincePrevious = timeSincePrevious / 1000.0;

                        return (
                          <Box key={index} sx={{ mb: 1.5 }}>
                            <Box
                              sx={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 1,
                                flexWrap: 'wrap',
                              }}
                            >
                              <Box sx={{ flex: 1 }}>
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 1,
                                    mb: 0.5,
                                  }}
                                >
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: 'semiBold',
                                      color: 'text.primary',
                                      minWidth: 80,
                                    }}
                                  >
                                    Frame {index + 1}:
                                  </Typography>
                                  {frame.dishType && frame.dishType in DishTypeDisplayNames ? (
                                    <>
                                      <Typography
                                        variant="body2"
                                        sx={{
                                          fontWeight: 'semiBold',
                                          color: 'primary.main',
                                        }}
                                      >
                                        {formatNameForDisplay(frame.player)}
                                      </Typography>
                                      <Chip
                                        label={DishTypeDisplayNames[frame.dishType]}
                                        size="small"
                                        sx={{
                                          height: 24,
                                          fontSize: '0.75rem',
                                          fontWeight: 'bold',
                                          bgcolor: 'secondary.light',
                                          color: 'secondary.contrastText',
                                        }}
                                      />
                                    </>
                                  ) : (
                                    <Typography variant="body2" sx={{ color: 'text.primary' }}>
                                      {formatNameForDisplay(frame.player)}{' '}
                                      {frame.scoreChange > 0 ? '+' : ''}
                                      {frame.scoreChange}
                                    </Typography>
                                  )}
                                </Box>
                                <Typography variant="body2" sx={{ fontSize: '0.875rem', color: 'text.secondary' }}>
                                  Score: {frame.playerOneScore} - {frame.playerTwoScore}
                                </Typography>
                              </Box>
                              <Typography
                                variant="body2"
                                sx={{ fontSize: '0.875rem', opacity: 0.7, color: 'text.secondary' }}
                              >
                                +{secondsSincePrevious.toFixed(1)}s
                              </Typography>
                            </Box>
                          </Box>
                        );
                      })}
                    </Box>
                  )}
                </Collapse>

                {game.frameHistory.length > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
                    <ExpandMoreIcon
                      sx={{
                        transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                        transition: 'transform 0.3s',
                      }}
                    />
                  </Box>
                )}
              </CardContent>
            </Card>
          );
        })}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onClose={() => setDeleteConfirmId(null)}>
        <DialogTitle>Delete Game?</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this game? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmId(null)}>Cancel</Button>
          <Button
            color="error"
            onClick={() => {
              if (deleteConfirmId) {
                onDeleteGame(deleteConfirmId);
                setDeleteConfirmId(null);
              }
            }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

