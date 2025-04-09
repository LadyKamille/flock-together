import React, { createContext, useState, useContext, ReactNode } from 'react';
import useWebSocket from '../hooks/useWebSocket';

interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
}

interface GameState {
  id: string;
  players: Player[];
  status: 'waiting' | 'playing' | 'finished';
  board: any[];
  currentTurn: string;
}

interface GameContextType {
  gameState: GameState | null;
  playerId: string | null;
  playerName: string | null;
  isHost: boolean;
  connected: boolean;
  connecting: boolean;
  createGame: (playerName: string) => void;
  joinGame: (gameId: string, playerName: string) => void;
  startGame: () => void;
  leaveGame: () => void;
}

const initialGameState: GameState = {
  id: '',
  players: [],
  status: 'waiting',
  board: [],
  currentTurn: ''
};

const GameContext = createContext<GameContextType>({
  gameState: null,
  playerId: null,
  playerName: null,
  isHost: false,
  connected: false,
  connecting: false,
  createGame: () => {},
  joinGame: () => {},
  startGame: () => {},
  leaveGame: () => {}
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
            setGameState(data.payload.gameState);
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
  }, [lastMessage]);

  const createGame = (name: string) => {
    setPlayerName(name);
    sendMessage({
      type: 'CREATE_GAME',
      payload: { username: name }
    });
  };

  const joinGame = (gameId: string, name: string) => {
    setPlayerName(name);
    sendMessage({
      type: 'JOIN_GAME',
      payload: { gameId, username: name }
    });
  };

  const startGame = () => {
    if (gameState) {
      sendMessage({
        type: 'START_GAME',
        payload: { gameId: gameState.id }
      });
    }
  };

  const leaveGame = () => {
    sendMessage({
      type: 'LEAVE_GAME',
      payload: {}
    });
    setGameState(null);
  };

  // Determine if the current player is the host
  const isHost = React.useMemo(() => {
    if (!gameState || !playerId) return false;
    const player = gameState.players.find(p => p.id === playerId);
    return player ? player.isHost : false;
  }, [gameState, playerId]);

  return (
    <GameContext.Provider
      value={{
        gameState,
        playerId,
        playerName,
        isHost,
        connected,
        connecting,
        createGame,
        joinGame,
        startGame,
        leaveGame
      }}
    >
      {children}
    </GameContext.Provider>
  );
};