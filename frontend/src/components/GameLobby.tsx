import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import GameBoard from './GameBoard';
import '../styles/GameLobby.css';

interface GameLobbyProps {
  onStartGame: () => void;
  gameId?: string;
  playerName?: string;
}

const GameLobby: React.FC<GameLobbyProps> = ({ onStartGame, gameId: propGameId, playerName: propPlayerName }) => {
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
  
  // If we're in demo mode, show a preview of the game board
  // Force this to true for immediate testing
  const [showDemoPreview, setShowDemoPreview] = useState(true);
  
  // Log demo mode status
  useEffect(() => {
    console.log("GameLobby - Demo mode status:", { demoMode, showDemoPreview });
  }, [demoMode, showDemoPreview]);
  
  // Force preview to show for testing
  useEffect(() => {
    console.log("FORCING PREVIEW TO SHOW");
    setShowDemoPreview(true);
  }, []);

  return (
    <div className="game-lobby with-preview" style={{
      display: 'grid',
      gridTemplateColumns: 'minmax(280px, 30%) 1fr', // First column 30% with min width of 280px
      gridTemplateRows: 'minmax(0, 1fr) minmax(0, 1fr)', // Two equal rows that can shrink if needed
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
        <h2 style={{margin: '0 0 15px 0', fontSize: '1.5rem', textAlign: 'center'}}>Game Lobby</h2>
        
        {/* Game ID section - Compact */}
        <div className="game-id-section" style={{marginBottom: '15px'}}>
          <h3 style={{margin: '0 0 5px 0', fontSize: '1.1rem'}}>Game ID</h3>
          <div className="game-id-container" style={{
            display: 'flex', 
            alignItems: 'center', 
            gap: '5px'
          }}>
            <span className="game-id" style={{
              fontSize: '1.1rem', 
              fontWeight: 'bold', 
              padding: '5px 10px', 
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
              padding: '5px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              whiteSpace: 'nowrap'
            }}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        
        {/* Message about solo play - Compact */}
        <div className="waiting-message demo" style={{
          margin: '10px 0', 
          padding: '10px', 
          backgroundColor: '#e8f5e9', 
          color: '#2e7d32', 
          borderRadius: '5px',
          fontSize: '0.9rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <p style={{margin: '0 0 5px 0'}}><strong>Solo Play Available</strong></p>
          <p style={{margin: '0 0 5px 0'}}>Try the gameplay in this preview.</p>
          <p style={{margin: '0'}}>Click "Start Solo Game" to begin!</p>
        </div>
        
        {/* Continue button - Compact */}
        <div className="start-game-section" style={{
          textAlign: 'center', 
          marginTop: 'auto', 
          paddingTop: '15px'
        }}>
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
            Start Solo Game
          </button>
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
      
      {/* Right side - Game Preview - spans both rows */}
      <div className="game-preview" style={{
        gridColumn: '2',
        gridRow: '1 / span 2', // Spans both rows
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
            backgroundColor: '#e8f5e9',
            color: '#2e7d32',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '0.8rem',
            borderLeft: '3px solid #2e7d32'
          }}>
            Click "Start Solo Game" to begin!
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
          <GameBoard />
        </div>
      </div>
    </div>
  );
};

export default GameLobby;