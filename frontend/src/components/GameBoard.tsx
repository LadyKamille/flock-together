import React, { useState, useEffect } from 'react';
import { useGame } from '../context/GameContext';
import '../styles/GameBoard.css';

// Define types for our game elements
type BirdType = 'blue' | 'red' | 'yellow' | 'green' | 'purple';
type TerrainType = 'forest' | 'water' | 'mountain' | 'grassland' | 'desert';

interface Bird {
  id: string;
  type: BirdType;
  position?: [number, number];
}

interface BoardTile {
  row: number;
  col: number;
  terrain: TerrainType;
  bird?: Bird;
}

const GameBoard: React.FC = () => {
  const { gameState, playerId, placeBird, isMyTurn } = useGame();
  const [selectedBird, setSelectedBird] = useState<Bird | null>(null);
  const [hoveredTile, setHoveredTile] = useState<[number, number] | null>(null);
  
  // Get the current player's birds (from their hand)
  const currentPlayer = gameState?.players.find(p => p.id === playerId);
  const playerBirds = currentPlayer?.birds || [];
  
  // Get the board from game state
  const board = gameState?.board || [];
  
  // Handle selecting a bird from the player's hand
  const handleSelectBird = (bird: Bird) => {
    setSelectedBird(bird);
  };
  
  // Handle placing a bird on the board
  const handleTileClick = (row: number, col: number) => {
    if (!isMyTurn || !selectedBird) return;
    
    // Check if the tile is already occupied
    if (board[row][col].bird) return;
    
    // Place the bird
    placeBird(selectedBird.id, [row, col]);
    
    // Deselect the bird
    setSelectedBird(null);
  };
  
  // Render a terrain tile with appropriate styling
  const renderTile = (tile: BoardTile) => {
    const { row, col, terrain, bird } = tile;
    const isHovered = hoveredTile && hoveredTile[0] === row && hoveredTile[1] === col;
    const isValidPlacement = isMyTurn && selectedBird && !bird;
    
    // Determine CSS classes
    const tileClasses = [
      'board-tile',
      `terrain-${terrain}`,
      isHovered && isValidPlacement ? 'valid-placement' : '',
      isHovered && !isValidPlacement ? 'invalid-placement' : '',
    ].filter(Boolean).join(' ');
    
    return (
      <div
        key={`${row}-${col}`}
        className={tileClasses}
        onClick={() => handleTileClick(row, col)}
        onMouseEnter={() => setHoveredTile([row, col])}
        onMouseLeave={() => setHoveredTile(null)}
      >
        {/* Show the bird if one is placed on this tile */}
        {bird && (
          <div className={`bird bird-${bird.type}`}>
            <span className="bird-icon">🦜</span>
          </div>
        )}
        
        {/* Show terrain type indicator */}
        <span className="terrain-indicator">
          {terrain === 'forest' && '🌲'}
          {terrain === 'water' && '💧'}
          {terrain === 'mountain' && '⛰️'}
          {terrain === 'grassland' && '🌿'}
          {terrain === 'desert' && '🏜️'}
        </span>
      </div>
    );
  };
  
  // Render the player's hand of birds
  const renderBirdHand = () => {
    return (
      <div className="bird-hand">
        <h3>Your Birds</h3>
        <div className="bird-list">
          {playerBirds.map(bird => (
            <div
              key={bird.id}
              className={`bird-card ${bird.type} ${selectedBird?.id === bird.id ? 'selected' : ''}`}
              onClick={() => handleSelectBird(bird)}
            >
              <span className="bird-icon">🦜</span>
              <span className="bird-type">{bird.type.charAt(0).toUpperCase() + bird.type.slice(1)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render game info (scores, turn indicator)
  const renderGameInfo = () => {
    return (
      <div className="game-info">
        <div className="turn-indicator">
          {isMyTurn ? (
            <div className="your-turn">Your Turn!</div>
          ) : (
            <div className="waiting">
              Waiting for {gameState?.players.find(p => p.id === gameState.currentTurnPlayerId)?.name}...
            </div>
          )}
        </div>
        
        <div className="scores">
          <h3>Scores</h3>
          <ul>
            {gameState?.players.map(player => (
              <li key={player.id} className={player.id === playerId ? 'current-player' : ''}>
                {player.name}: {player.score} {player.id === playerId && '(You)'}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="game-status">
          <p>Round: {gameState?.round} / {gameState?.maxRounds}</p>
        </div>
      </div>
    );
  };
  
  return (
    <div className="game-container">
      {renderGameInfo()}
      
      <div className="game-board">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="board-row">
            {row.map(tile => renderTile(tile))}
          </div>
        ))}
      </div>
      
      {renderBirdHand()}
    </div>
  );
};

export default GameBoard;