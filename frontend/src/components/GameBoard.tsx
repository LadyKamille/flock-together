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

interface GameBoardProps {
  onReturnToLobby?: () => void;
}

const GameBoard: React.FC<GameBoardProps> = ({ onReturnToLobby }) => {
  console.log("GameBoard component is rendering!");
  
  const { gameState, playerId, placeBird, isMyTurn, demoMode } = useGame();
  const [selectedBird, setSelectedBird] = useState<Bird | null>(null);
  const [hoveredTile, setHoveredTile] = useState<[number, number] | null>(null);
  
  // Debug log for game board
  useEffect(() => {
    console.log("GameBoard mounted with state:", { gameState, playerId, demoMode });
  }, []);
  
  // Get the current player's birds (from their hand)
  const currentPlayer = gameState?.players?.find(p => p.id === playerId);
  const playerBirds = currentPlayer?.birds || [];
  
  // Get the board from game state, or create a demo board if not connected
  const board = gameState?.board || generateDemoBoard();

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
    <div className="game-container" style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '0',
      maxHeight: '100%',
      overflow: 'hidden',
      position: 'relative'
    }}>
      {/* Back to Lobby button */}
      {onReturnToLobby && (
        <button 
          onClick={onReturnToLobby}
          style={{
            position: 'absolute',
            top: '10px',
            left: '10px',
            backgroundColor: '#2e7d32',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            padding: '8px 12px',
            fontSize: '0.9rem',
            cursor: 'pointer',
            zIndex: 10,
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
          }}
        >
          <span style={{ fontSize: '1.2rem' }}>←</span> Back to Lobby
        </button>
      )}
      
      <div style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        justifyContent: 'space-around',
        alignItems: 'center',
        gap: '10px'
      }}>
        {/* Game info on the left */}
        <div style={{
          flex: '0 0 20%', 
          fontSize: '0.85rem', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '10px'
        }}>
          {renderGameInfo()}
        </div>
        
        {/* Board in the center */}
        <div className="game-board" style={{
          flex: '0 0 auto',
          width: 'min(50vh, 50vw)',
          height: 'min(50vh, 50vw)',
          maxWidth: '500px',
          maxHeight: '500px',
          aspectRatio: '1/1',
          display: 'grid',
          gridTemplateRows: 'repeat(8, 1fr)',
          gap: '2px',
          background: '#333',
          padding: '2px',
          borderRadius: '4px',
          boxShadow: '0 0 15px rgba(0,0,0,0.2)'
        }}>
          {board.map((row, rowIndex) => (
            <div key={rowIndex} className="board-row" style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(8, 1fr)',
              gap: '2px',
              height: '100%'
            }}>
              {row.map(tile => renderTile(tile))}
            </div>
          ))}
        </div>
        
        {/* Bird hand on the right */}
        <div style={{
          flex: '0 0 20%', 
          fontSize: '0.85rem', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center',
          padding: '10px'
        }}>
          {renderBirdHand()}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;