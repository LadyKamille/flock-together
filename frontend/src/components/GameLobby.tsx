import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import '../styles/GameLobby.css';

interface GameLobbyProps {
  onStartGame: () => void;
}

const GameLobby: React.FC<GameLobbyProps> = ({ onStartGame }) => {
  const { gameState, playerId, startGame, isHost } = useGame();
  const [copied, setCopied] = useState(false);
  
  // Get the game ID from the game state
  const gameId = gameState?.id || '';
  
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
    const playerCount = gameState?.players.length || 0;
    
    if (playerCount < 2) {
      return (
        <div className="waiting-message">
          Waiting for more players to join...
          <p>At least 2 players are required to start the game.</p>
        </div>
      );
    }
    
    return null;
  };
  
  return (
    <div className="game-lobby">
      <h2>Game Lobby</h2>
      
      <div className="game-id-section">
        <h3>Game ID</h3>
        <div className="game-id-container">
          <span className="game-id">{gameId}</span>
          <button className="copy-button" onClick={copyGameId}>
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="share-instructions">Share this Game ID with friends to invite them to play</p>
      </div>
      
      <div className="players-section">
        <h3>Players ({gameState?.players.length || 0})</h3>
        <ul className="player-list">
          {gameState?.players.map(player => (
            <li key={player.id} className={player.id === playerId ? 'current-player' : ''}>
              {player.name} {player.isHost && '(Host)'} {player.id === playerId && '(You)'}
            </li>
          ))}
        </ul>
      </div>
      
      {renderWaitingMessage()}
      
      {isHost && (
        <div className="start-game-section">
          <button 
            className="start-game-button"
            onClick={handleStartGame}
            disabled={gameState?.players.length < 2}
          >
            Start Game
          </button>
        </div>
      )}
      
      {!isHost && (
        <div className="waiting-for-host">
          Waiting for the host to start the game...
        </div>
      )}
    </div>
  );
};

export default GameLobby;