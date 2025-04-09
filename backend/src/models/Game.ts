// Game model representing a Flock Together game instance

export interface Player {
  id: string;
  name: string;
  score: number;
  isHost: boolean;
}

export interface GameState {
  id: string;
  players: Player[];
  status: 'waiting' | 'playing' | 'finished';
  board: any[]; // Will be defined based on game rules
  currentTurn: string; // Player ID
  startTime?: Date;
  endTime?: Date;
}

export class Game {
  private state: GameState;

  constructor(id: string, hostId: string, hostName: string) {
    this.state = {
      id,
      players: [{
        id: hostId,
        name: hostName,
        score: 0,
        isHost: true
      }],
      status: 'waiting',
      board: [],
      currentTurn: hostId
    };
  }

  public getState(): GameState {
    return { ...this.state };
  }

  public addPlayer(id: string, name: string): boolean {
    if (this.state.status !== 'waiting') {
      return false;
    }
    
    if (this.state.players.some(p => p.id === id)) {
      return false;
    }
    
    this.state.players.push({
      id,
      name,
      score: 0,
      isHost: false
    });
    
    return true;
  }

  public removePlayer(id: string): boolean {
    const playerIndex = this.state.players.findIndex(p => p.id === id);
    
    if (playerIndex === -1) {
      return false;
    }
    
    // If the host leaves, assign a new host
    const isHost = this.state.players[playerIndex].isHost;
    this.state.players.splice(playerIndex, 1);
    
    if (isHost && this.state.players.length > 0) {
      this.state.players[0].isHost = true;
    }
    
    return true;
  }

  public startGame(): boolean {
    if (this.state.status !== 'waiting' || this.state.players.length < 2) {
      return false;
    }
    
    this.state.status = 'playing';
    this.state.startTime = new Date();
    
    // Initialize game board and other game state
    // This will be implemented based on Flock Together rules
    
    return true;
  }

  public endGame(): void {
    this.state.status = 'finished';
    this.state.endTime = new Date();
  }
}