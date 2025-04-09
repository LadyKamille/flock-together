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
  // In a real implementation, use the actual WebSocket server URL
  const wsUrl = 'ws://localhost:3001';
  const { sendMessage, lastMessage, connected, connecting } = useWebSocket(wsUrl);
  
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [playerName, setPlayerName] = useState<string | null>(null);

  // Process incoming WebSocket messages
  React.useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage);
        
        switch (data.type) {
          case 'CONNECTION_ESTABLISHED':
            setPlayerId(data.payload.clientId);
            break;
            
          case 'GAME_CREATED':
            setGameState(data.payload.gameState);
            break;
            
          case 'PLAYER_JOINED':
          case 'PLAYER_LEFT':
          case 'GAME_STARTED':
          case 'BIRD_PLACED':
          case 'GAME_STATE':
            setGameState(data.payload.gameState);
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
  }, [lastMessage, gameState, playerId]);

  const createGame = useCallback((name: string) => {
    setPlayerName(name);
    sendMessage({
      type: 'CREATE_GAME',
      payload: { username: name }
    });
  }, [sendMessage]);

  const joinGame = useCallback((gameId: string, name: string) => {
    setPlayerName(name);
    sendMessage({
      type: 'JOIN_GAME',
      payload: { gameId, username: name }
    });
  }, [sendMessage]);

  const startGame = useCallback(() => {
    if (gameState) {
      sendMessage({
        type: 'START_GAME',
        payload: { gameId: gameState.id }
      });
    }
  }, [gameState, sendMessage]);

  const leaveGame = useCallback(() => {
    sendMessage({
      type: 'LEAVE_GAME',
      payload: {}
    });
    setGameState(null);
  }, [sendMessage]);

  const placeBird = useCallback((birdId: string, position: [number, number]) => {
    if (gameState) {
      sendMessage({
        type: 'GAME_ACTION',
        payload: {
          action: 'PLACE_BIRD',
          birdId,
          position
        }
      });
    }
  }, [gameState, sendMessage]);

  const getPlayerBirds = useCallback(() => {
    if (gameState) {
      sendMessage({
        type: 'GAME_ACTION',
        payload: {
          action: 'GET_PLAYER_BIRDS'
        }
      });
    }
  }, [gameState, sendMessage]);

  const refreshGameState = useCallback(() => {
    if (gameState) {
      sendMessage({
        type: 'GAME_ACTION',
        payload: {
          action: 'GET_GAME_STATE'
        }
      });
    }
  }, [gameState, sendMessage]);

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
        refreshGameState
      }}
    >
      {children}
    </GameContext.Provider>
  );
};