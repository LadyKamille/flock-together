import { useState, useEffect, FC } from 'react';
import { useGame, Player } from '../context/GameContext';
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
  previewMode?: boolean; // Added to indicate if shown in preview
}

const GameBoard: FC<GameBoardProps> = ({ onReturnToLobby, previewMode = false }) => {
  // Remove console.log that runs on every render
  
  const { gameState, playerId, placeBird, isMyTurn, demoMode } = useGame();
  const [selectedBird, setSelectedBird] = useState<Bird | null>(null);
  const [hoveredTile, setHoveredTile] = useState<[number, number] | null>(null);
  const [demoBoard, setDemoBoard] = useState<BoardTile[][]>([]);
  const [instructionsExpanded, setInstructionsExpanded] = useState<boolean>(false);
  
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

  const player1BirdEmojis = {
    blue: '🐦',
    red: '🦉',
    yellow: '🐤',
    green: '🦩',
    purple: '🦚'
  }

  const player2BirdEmojis = {
    blue: '🦅',
    red: '🦢',
    yellow: '🦆',
    green: '🦜',
    purple: '🦃'
  }
  
  // Get bird emoji based on player and bird type
  const getBirdEmoji = (bird: Bird) => {
    const emojis = playerId === gameState?.players?.[0].id ? player1BirdEmojis : player2BirdEmojis;

    return emojis[bird.type] || '🦤';
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
            <span className="bird-icon">{getBirdEmoji(bird)}</span>
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
              <span className="bird-icon">{getBirdEmoji(bird)}</span>
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
        id: `demo-hand-bird-${i}`, // Using this prefix to identify demo birds in the hand
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
  
  // Render game instructions
  const renderInstructions = () => {
    return (
      <div className={`game-instructions ${instructionsExpanded ? 'expanded' : 'collapsed'}`}>
        <div className="instructions-header" onClick={() => setInstructionsExpanded(!instructionsExpanded)}>
          <h3>Game Instructions</h3>
          <span className="toggle-icon">{instructionsExpanded ? '▼' : '▶'}</span>
        </div>
        
        {instructionsExpanded && (
          <div className="instructions-content">
            <h4>How to Play:</h4>
            <ol>
              <li><strong>Goal:</strong> Place birds strategically on the board to create flocks and score points.</li>
              <li><strong>Your Turn:</strong> When it's your turn, select a bird from your hand, then click on an empty tile to place it.</li>
              <li><strong>Terrain:</strong> Different terrains may affect bird placement and scoring (shown by emoji on each tile).</li>
              <li><strong>Bird Types:</strong> Each bird has a unique color that indicates its type. Different bird emojis are used for each player to help distinguish ownership.</li>
              <li><strong>Scoring:</strong> You score one point for each bird you place. In multiplayer mode, special combos may provide bonus points.</li>
            </ol>
            
            <h4>Bird Legend:</h4>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '15px' }}>
              <div><strong>Your birds:</strong> 🐦 (Blue), 🦩 (Red), 🐤 (Yellow), 🦚 (Green), 🦉 (Purple)</div>
              <div><strong>Opponent's birds:</strong> 🦅 (Blue), 🦢 (Red), 🦆 (Yellow), 🦜 (Green), 🦃 (Purple)</div>
            </div>
            
            <h4>Tips:</h4>
            <ul>
              <li>Try to place birds of the same color adjacent to each other for better flocking.</li>
              <li>Plan ahead to block your opponent's potential placements.</li>
              <li>Some terrains are better for certain bird types (more details coming in future updates).</li>
            </ul>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="game-container">
      {/* Back to Lobby button - Don't show in preview mode */}
      {!previewMode && onReturnToLobby && (
        <button 
          onClick={onReturnToLobby}
          className="back-button"
        >
          <span>←</span> Back to Lobby
        </button>
      )}
      
      {/* Game Instructions (collapsible) - Hide in preview */}
      {!previewMode && renderInstructions()}
      
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
