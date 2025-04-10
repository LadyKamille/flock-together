import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect, useMemo, FC } from 'react';
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

export interface Player {
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

export const GameProvider: FC<GameProviderProps> = ({ children }) => {
  // Dynamically determine WebSocket URL based on current hostname
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  console.log('VITE env', import.meta.env)
  const wsHost = import.meta.env.DEV ? 'localhost:3001' : window.location.host;
  const wsUrl = `${wsProtocol}//${wsHost}`;
  
  const [serverAvailable, setServerAvailable] = useState(false);
  
  // Make an initial HTTP request to the server to verify it's up
  useEffect(() => {
    console.log("Checking server health with HTTP request...");
    console.log(`Current environment: ${import.meta.env.DEV}`);
    console.log(`Using WebSocket URL: ${wsUrl}`);
    
    // Create a timestamp to bypass cache
    const timestamp = new Date().getTime();
    
    // Determine the health check URL
    const httpProtocol = window.location.protocol;
    const healthHost = import.meta.env.DEV ? 'localhost:3001' : window.location.host;
    const healthUrl = `${httpProtocol}//${healthHost}/health?t=${timestamp}`;
    
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
  
  console.log('About to call useWebSocket hook with URL:', wsUrl);
  
  // Only attempt to use WebSocket if server is available or we're in development mode
  const socketHook = useWebSocket(wsUrl);
  console.log('useWebSocket hook returned:', socketHook);
  
  const { sendMessage, lastMessage, connected, connecting } = socketHook;
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);
  const [demoMode, setDemoMode] = useState<boolean>(false);
  
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
          id: 'solo-player-1',
          name: playerName || 'You',
          score: 0,
          birds: generateDemoBirds(5),
          isHost: true
        },
        {
          id: 'solo-player-2',
          name: 'Feathered Friend',
          score: 0,
          birds: generateDemoBirds(5),
          isHost: false
        }
      ],
      status: 'waiting',
      board,
      currentTurnPlayerId: 'solo-player-1',
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
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage);
        console.log("Processing WebSocket message:", data.type);
        
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
            // Use a function form of setState to avoid dependency on gameState
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
            // Use a function form of setState to avoid dependency on gameState
            setGameState(data.payload.gameState);
            // If we get any game state update while in demo mode, exit demo mode
            if (demoMode) {
              console.log("Game state updated while in demo mode, switching to real game");
              setDemoMode(false);
            }
            break;
            
          case 'PLAYER_BIRDS':
            // Update player birds in the game state using functional setState
            if (playerId) {
              setGameState(prevState => {
                if (!prevState) return null;
                
                const updatedPlayers = prevState.players.map(player => {
                  if (player.id === playerId) {
                    return { ...player, birds: data.payload.birds };
                  }
                  return player;
                });
                
                return {
                  ...prevState,
                  players: updatedPlayers
                };
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
  }, [lastMessage, playerId, demoMode]);

  const createGame = useCallback((name: string) => {
    setPlayerName(name);
    
    // If we're in solo play mode or not connected, create a solo game
    if (demoMode || !connected) {
      console.log('Creating solo game with name:', name);
      
      // Create a new solo game state
      const soloGameState = createDemoGameState();
      
      // Update the player name in the game state
      soloGameState.players[0].name = name;
      
      // Set the game state
      setGameState(soloGameState);
      setPlayerId('solo-player-1'); // In solo mode, always assign the first player
      
      return;
    }
    
    // Otherwise, send the real WebSocket message for multiplayer
    console.log('Creating multiplayer game with name:', name);
    sendMessage({
      type: 'CREATE_GAME',
      payload: { username: name }
    });
  }, [sendMessage, demoMode, connected]);

  const joinGame = useCallback((gameId: string, name: string) => {
    setPlayerName(name);
    
    // If we're in solo play mode or not connected, join a solo game
    if (demoMode || !connected) {
      console.log('Starting solo game with ID:', gameId, 'and name:', name);
      
      // Create a new solo game state with the specific game ID
      const soloGameState = createDemoGameState();
      soloGameState.id = gameId;
      
      // Update the player name in the game state
      soloGameState.players[0].name = name;
      
      // Set the game state
      setGameState(soloGameState);
      setPlayerId('solo-player-1'); // In solo mode, always assign the first player
      
      return;
    }
    
    // Otherwise, send the real WebSocket message for multiplayer
    console.log('Joining multiplayer game with ID:', gameId, 'and name:', name);
    sendMessage({
      type: 'JOIN_GAME',
      payload: { gameId, username: name }
    });
  }, [sendMessage, demoMode, connected]);

  const startGame = useCallback(() => {
    if (!gameState) return;
    
    // If we're in solo play mode or not connected, start the solo game
    if (demoMode || !connected) {
      console.log('Starting solo game');
      
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
    
    // Otherwise, send the real WebSocket message for multiplayer
    console.log('Starting multiplayer game with ID:', gameState.id);
    sendMessage({
      type: 'START_GAME',
      payload: { gameId: gameState.id }
    });
  }, [gameState, sendMessage, demoMode, connected]);

  const leaveGame = useCallback(() => {
    // If we're in solo play mode or not connected, just reset the local state
    if (demoMode || !connected) {
      console.log('Leaving solo game');
      setGameState(null);
      return;
    }
    
    // Otherwise, send the real WebSocket message for multiplayer
    console.log('Leaving multiplayer game');
    sendMessage({
      type: 'LEAVE_GAME',
      payload: {}
    });
    setGameState(null);
  }, [sendMessage, demoMode, connected]);

  // Function to simulate AI move in solo play
  const simulateAIMove = useCallback(() => {
    if (!gameState || !demoMode) return;
    
    console.log('Simulating AI move in solo game');
    
    // Add a small delay to simulate AI "thinking"
    setTimeout(() => {
      setGameState(prevState => {
        if (!prevState) return null;
        
        // Find the AI player
        const aiPlayer = prevState.players.find(p => p.id !== playerId);
        if (!aiPlayer || aiPlayer.birds.length === 0) return prevState;
        
        // Choose a random bird from AI's hand
        const randomBirdIndex = Math.floor(Math.random() * aiPlayer.birds.length);
        const birdToPlace = aiPlayer.birds[randomBirdIndex];
        
        // Find a random empty spot on the board
        const emptySpots: [number, number][] = [];
        prevState.board.forEach((row, rowIndex) => {
          row.forEach((tile, colIndex) => {
            if (!tile.bird) {
              emptySpots.push([rowIndex, colIndex]);
            }
          });
        });
        
        // If no empty spots, return the current state
        if (emptySpots.length === 0) return prevState;
        
        // Choose a random empty spot
        const randomSpotIndex = Math.floor(Math.random() * emptySpots.length);
        const [row, col] = emptySpots[randomSpotIndex];
        
        // Clone the bird with the position
        const updatedBird = { ...birdToPlace, position: [row, col] as [number, number] };
        
        // Update the board
        const updatedBoard = JSON.parse(JSON.stringify(prevState.board));
        if (updatedBoard[row] && updatedBoard[row][col]) {
          updatedBoard[row][col].bird = updatedBird;
        }
        
        // Update the AI's birds (remove the placed bird)
        const updatedPlayers = prevState.players.map(player => {
          if (player.id === aiPlayer.id) {
            return {
              ...player,
              birds: player.birds.filter(b => b.id !== birdToPlace.id),
              score: player.score + 1 // Simple scoring for solo mode
            };
          }
          return player;
        });
        
        // Switch turn back to the human player
        return {
          ...prevState,
          board: updatedBoard,
          players: updatedPlayers,
          currentTurnPlayerId: playerId
        };
      });
    }, 1500); // 1.5 second delay for AI "thinking"
  }, [gameState, playerId, demoMode]);

  const placeBird = useCallback((birdId: string, position: [number, number]) => {
    if (!gameState) return;
    
    // If we're in solo play mode or not connected, place the bird locally
    if (demoMode || !connected) {
      console.log('Placing bird in solo game:', { birdId, position });
      
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
              score: player.score + 1 // Simple scoring for solo mode
            };
          }
          return player;
        });
        
        // Find the AI player ID
        const aiPlayer = prevState.players.find(p => p.id !== playerId);
        const aiPlayerId = aiPlayer?.id || 'solo-player-2';
        
        // Update turn to the AI player
        return {
          ...prevState,
          board: updatedBoard,
          players: updatedPlayers,
          currentTurnPlayerId: aiPlayerId
        };
      });
      
      // After updating the state to the AI's turn, simulate the AI move
      setTimeout(() => {
        simulateAIMove();
      }, 300);
      
      return;
    }
    
    // Otherwise, send the real WebSocket message for multiplayer
    console.log('Placing bird in multiplayer game:', { birdId, position });
    sendMessage({
      type: 'GAME_ACTION',
      payload: {
        action: 'PLACE_BIRD',
        birdId,
        position
      }
    });
  }, [gameState, sendMessage, demoMode, connected, playerId, simulateAIMove]);

  const getPlayerBirds = useCallback(() => {
    if (!gameState) return;
    
    // If we're in solo play mode or not connected, use the birds already in the game state
    if (demoMode || !connected) {
      console.log('Getting player birds in solo game');
      // In solo mode, birds are already in the game state
      return;
    }
    
    // Otherwise, send the real WebSocket message for multiplayer
    console.log('Getting player birds in multiplayer game');
    sendMessage({
      type: 'GAME_ACTION',
      payload: {
        action: 'GET_PLAYER_BIRDS'
      }
    });
  }, [gameState, sendMessage, demoMode, connected]);

  // Debounce function to prevent excessive calls
  const debounce = (func: Function, wait: number) => {
    let timeout: number | null = null;
    
    return (...args: any[]) => {
      if (timeout) {
        clearTimeout(timeout);
      }
      
      timeout = window.setTimeout(() => {
        func(...args);
        timeout = null;
      }, wait);
    };
  };
  
  // Create a debounced version of the refreshGameState function
  const refreshGameState = useCallback(
    debounce(() => {
      if (!gameState) return;
      
      // If we're in solo play mode or not connected, do nothing (state is already local)
      if (demoMode || !connected) {
        console.log('Refreshing game state in solo game (no-op)');
        return;
      }
      
      // Otherwise, send the real WebSocket message for multiplayer
      console.log('Refreshing game state in multiplayer game');
      sendMessage({
        type: 'GAME_ACTION',
        payload: {
          action: 'GET_GAME_STATE'
        }
      });
    }, 300), // 300ms debounce to prevent excessive calls
  [gameState, sendMessage, demoMode, connected]);

  // Determine if the current player is the host
  const isHost = useMemo(() => {
    if (!gameState || !playerId) return false;
    const player = gameState.players.find(p => p.id === playerId);
    return player ? player.isHost : false;
  }, [gameState, playerId]);

  // Determine if it's the current player's turn
  const isMyTurn = useMemo(() => {
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
