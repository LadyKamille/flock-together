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
      display: 'flex', 
      flexDirection: 'row', 
      width: '100%', 
      maxWidth: '100%', 
      gap: '20px',
      margin: '0 auto',
      height: '100vh', // Full viewport height
      alignItems: 'center', // Center vertically
      justifyContent: 'center', // Center horizontally
      padding: '20px'
    }}>
      {/* Left side - Lobby - Smaller and fixed width */}
      <div className="lobby-content" style={{
        flex: '0 0 280px', // Fixed width of 280px
        border: '1px solid #ccc', 
        padding: '15px',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        backgroundColor: '#fff',
        height: 'auto',
        maxHeight: '80vh', // Limit height
        overflowY: 'auto' // Allow scrolling if needed
      }}>
        <h2 style={{margin: '0 0 15px 0', fontSize: '1.5rem', textAlign: 'center'}}>Game Lobby</h2>
        
        {/* Game ID section - Compact */}
        <div className="game-id-section" style={{marginBottom: '15px'}}>
          <h3 style={{margin: '0 0 5px 0', fontSize: '1.1rem'}}>Game ID</h3>
          <div className="game-id-container" style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
            <span className="game-id" style={{
              fontSize: '1.1rem', 
              fontWeight: 'bold', 
              padding: '5px 10px', 
              backgroundColor: '#f5f5f5', 
              borderRadius: '4px',
              flex: '1'
            }}>{gameId}</span>
            <button className="copy-button" onClick={copyGameId} style={{
              backgroundColor: '#3498db',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '0.8rem'
            }}>
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
        
        {/* Message about demo mode - Compact */}
        <div className="waiting-message demo" style={{
          margin: '15px 0', 
          padding: '10px', 
          backgroundColor: '#fdebd0', 
          color: '#d35400', 
          borderRadius: '5px',
          fontSize: '0.9rem',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
        }}>
          <p style={{margin: '0 0 5px 0'}}><strong>Demo Mode Active</strong></p>
          <p style={{margin: '0 0 5px 0'}}>Test the gameplay in this preview.</p>
          <p style={{margin: '0'}}>Click "Play Demo" to start!</p>
        </div>
        
        {/* Continue button - Compact */}
        <div className="start-game-section" style={{textAlign: 'center', marginTop: '15px'}}>
          <button 
            className="start-game-button"
            onClick={handleStartGame}
            style={{
              backgroundColor: '#2ecc71',
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
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#27ae60'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2ecc71'}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Play Demo
          </button>
        </div>
      </div>
      
      {/* Right side - Game Preview - Taking all remaining width */}
      <div className="game-preview" style={{
        flex: '1', 
        border: '1px solid #ddd', 
        padding: '15px', 
        backgroundColor: '#f8f9fa',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        display: 'flex',
        flexDirection: 'column',
        height: '80vh', // Fixed height
        justifyContent: 'center'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '10px'
        }}>
          <h3 style={{margin: '0', fontSize: '1.2rem'}}>Game Preview</h3>
          <div style={{
            backgroundColor: '#e1f5fe',
            color: '#0277bd',
            padding: '5px 10px',
            borderRadius: '5px',
            fontSize: '0.8rem',
            borderLeft: '3px solid #0277bd'
          }}>
            Click "Play Demo" to start playing!
          </div>
        </div>
        <div style={{
          border: '1px solid #ddd', 
          borderRadius: '8px', 
          overflow: 'hidden',
          flex: '1',
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