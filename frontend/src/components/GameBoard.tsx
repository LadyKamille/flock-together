import React, { useState, useEffect, FC } from 'react';
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

interface GameBoardProps {
  onReturnToLobby?: () => void;
}

const GameBoard: FC<GameBoardProps> = ({ onReturnToLobby }) => {
  // Remove console.log that runs on every render
  
  const { gameState, playerId, placeBird, isMyTurn, demoMode } = useGame();
  const [selectedBird, setSelectedBird] = useState<Bird | null>(null);
  const [hoveredTile, setHoveredTile] = useState<[number, number] | null>(null);
  const [demoBoard, setDemoBoard] = useState<BoardTile[][]>([]);
  
  // Create demo board only once on component mount
  useEffect(() => {
    // Only generate once when component mounts
    setDemoBoard(generateDemoBoard());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  // Get the current player's birds (from their hand)
  const currentPlayer = gameState?.players?.find(p => p.id === playerId);
  const playerBirds = currentPlayer?.birds || [];
  
  // Get the board from game state, or use the cached demo board
  const board = gameState?.board || demoBoard;

  // Generate a demo board if no game state is available
  function generateDemoBoard() {
    const demoBoard = [];
    const terrains: TerrainType[] = ['forest', 'water', 'mountain', 'grassland', 'desert'];
    
    for (let row = 0; row < 8; row++) {
      const boardRow = [];
      for (let col = 0; col < 8; col++) {
        // Generate random terrain
        const terrain = terrains[Math.floor(Math.random() * terrains.length)];
        
        // Randomly place some birds for demonstration
        let bird = undefined;
        if (Math.random() < 0.2) { // 20% chance for a bird
          const birdTypes: BirdType[] = ['blue', 'red', 'yellow', 'green', 'purple'];
          const birdType = birdTypes[Math.floor(Math.random() * birdTypes.length)];
          bird = {
            id: `demo-bird-${row}-${col}`,
            type: birdType,
            position: [row, col]
          };
        }
        
        boardRow.push({
          row,
          col,
          terrain,
          bird
        });
      }
      demoBoard.push(boardRow);
    }
    
    return demoBoard;
  }
  
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
    // If no birds in hand, generate demo birds
    const birdsToDisplay = playerBirds.length > 0 ? 
      playerBirds : 
      generateDemoBirds();

    return (
      <div className="bird-hand">
        <h3>Your Birds</h3>
        <div className="bird-list">
          {birdsToDisplay.map(bird => (
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

  // Generate demo birds for hand
  function generateDemoBirds() {
    const birdTypes: BirdType[] = ['blue', 'red', 'yellow', 'green', 'purple'];
    const demoBirds: Bird[] = [];
    
    for (let i = 0; i < 5; i++) {
      const birdType = birdTypes[Math.floor(Math.random() * birdTypes.length)];
      demoBirds.push({
        id: `demo-hand-bird-${i}`,
        type: birdType
      });
    }
    
    return demoBirds;
  }
  
  // Render game info (scores, turn indicator)
  const renderGameInfo = () => {
    // Get opponent player (if in solo mode)
    const opponentPlayer = gameState?.players?.find(p => p.id !== playerId);
    
    return (
      <div className="game-info">
        <div className="turn-indicator">
          {isMyTurn ? (
            <div className="your-turn">Your Turn!</div>
          ) : (
            <div className="waiting">
              {demoMode ? (
                <div style={{display: 'flex', alignItems: 'center', gap: '5px'}}>
                  <span>{opponentPlayer?.name || "Opponent"}</span>
                  <span className="thinking-dots">
                    <span>.</span><span>.</span><span>.</span>
                  </span>
                </div>
              ) : (
                `Waiting for ${gameState?.players?.find(p => p.id === gameState.currentTurnPlayerId)?.name || 'other player'}...`
              )}
            </div>
          )}
        </div>
        
        <div className="scores">
          <h3>Scores</h3>
          <ul>
            {gameState?.players?.map(player => (
              <li key={player.id} className={player.id === playerId ? 'current-player' : ''}>
                {player.name}: {player.score} {player.id === playerId && '(You)'}
              </li>
            ))}
          </ul>
        </div>
        
        <div className="game-status">
          <p>Round: {gameState?.round || 1} / {gameState?.maxRounds || 10}</p>
        </div>
      </div>
    );
  };
  
  return (
    <div className="game-container">
      {/* Back to Lobby button */}
      {onReturnToLobby && (
        <button 
          onClick={onReturnToLobby}
          className="back-button"
        >
          <span>←</span> Back to Lobby
        </button>
      )}
      
      <div className="game-layout">
        {/* Game info on the left */}
        <aside className="game-sidebar">
          {renderGameInfo()}
        </aside>
        
        {/* Board in the center */}
        <main className="game-board-container">
          <div className="game-board">
            {board && board.length > 0 && board.flat().map(tile => renderTile(tile))}
          </div>
        </main>
        
        {/* Bird hand on the right */}
        <aside className="game-sidebar">
          {renderBirdHand()}
        </aside>
      </div>
    </div>
  );
};

export default GameBoard;
