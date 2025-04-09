import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import GameBoard from './GameBoard';
import '../styles/GameLobby.css';
import '../styles/GameBoard.css'; // Import for exit-button class

interface GameLobbyProps {
  onStartGame: () => void;
  onExitLobby?: () => void; // Add callback for returning to home screen
  gameId?: string;
  playerName?: string;
}

const GameLobby: React.FC<GameLobbyProps> = ({ onStartGame, onExitLobby, gameId: propGameId, playerName: propPlayerName }) => {
  // Need to import React
  const { useEffect } = React;
  const { gameState, playerId, playerName, startGame, isHost, connected, connecting, demoMode } = useGame();
  const [copied, setCopied] = useState(false);
  
  // Add debug logs for connection status in the lobby
  useEffect(() => {
    console.log('GameLobby - Connection status:', { connected, connecting, demoMode });
    console.log('GameLobby - Game state:', gameState);
  }, [connected, connecting, demoMode, gameState]);
  
  // Get the game ID from props or from the game state
  const gameId = propGameId || gameState?.id || 'DEMO123';
  
  // Get the player name from props or from context
  const displayName = propPlayerName || playerName || 'Player';
  
  // Copy the game ID to clipboard
  const copyGameId = () => {
    navigator.clipboard.writeText(gameId);
    setCopied(true);
    
    // Reset the copied state after 2 seconds
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Handle start game button click
  const handleStartGame = () => {
    startGame();
    onStartGame();
  };
  
  // Show waiting message if waiting for players
  const renderWaitingMessage = () => {
    // Force a demo message to appear for testing purposes
    return (
      <div className="waiting-message demo">
        <p><strong>Demo Mode Active</strong></p>
        <p>You can explore the game interface and test the gameplay.</p>
        <p>Press "Continue to Game Demo" to start playing.</p>
      </div>
    );
  };
  
  // Show game preview - will be hidden if no game state
  const [showGamePreview, setShowGamePreview] = useState(false);
  
  // Update preview visibility when game state changes
  useEffect(() => {
    // Show preview when there's a game state
    setShowGamePreview(!!gameState);
    console.log("GameLobby - Game state update:", { 
      gameId: gameState?.id,
      playerCount: gameState?.players?.length,
      showPreview: !!gameState 
    });
  }, [gameState]);

  return (
    <div className="game-lobby with-preview" style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(280px, 30%) 1fr', // First column 30% with min width of 280px
      gridTemplateRows: 'minmax(0, 1fr) minmax(0, 1fr) auto', // Two flexible rows and one auto-sized row
      gap: '20px', // Uniform gap between grid items
      width: '100%',
      maxWidth: '100%',
      height: 'calc(100vh - 40px)', // Full viewport height minus some space for potential status bars
      padding: '20px',
      margin: '0 auto',
      overflow: 'hidden'
    }}>
      {/* Top-left: Game Lobby */}
      <div className="lobby-content" style={{
        gridColumn: '1',
        gridRow: '1',
        border: '1px solid #ccc', 
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
        overflowY: 'auto', // Allow scrolling if content overflows
        display: 'flex',
        flexDirection: 'column',
        minHeight: '0', // Prevent grid content from overflowing
        boxSizing: 'border-box', // Include padding in width calculation
      }}>
        <h2 style={{margin: '0', fontSize: '1.5rem', textAlign: 'center'}}>Game Lobby</h2>
        
        {/* Game ID section - Compact */}
        <div className="game-id-section">
          <h3 style={{margin: '0 0 5px 0', fontSize: '1.1rem'}}>Game ID</h3>
          <div className="game-id-container" style={{
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px'
          }}>
            <span className="game-id" style={{
              fontSize: '1.1rem', 
              fontWeight: 'bold',
              backgroundColor: '#f5f5f5', 
              borderRadius: '4px',
              flex: '1',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>{gameId}</span>
            <button className="copy-button" onClick={copyGameId} style={{
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              whiteSpace: 'nowrap'
            }}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        
        {/* Players and game status */}
        <div className="player-list" style={{
          margin: '10px 0', 
          padding: '10px', 
          backgroundColor: '#f8f9fa', 
          borderRadius: '5px',
          fontSize: '0.9rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{margin: '0 0 10px 0', fontSize: '1.1rem'}}>Players</h3>
          
          {/* Current player */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '5px 0',
            borderBottom: '1px solid #eee'
          }}>
            <span style={{
              backgroundColor: '#2e7d32',
              color: 'white',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.8rem',
              fontWeight: 'bold'
            }}>
              {displayName.charAt(0).toUpperCase()}
            </span>
            <span style={{fontWeight: 'bold'}}>{displayName} (You)</span>
            <span style={{
              marginLeft: 'auto',
              backgroundColor: '#e8f5e9',
              color: '#2e7d32',
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '0.75rem'
            }}>
              {isHost ? 'Host' : 'Player'}
            </span>
          </div>
          
          {/* Other players */}
          {gameState?.players?.filter(p => p.id !== playerId).map((player, index) => (
            <div key={player.id} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '5px 0',
              borderBottom: index < gameState.players.length - 2 ? '1px solid #eee' : 'none'
            }}>
              <span style={{
                backgroundColor: '#3498db',
                color: 'white',
                borderRadius: '50%',
                width: '24px',
                height: '24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.8rem',
                fontWeight: 'bold'
              }}>
                {player.name.charAt(0).toUpperCase()}
              </span>
              <span>{player.name}</span>
              {player.isHost && (
                <span style={{
                  marginLeft: 'auto',
                  backgroundColor: '#e8f5e9',
                  color: '#2e7d32',
                  padding: '2px 6px',
                  borderRadius: '4px',
                  fontSize: '0.75rem'
                }}>
                  Host
                </span>
              )}
            </div>
          ))}
          
          {/* Message about game status */}
          {gameState?.players && gameState.players.length < 2 ? (
            <div style={{
              margin: '10px 0 0 0',
              padding: '8px',
              backgroundColor: '#e8f5e9',
              color: '#2e7d32',
              borderRadius: '5px',
              fontSize: '0.85rem'
            }}>
              <p style={{margin: '0 0 5px 0'}}><strong>Waiting for players to join</strong></p>
              <p style={{margin: '0'}}>Share your Game ID for others to join, or start a solo game.</p>
            </div>
          ) : (
            <div style={{
              margin: '10px 0 0 0',
              padding: '8px',
              backgroundColor: '#e3f2fd',
              color: '#1565c0',
              borderRadius: '5px',
              fontSize: '0.85rem'
            }}>
              <p style={{margin: '0'}}><strong>All players are ready!</strong> You can start the game.</p>
            </div>
          )}
        </div>
        
        {/* Continue button - Compact */}
        <div className="start-game-section" style={{
          textAlign: 'center', 
          marginTop: 'auto', 
          paddingTop: '5px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          {/* Show different buttons based on if user is host or waiting */}
          {isHost ? (
            <button 
              className="start-game-button"
              onClick={handleStartGame}
              style={{
                backgroundColor: '#2e7d32',
                color: 'white',
                padding: '10px 20px',
                borderRadius: '5px',
                border: 'none',
                fontSize: '1rem',
                cursor: 'pointer',
                width: '100%',
                boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
                transition: 'transform 0.1s ease, background-color 0.2s ease'
              }}
              onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1b5e20'}
              onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2e7d32'}
              onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
              onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              {gameState?.players && gameState.players.length > 1 ? 'Start Game' : 'Start Solo Game'}
            </button>
          ) : (
            <div style={{
              backgroundColor: '#f5f5f5',
              color: '#666',
              padding: '10px 20px',
              borderRadius: '5px',
              fontSize: '1rem',
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 2px 5px rgba(0,0,0,0.05)',
            }}>
              Waiting for host to start...
            </div>
          )}
          
        </div>
      </div>
      
      {/* Bottom-left: Game Instructions */}
      <div style={{
        gridColumn: '1',
        gridRow: '2',
        border: '1px solid #ccc',
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
        overflowY: 'auto', // Allow scrolling if content overflows
        minHeight: '0', // Prevent grid content from overflowing
        boxSizing: 'border-box', // Include padding in width calculation
      }}>
        <h3 style={{margin: '0 0 10px 0', fontSize: '1.2rem', textAlign: 'center', color: '#2c3e50'}}>How to Play</h3>
        
        <div style={{fontSize: '0.9rem', lineHeight: '1.4'}}>
          <h4 style={{margin: '10px 0 5px 0', color: '#2e7d32'}}>Game Objective</h4>
          <p style={{margin: '0 0 8px 0'}}>
            Create flocks of birds on the game board to score points by placing birds on matching terrain types.
          </p>
          
          <h4 style={{margin: '10px 0 5px 0', color: '#2e7d32'}}>Game Setup</h4>
          <p style={{margin: '0 0 8px 0'}}>
            Each player starts with 5 birds in their hand. The board has various terrain types 
            (forest, water, mountain, grassland, desert).
          </p>
          
          <h4 style={{margin: '10px 0 5px 0', color: '#2e7d32'}}>Taking a Turn</h4>
          <ol style={{margin: '0 0 8px 0', paddingLeft: '20px'}}>
            <li style={{marginBottom: '3px'}}>Select a bird from your hand</li>
            <li style={{marginBottom: '3px'}}>Place it on an empty board spot</li>
            <li style={{marginBottom: '3px'}}>Score points based on placement</li>
          </ol>
          
          <h4 style={{margin: '10px 0 5px 0', color: '#2e7d32'}}>Scoring Points</h4>
          <ul style={{margin: '0 0 8px 0', paddingLeft: '20px'}}>
            <li style={{marginBottom: '3px'}}>Placing birds on preferred terrain</li>
            <li style={{marginBottom: '3px'}}>Creating flocks (adjacent matching birds)</li>
            <li style={{marginBottom: '3px'}}>Completing terrain objectives</li>
          </ul>
          
          <h4 style={{margin: '10px 0 5px 0', color: '#2e7d32'}}>Game End</h4>
          <p style={{margin: '0 0 8px 0'}}>
            Game ends after 10 rounds or when all birds are placed. 
            Highest score wins!
          </p>
          
          <h4 style={{margin: '10px 0 5px 0', color: '#2e7d32'}}>Solo Play</h4>
          <p style={{margin: '0'}}>
            Compete against "Feathered Friend" by making strategic bird placements.
          </p>
        </div>
      </div>
      
      {/* Exit button in third row */}
      {onExitLobby && (
        <div style={{
          gridColumn: '1',
          gridRow: '3',
          padding: '0',
        }}>
          <button 
            className="exit-button"
            onClick={onExitLobby}
            style={{
              padding: '10px 20px',
              borderRadius: '5px',
              border: 'none',
              fontSize: '1rem',
              cursor: 'pointer',
              width: '100%',
              boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
              transition: 'transform 0.1s ease, background-color 0.2s ease'
            }}
          >
            Exit to Main Menu
          </button>
        </div>
      )}
      
      {/* Right side - Game Preview - spans all rows */}
      <div className="game-preview" style={{
        gridColumn: '2',
        gridRow: '1 / span 3', // Spans all three rows
        border: '1px solid #ddd', 
        padding: '15px', 
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        minHeight: '0', // Prevent grid content from overflowing
        boxSizing: 'border-box' // Include padding in width calculation
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <h3 style={{margin: '0', fontSize: '1.2rem'}}>Game Preview</h3>
          <div style={{
            backgroundColor: gameState?.players && gameState.players.length > 1 ? '#e3f2fd' : '#e8f5e9',
            color: gameState?.players && gameState.players.length > 1 ? '#1565c0' : '#2e7d32',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '0.8rem',
            borderLeft: `3px solid ${gameState?.players && gameState.players.length > 1 ? '#1565c0' : '#2e7d32'}`
          }}>
            {gameState?.players && gameState.players.length > 1 
              ? `${gameState.players.length} players ready!` 
              : 'Preview of the game board'}
          </div>
        </div>
        <div style={{
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          overflow: 'hidden',
          flex: '1', // Takes all remaining vertical space
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#fff'
        }}>
          <GameBoard previewMode={true} />
        </div>
      </div>
    </div>
  );
};

export default GameLobby;
