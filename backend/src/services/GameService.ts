import { Game, GameState } from '../models/Game';
import { generateUniqueId } from '../utils/idGenerator';

class GameService {
  private games: Map<string, Game> = new Map();

  public createGame(hostId: string, hostName: string): string {
    const gameId = generateUniqueId();
    const newGame = new Game(gameId, hostId, hostName);
    this.games.set(gameId, newGame);
    return gameId;
  }

  public joinGame(gameId: string, playerId: string, playerName: string): boolean {
    const game = this.games.get(gameId);
    
    if (!game) {
      return false;
    }
    
    return game.addPlayer(playerId, playerName);
  }

  public leaveGame(gameId: string, playerId: string): boolean {
    const game = this.games.get(gameId);
    
    if (!game) {
      return false;
    }
    
    const result = game.removePlayer(playerId);
    
    // If no players left, remove the game
    const gameState = game.getState();
    if (gameState.players.length === 0) {
      this.games.delete(gameId);
    }
    
    return result;
  }

  public startGame(gameId: string): boolean {
    const game = this.games.get(gameId);
    
    if (!game) {
      return false;
    }
    
    return game.startGame();
  }

  public getGameState(gameId: string): GameState | null {
    const game = this.games.get(gameId);
    
    if (!game) {
      return null;
    }
    
    return game.getState();
  }

  public getAllGames(): Array<GameState> {
    return Array.from(this.games.values()).map(game => game.getState());
  }
}

export default new GameService();