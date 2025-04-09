import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import useWebSocket from '../hooks/useWebSocket';

// Game types
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
  adjacentTo?: string[];
}

interface Player {
  id: string;
  name: string;
  score: number;
  birds: Bird[];
  isHost: boolean;
}

interface GameState {
  id: string;
  players: Player[];
  status: 'waiting' | 'playing' | 'finished';
  board: BoardTile[][];
  currentTurnPlayerId: string;
  round: number;
  maxRounds: number;
  startTime?: Date;
  endTime?: Date;
}

interface GameContextType {
  gameState: GameState | null;
  playerId: string | null;
  playerName: string | null;
  isHost: boolean;
  isMyTurn: boolean;
  connected: boolean;
  connecting: boolean;
  demoMode: boolean;
  createGame: (playerName: string) => void;
  joinGame: (gameId: string, playerName: string) => void;
  startGame: () => void;
  leaveGame: () => void;
  placeBird: (birdId: string, position: [number, number]) => void;
  getPlayerBirds: () => void;
  refreshGameState: () => void;
}

const GameContext = createContext<GameContextType>({
  gameState: null,
  playerId: null,
  playerName: null,
  isHost: false,
  isMyTurn: false,
  connected: false,
  connecting: false,
  demoMode: false,
  createGame: () => {},
  joinGame: () => {},
  startGame: () => {},
  leaveGame: () => {},
  placeBird: () => {},
  getPlayerBirds: () => {},
  refreshGameState: () => {}
});

export const useGame = () => useContext(GameContext);

interface GameProviderProps {
  children: ReactNode;
}

