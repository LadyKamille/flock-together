import { WebSocket, WebSocketServer } from 'ws';
import { IncomingMessage } from 'http';
import gameService from '../services/GameService';

interface WSClient extends WebSocket {
  id: string;
  gameId?: string;
  username?: string;
}

interface WebSocketMessage {
  type: string;
  payload: any;
}

export default class WebSocketHandler {
  private wss: WebSocketServer;
  private clients: Map<string, WSClient> = new Map();

  constructor(wss: WebSocketServer) {
    this.wss = wss;
    console.log('WebSocket server initialized');
    
    // Print WebSocketServer configuration
    console.log('WebSocketServer configuration:', {
      path: (wss as any).options.path,
      port: (wss as any).options.port,
      host: (wss as any).options.host,
      server: (wss as any).options.server ? 'HTTP Server attached' : 'No HTTP Server'
    });
    
    this.setupConnectionHandler();
  }

  private setupConnectionHandler(): void {
    this.wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
      const clientId = this.generateClientId();
      const client = ws as WSClient;
      client.id = clientId;
      
      this.clients.set(clientId, client);
      
      console.log(`Client connected: ${clientId}`);
      console.log(`Total clients connected: ${this.clients.size}`);
      
      // Send client their ID
      this.sendToClient(client, {
        type: 'CONNECTION_ESTABLISHED',
        payload: { clientId }
      });
      
      client.on('message', (message: Buffer | string | ArrayBuffer) => {
        try {
          // Convert message to string if it's not already
          if (message instanceof ArrayBuffer) {
            // Handle ArrayBuffer case
            const decoder = new TextDecoder();
            const messageStr = decoder.decode(message);
            console.log(`Received ArrayBuffer message from ${clientId}:`, messageStr);
            this.handleMessage(client, messageStr);
          } else if (message instanceof Buffer || Buffer.isBuffer(message)) {
            // Handle Buffer case
            const messageStr = message.toString();
            console.log(`Received Buffer message from ${clientId}:`, messageStr);
            this.handleMessage(client, message);
          } else {
            // Handle string case
            console.log(`Received string message from ${clientId}:`, message);
            this.handleMessage(client, message);
          }
        } catch (error) {
          console.error('Error processing message:', error);
        }
      });
      
      client.on('error', (error) => {
        console.error(`WebSocket error for client ${clientId}:`, error);
      });
      
      client.on('close', (code, reason) => {
        console.log(`Client ${clientId} disconnected with code ${code}${reason ? `, reason: ${reason}` : ''}`);
        this.handleClientDisconnect(client);
      });
    });
    
    this.wss.on('error', (error) => {
      console.error('WebSocket server error:', error);
    });
    
    this.wss.on('close', () => {
      console.log('WebSocket server closed');
    });
  }

  private handleMessage(client: WSClient, messageData: string | Buffer): void {
    try {
      const messageStr = typeof messageData === 'string' 
        ? messageData
        : messageData.toString();
        
      const message: WebSocketMessage = JSON.parse(messageStr);
      
      switch (message.type) {
        case 'CREATE_GAME':
          this.handleCreateGame(client, message.payload);
          break;
          
        case 'JOIN_GAME':
          this.handleJoinGame(client, message.payload);
          break;
          
        case 'START_GAME':
          this.handleStartGame(client, message.payload);
          break;
          
        case 'LEAVE_GAME':
          this.handleLeaveGame(client);
          break;
          
        case 'GAME_ACTION':
          this.handleGameAction(client, message.payload);
          break;
          
        default:
          console.log(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  }

  private handleCreateGame(client: WSClient, payload: any): void {
    const { username } = payload;
    client.username = username;
    
    const gameId = gameService.createGame(client.id, username);
    client.gameId = gameId;
    
    this.sendToClient(client, {
      type: 'GAME_CREATED',
      payload: { 
        gameId,
        gameState: gameService.getGameState(gameId)
      }
    });
  }

  private handleJoinGame(client: WSClient, payload: any): void {
    const { gameId, username } = payload;
    client.username = username;
    
    const success = gameService.joinGame(gameId, client.id, username);
    
    if (success) {
      client.gameId = gameId;
      
      // Get updated game state
      const gameState = gameService.getGameState(gameId);
      
      // Notify all players in the game
      this.broadcastToGame(gameId, {
        type: 'PLAYER_JOINED',
        payload: { gameState }
      });
    } else {
      this.sendToClient(client, {
        type: 'ERROR',
        payload: { message: 'Failed to join game' }
      });
    }
  }

  private handleStartGame(client: WSClient, payload: any): void {
    const { gameId } = payload;
    
    if (!client.gameId || client.gameId !== gameId) {
      return;
    }
    
    const success = gameService.startGame(gameId);
    
    if (success) {
      const gameState = gameService.getGameState(gameId);
      
      this.broadcastToGame(gameId, {
        type: 'GAME_STARTED',
        payload: { gameState }
      });
    } else {
      this.sendToClient(client, {
        type: 'ERROR',
        payload: { message: 'Failed to start game' }
      });
    }
  }

  private handleLeaveGame(client: WSClient): void {
    if (!client.gameId) {
      return;
    }
    
    const gameId = client.gameId;
    const success = gameService.leaveGame(gameId, client.id);
    client.gameId = undefined;
    
    if (success) {
      const gameState = gameService.getGameState(gameId);
      
      if (gameState) {
        this.broadcastToGame(gameId, {
          type: 'PLAYER_LEFT',
          payload: { gameState }
        });
      }
    }
  }

  private handleGameAction(client: WSClient, payload: any): void {
    if (!client.gameId) {
      this.sendToClient(client, {
        type: 'ERROR',
        payload: { message: 'You are not in a game' }
      });
      return;
    }

    const { action, birdId, position } = payload;
    const gameId = client.gameId;

    switch (action) {
      case 'PLACE_BIRD': {
        if (!birdId || !position || !Array.isArray(position) || position.length !== 2) {
          this.sendToClient(client, {
            type: 'ERROR',
            payload: { message: 'Invalid bird placement parameters' }
          });
          return;
        }

        const [row, col] = position;
        const success = gameService.placeBird(gameId, client.id, birdId, row, col);

        if (success) {
          const gameState = gameService.getGameState(gameId);
          
          // Notify all players about the bird placement and updated game state
          this.broadcastToGame(gameId, {
            type: 'BIRD_PLACED',
            payload: { 
              playerId: client.id, 
              birdId, 
              position: [row, col],
              gameState 
            }
          });
        } else {
          this.sendToClient(client, {
            type: 'ERROR',
            payload: { message: 'Failed to place bird' }
          });
        }
        break;
      }

      case 'GET_PLAYER_BIRDS': {
        const birds = gameService.getPlayerBirds(gameId, client.id);
        
        if (birds) {
          this.sendToClient(client, {
            type: 'PLAYER_BIRDS',
            payload: { birds }
          });
        } else {
          this.sendToClient(client, {
            type: 'ERROR',
            payload: { message: 'Failed to get birds' }
          });
        }
        break;
      }

      case 'IS_MY_TURN': {
        const isPlayerTurn = gameService.isPlayerTurn(gameId, client.id);
        
        this.sendToClient(client, {
          type: 'TURN_STATUS',
          payload: { isYourTurn: isPlayerTurn }
        });
        break;
      }

      case 'GET_GAME_STATE': {
        const gameState = gameService.getGameState(gameId);
        
        if (gameState) {
          this.sendToClient(client, {
            type: 'GAME_STATE',
            payload: { gameState }
          });
        } else {
          this.sendToClient(client, {
            type: 'ERROR',
            payload: { message: 'Game not found' }
          });
        }
        break;
      }

      default:
        this.sendToClient(client, {
          type: 'ERROR',
          payload: { message: `Unknown game action: ${action}` }
        });
    }
  }

  private handleClientDisconnect(client: WSClient): void {
    console.log(`Client disconnected: ${client.id}`);
    
    // Remove from game if in one
    if (client.gameId) {
      this.handleLeaveGame(client);
    }
    
    // Remove from clients map
    this.clients.delete(client.id);
  }

  private generateClientId(): string {
    return Math.random().toString(36).substring(2, 15);
  }

  private sendToClient(client: WSClient, message: WebSocketMessage): void {
    if (client.readyState === WebSocket.OPEN) {
      try {
        const messageStr = JSON.stringify(message);
        console.log(`Sending message to client ${client.id}:`, messageStr);
        client.send(messageStr);
      } catch (error) {
        console.error(`Error sending message to client ${client.id}:`, error);
      }
    } else {
      console.warn(`Cannot send message to client ${client.id}, WebSocket is not open (readyState: ${client.readyState})`);
    }
  }

  private broadcastToGame(gameId: string, message: WebSocketMessage): void {
    const gameState = gameService.getGameState(gameId);
    
    if (!gameState) {
      return;
    }
    
    for (const client of this.clients.values()) {
      if (client.gameId === gameId && client.readyState === WebSocket.OPEN) {
        this.sendToClient(client, message);
      }
    }
  }
}