export const GameProvider: React.FC<GameProviderProps> = ({ children }) => {
  // Dynamically determine WebSocket URL based on current hostname
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const wsHost = process.env.NODE_ENV === 'development' ? 'localhost:3001' : window.location.host;
  const wsUrl = `${wsProtocol}//${wsHost}`;
  
  const [serverAvailable, setServerAvailable] = useState(false);
  
  // Make an initial HTTP request to the server to verify it's up
  React.useEffect(() => {
    console.log("Checking server health with HTTP request...");
    console.log(`Current environment: ${process.env.NODE_ENV}`);
    console.log(`Using WebSocket URL: ${wsUrl}`);
    
    // Create a timestamp to bypass cache
    const timestamp = new Date().getTime();
    
    // Determine the health check URL
    const httpProtocol = window.location.protocol;
    const healthHost = process.env.NODE_ENV === 'development' ? 'localhost:3001' : window.location.host;
    const healthUrl = `${httpProtocol}//${healthHost}/health?t=${timestamp}`;
    
    console.log(`Checking server health at: ${healthUrl}`);
    
    // Make the HTTP request with fetch
    fetch(healthUrl, {
      method: 'GET',
      mode: 'cors'
    })
      .then(response => {
        console.log("Health check response status:", response.status);
        if (response.ok) {
          setServerAvailable(true);
        }
        return response.json();
      })
      .then(data => {
        console.log("Server is up and responding:", data);
      })
      .catch(error => {
        console.error("Error connecting to server:", error);
        setServerAvailable(false);
      });
  }, [wsUrl]);
  
  console.log(`Using WebSocket URL: ${wsUrl}`);
  console.log(`Browser location: ${window.location.hostname}:${window.location.port}`);
  
  // Only attempt to use WebSocket if server is available or we're in development mode
  const { sendMessage, lastMessage, connected, connecting } = useWebSocket(wsUrl);
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(false);
  
  // Force into demo mode immediately for testing - REMOVE THIS LATER
  useEffect(() => {
    console.log("TEST: FORCING DEMO MODE IMMEDIATELY");
    setDemoMode(true);
    
    // Create a demo game state if none exists
    if (!gameState) {
      console.log("TEST: Creating forced demo game state");
      const demoGameState: GameState = createDemoGameState();
      setGameState(demoGameState);
      
      // Generate a demo player ID
      const demoPlayerId = `demo-${Math.random().toString(36).substring(2, 9)}`;
      setPlayerId(demoPlayerId);
    }
  }, []);
  
  // Set up demo mode if connection fails after some attempts or immediately in development
  useEffect(() => {
    // Skip this effect if we're already in demo mode
    if (demoMode) return;
    
    // Immediately activate demo mode if we're trying to connect but not connected yet
    if (connecting && !connected) {
      console.log("Connection in progress, activating provisional demo mode");
      setDemoMode(true);
      
      // Create a demo game state if none exists
      if (!gameState) {
        console.log("Creating temporary demo game state while connecting");
        const demoGameState: GameState = createDemoGameState();
        setGameState(demoGameState);
        
        // Generate a demo player ID
        const demoPlayerId = `demo-${Math.random().toString(36).substring(2, 9)}`;
        setPlayerId(demoPlayerId);
      }
    }
    // Officially set demo mode if connection attempts failed 
    else if (!connected && !connecting && !gameState) {
      console.log("Connection attempts failed, activating permanent demo mode");
      setDemoMode(true);
      
      // Create a demo game state
      console.log("Creating permanent demo game state");
      const demoGameState: GameState = createDemoGameState();
      setGameState(demoGameState);
      
      // Generate a demo player ID
      const demoPlayerId = `demo-${Math.random().toString(36).substring(2, 9)}`;
      setPlayerId(demoPlayerId);
    }
  }, [connected, connecting, demoMode, gameState]);
  
  // Helper function to create a demo game state
  const createDemoGameState = (): GameState => {
    const demoId = `DEMO${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    
    // Create a demo board
    const board: BoardTile[][] = [];
    const terrainTypes: TerrainType[] = ['forest', 'water', 'mountain', 'grassland', 'desert'];
    
    for (let row = 0; row < 8; row++) {
      const boardRow: BoardTile[] = [];
      for (let col = 0; col < 8; col++) {
        const terrain = terrainTypes[Math.floor(Math.random() * terrainTypes.length)];
        boardRow.push({
          row,
          col,
          terrain,
          adjacentTo: []
        });
      }
      board.push(boardRow);
    }
    
    return {
      id: demoId,
      players: [
        {
          id: 'demo-player-1',
          name: playerName || 'You',
          score: 0,
          birds: generateDemoBirds(5),
          isHost: true
        },
        {
          id: 'demo-player-2',
          name: 'AI Player',
          score: 0,
          birds: generateDemoBirds(5),
          isHost: false
        }
      ],
      status: 'waiting',
      board,
      currentTurnPlayerId: 'demo-player-1',
      round: 1,
      maxRounds: 10
    };
  };
  
  // Generate demo birds for a player
  const generateDemoBirds = (count: number): Bird[] => {
    const birdTypes: BirdType[] = ['blue', 'red', 'yellow', 'green', 'purple'];
    const birds: Bird[] = [];
    
    for (let i = 0; i < count; i++) {
      birds.push({
        id: `demo-bird-${Math.random().toString(36).substring(2, 9)}`,
        type: birdTypes[Math.floor(Math.random() * birdTypes.length)]
      });
    }
    
    return birds;
  };

  // Process incoming WebSocket messages
  React.useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage);
        
        switch (data.type) {
          case 'CONNECTION_ESTABLISHED':
            setPlayerId(data.payload.clientId);
            // If we get a connection while in demo mode, clear the demo mode
            if (demoMode) {
              console.log("Connection established while in demo mode, switching to real connection");
              setDemoMode(false);
            }
            break;
            
          case 'GAME_CREATED':
            setGameState(data.payload.gameState);
            // If we've successfully created a game, ensure we're not in demo mode
            if (demoMode) {
              console.log("Game created while in demo mode, switching to real game");
              setDemoMode(false);
            }
            break;
            
          case 'PLAYER_JOINED':
          case 'PLAYER_LEFT':
          case 'GAME_STARTED':
          case 'BIRD_PLACED':
          case 'GAME_STATE':
            setGameState(data.payload.gameState);
            // If we get any game state update while in demo mode, exit demo mode
            if (demoMode) {
              console.log("Game state updated while in demo mode, switching to real game");
              setDemoMode(false);
            }
            break;
            
          case 'PLAYER_BIRDS':
            // Update player birds in the game state
            if (gameState && playerId) {
              const updatedPlayers = gameState.players.map(player => {
                if (player.id === playerId) {
                  return { ...player, birds: data.payload.birds };
                }
                return player;
              });
              
              setGameState({
                ...gameState,
                players: updatedPlayers
              });
              
              // If we get bird data while in demo mode, exit demo mode
              if (demoMode) {
                console.log("Got player birds while in demo mode, switching to real game");
                setDemoMode(false);
              }
            }
            break;
            
          case 'ERROR':
            console.error('Game error:', data.payload.message);
            break;
            
          default:
            console.log('Unknown message type:', data.type);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    }
  }, [lastMessage, gameState, playerId, demoMode]);

  const createGame = useCallback((name: string) => {
    setPlayerName(name);
    
    // If we're in demo mode or not connected, create a demo game
    if (demoMode || !connected) {
      console.log('Creating demo game with name:', name);
      
      // Create a new demo game state
      const demoGameState = createDemoGameState();
      
      // Update the player name in the game state
      demoGameState.players[0].name = name;
      
      // Set the game state
      setGameState(demoGameState);
      setPlayerId('demo-player-1'); // In demo mode, always assign the first player
      
      return;
    }
    
    // Otherwise, send the real WebSocket message
    console.log('Creating real game with name:', name);
    sendMessage({
      type: 'CREATE_GAME',
      payload: { username: name }
    });
  }, [sendMessage, demoMode, connected]);

  const joinGame = useCallback((gameId: string, name: string) => {
    setPlayerName(name);
    
    // If we're in demo mode or not connected, join a demo game
    if (demoMode || !connected) {
      console.log('Joining demo game with ID:', gameId, 'and name:', name);
      
      // Create a new demo game state with the specific game ID
      const demoGameState = createDemoGameState();
      demoGameState.id = gameId;
      
      // Update the player name in the game state
      demoGameState.players[0].name = name;
      
      // Set the game state
      setGameState(demoGameState);
      setPlayerId('demo-player-1'); // In demo mode, always assign the first player
      
      return;
    }
    
    // Otherwise, send the real WebSocket message
    console.log('Joining real game with ID:', gameId, 'and name:', name);
    sendMessage({
      type: 'JOIN_GAME',
      payload: { gameId, username: name }
    });
  }, [sendMessage, demoMode, connected]);

  const startGame = useCallback(() => {
    if (!gameState) return;
    
    // If we're in demo mode or not connected, start the demo game
    if (demoMode || !connected) {
      console.log('Starting demo game');
      
      // Update the game status
      setGameState(prevState => {
        if (!prevState) return null;
        
        return {
          ...prevState,
          status: 'playing'
        };
      });
      
      return;
    }
    
    // Otherwise, send the real WebSocket message
    console.log('Starting real game with ID:', gameState.id);
    sendMessage({
      type: 'START_GAME',
      payload: { gameId: gameState.id }
    });
  }, [gameState, sendMessage, demoMode, connected]);

  const leaveGame = useCallback(() => {
    // If we're in demo mode or not connected, just reset the local state
    if (demoMode || !connected) {
      console.log('Leaving demo game');
      setGameState(null);
      return;
    }
    
    // Otherwise, send the real WebSocket message
    console.log('Leaving real game');
    sendMessage({
      type: 'LEAVE_GAME',
      payload: {}
    });
    setGameState(null);
  }, [sendMessage, demoMode, connected]);

  const placeBird = useCallback((birdId: string, position: [number, number]) => {
    if (!gameState) return;
    
    // If we're in demo mode or not connected, place the bird locally
    if (demoMode || !connected) {
      console.log('Placing bird in demo game:', { birdId, position });
      
      // Update the game state to place the bird on the board
      setGameState(prevState => {
        if (!prevState) return null;
        
        // Find the bird in the current player's birds
        const currentPlayer = prevState.players.find(p => p.id === playerId);
        if (!currentPlayer) return prevState;
        
        const bird = currentPlayer.birds.find(b => b.id === birdId);
        if (!bird) return prevState;
        
        // Clone the bird with the position
        const updatedBird = { ...bird, position };
        
        // Update the board
        const updatedBoard = JSON.parse(JSON.stringify(prevState.board));
        const [row, col] = position;
        if (updatedBoard[row] && updatedBoard[row][col]) {
          updatedBoard[row][col].bird = updatedBird;
        }
        
        // Update the player's birds (remove the placed bird)
        const updatedPlayers = prevState.players.map(player => {
          if (player.id === playerId) {
            return {
              ...player,
              birds: player.birds.filter(b => b.id !== birdId),
              score: player.score + 1 // Simple scoring for demo
            };
          }
          return player;
        });
        
        // Update turn to the next player
        const currentPlayerIndex = prevState.players.findIndex(p => p.id === playerId);
        const nextPlayerIndex = (currentPlayerIndex + 1) % prevState.players.length;
        const nextPlayerId = prevState.players[nextPlayerIndex].id;
        
        return {
          ...prevState,
          board: updatedBoard,
          players: updatedPlayers,
          currentTurnPlayerId: nextPlayerId
        };
      });
      
      return;
    }
    
    // Otherwise, send the real WebSocket message
    console.log('Placing bird in real game:', { birdId, position });
    sendMessage({
      type: 'GAME_ACTION',
      payload: {
        action: 'PLACE_BIRD',
        birdId,
        position
      }
    });
  }, [gameState, sendMessage, demoMode, connected, playerId]);

  const getPlayerBirds = useCallback(() => {
    if (!gameState) return;
    
    // If we're in demo mode or not connected, use the birds already in the game state
    if (demoMode || !connected) {
      console.log('Getting player birds in demo game');
      // In demo mode, birds are already in the game state
      return;
    }
    
    // Otherwise, send the real WebSocket message
    console.log('Getting player birds in real game');
    sendMessage({
      type: 'GAME_ACTION',
      payload: {
        action: 'GET_PLAYER_BIRDS'
      }
    });
  }, [gameState, sendMessage, demoMode, connected]);

  const refreshGameState = useCallback(() => {
    if (!gameState) return;
    
    // If we're in demo mode or not connected, do nothing (state is already local)
    if (demoMode || !connected) {
      console.log('Refreshing game state in demo game (no-op)');
      return;
    }
    
    // Otherwise, send the real WebSocket message
    console.log('Refreshing game state in real game');
    sendMessage({
      type: 'GAME_ACTION',
      payload: {
        action: 'GET_GAME_STATE'
      }
    });
  }, [gameState, sendMessage, demoMode, connected]);

  // Determine if the current player is the host
  const isHost = React.useMemo(() => {
    if (!gameState || !playerId) return false;
    const player = gameState.players.find(p => p.id === playerId);
    return player ? player.isHost : false;
  }, [gameState, playerId]);

  // Determine if it's the current player's turn
  const isMyTurn = React.useMemo(() => {
    if (!gameState || !playerId) return false;
    return gameState.currentTurnPlayerId === playerId;
  }, [gameState, playerId]);

  return (
    <GameContext.Provider
      value={{
        gameState,
        playerId,
        playerName,
        isHost,
        isMyTurn,
        connected,
        connecting,
        createGame,
        joinGame,
        startGame,
        leaveGame,
        placeBird,
        getPlayerBirds,
        refreshGameState,
        demoMode
      }}
    >
      {children}
    </GameContext.Provider>
  );
};