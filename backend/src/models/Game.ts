// Game model representing a Flock Together game instance

export type BirdType = 'blue' | 'red' | 'yellow' | 'green' | 'purple';
export type TerrainType = 'forest' | 'water' | 'mountain' | 'grassland' | 'desert';

export interface Bird {
  id: string;
  type: BirdType;
  position?: [number, number]; // [row, col] if placed on board
}

export interface BoardTile {
  row: number;
  col: number;
  terrain: TerrainType;
  bird?: Bird; // Bird occupying this tile
  adjacentTo?: string[]; // IDs of adjacent birds
}

export interface Player {
  id: string;
  name: string;
  score: number;
  birds: Bird[]; // Birds in hand
  isHost: boolean;
}

export interface GameState {
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

export class Game {
  private state: GameState;
  private readonly BOARD_SIZE = 8;
  private readonly MAX_ROUNDS = 10;
  private readonly BIRDS_PER_PLAYER = 5;
  private readonly TERRAIN_DISTRIBUTION: TerrainType[] = [
    'forest', 'forest', 'forest', 'forest', 'forest', 'forest', 'forest', 'forest', 
    'water', 'water', 'water', 'water', 'water', 'water',
    'mountain', 'mountain', 'mountain', 'mountain',
    'grassland', 'grassland', 'grassland', 'grassland', 'grassland', 'grassland',
    'desert', 'desert', 'desert', 'desert'
  ];

  constructor(id: string, hostId: string, hostName: string) {
    // Initialize board with random terrain
    const board = this.generateBoard();
    
    // Initialize host player with birds
    const startingBirds = this.generateBirds(this.BIRDS_PER_PLAYER);
    
    this.state = {
      id,
      players: [{
        id: hostId,
        name: hostName,
        score: 0,
        birds: startingBirds,
        isHost: true
      }],
      status: 'waiting',
      board,
      currentTurnPlayerId: hostId,
      round: 1,
      maxRounds: this.MAX_ROUNDS
    };
  }

  public getState(): GameState {
    return { ...this.state }; // Return a copy to prevent direct modification
  }

  public addPlayer(id: string, name: string): boolean {
    if (this.state.status !== 'waiting') {
      return false;
    }
    
    if (this.state.players.some(p => p.id === id)) {
      return false;
    }
    
    const startingBirds = this.generateBirds(this.BIRDS_PER_PLAYER);
    
    this.state.players.push({
      id,
      name,
      score: 0,
      birds: startingBirds,
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
    this.state.round = 1;
    
    // Randomly choose first player
    const randomPlayerIndex = Math.floor(Math.random() * this.state.players.length);
    this.state.currentTurnPlayerId = this.state.players[randomPlayerIndex].id;
    
    return true;
  }

  public placeBird(playerId: string, birdId: string, row: number, col: number): boolean {
    // Check if it's the player's turn
    if (this.state.currentTurnPlayerId !== playerId) {
      return false;
    }
    
    // Check if the position is valid
    if (row < 0 || row >= this.BOARD_SIZE || col < 0 || col >= this.BOARD_SIZE) {
      return false;
    }
    
    // Check if the tile is already occupied
    if (this.state.board[row][col].bird) {
      return false;
    }
    
    // Find the player and the bird
    const player = this.state.players.find(p => p.id === playerId);
    if (!player) {
      return false;
    }
    
    const birdIndex = player.birds.findIndex(b => b.id === birdId);
    if (birdIndex === -1) {
      return false;
    }
    
    const bird = player.birds[birdIndex];
    
    // Place the bird on the board
    this.state.board[row][col].bird = { ...bird, position: [row, col] };
    
    // Remove the bird from the player's hand
    player.birds.splice(birdIndex, 1);
    
    // Update adjacent birds information
    this.updateAdjacentBirds(row, col);
    
    // Calculate and award score
    const points = this.calculateScore(row, col);
    player.score += points;
    
    // Move to the next player's turn
    this.nextTurn();
    
    return true;
  }

  public endGame(): void {
    this.state.status = 'finished';
    this.state.endTime = new Date();
    
    // Determine winner based on score
    let highestScore = -1;
    let winnerId: string | null = null;
    
    for (const player of this.state.players) {
      if (player.score > highestScore) {
        highestScore = player.score;
        winnerId = player.id;
      }
    }
  }

  private nextTurn(): void {
    // Find the index of the current player
    const currentPlayerIndex = this.state.players.findIndex(
      p => p.id === this.state.currentTurnPlayerId
    );
    
    // Move to the next player
    const nextPlayerIndex = (currentPlayerIndex + 1) % this.state.players.length;
    this.state.currentTurnPlayerId = this.state.players[nextPlayerIndex].id;
    
    // Check if we've completed a round (all players have taken their turn)
    if (nextPlayerIndex === 0) {
      this.state.round++;
      
      // Check if the game should end
      if (this.state.round > this.state.maxRounds) {
        this.endGame();
      }
    }
  }

  private generateBoard(): BoardTile[][] {
    const board: BoardTile[][] = [];
    
    // Create a copy of the terrain distribution to draw from
    const terrainTypes = [...this.TERRAIN_DISTRIBUTION];
    
    // Fill the board with random terrain
    for (let row = 0; row < this.BOARD_SIZE; row++) {
      const boardRow: BoardTile[] = [];
      
      for (let col = 0; col < this.BOARD_SIZE; col++) {
        // If we've used all predefined terrain, default to grassland
        let terrain: TerrainType = 'grassland';
        
        if (terrainTypes.length > 0) {
          // Select a random terrain from the remaining types
          const randomIndex = Math.floor(Math.random() * terrainTypes.length);
          terrain = terrainTypes[randomIndex];
          
          // Remove the used terrain type
          terrainTypes.splice(randomIndex, 1);
        }
        
        boardRow.push({
          row,
          col,
          terrain,
          adjacentTo: []
        });
      }
      
      board.push(boardRow);
    }
    
    return board;
  }

  private generateBirds(count: number): Bird[] {
    const birds: Bird[] = [];
    const birdTypes: BirdType[] = ['blue', 'red', 'yellow', 'green', 'purple'];
    
    for (let i = 0; i < count; i++) {
      const randomType = birdTypes[Math.floor(Math.random() * birdTypes.length)];
      birds.push({
        id: `bird-${Date.now()}-${i}`,
        type: randomType
      });
    }
    
    return birds;
  }

  private updateAdjacentBirds(row: number, col: number): void {
    const placedBird = this.state.board[row][col].bird;
    if (!placedBird) return;
    
    // Check adjacent tiles (up, down, left, right)
    const adjacentPositions = [
      [row - 1, col], // up
      [row + 1, col], // down
      [row, col - 1], // left
      [row, col + 1]  // right
    ];
    
    const adjacentBirdIds: string[] = [];
    
    for (const [adjRow, adjCol] of adjacentPositions) {
      // Check if the position is valid
      if (adjRow >= 0 && adjRow < this.BOARD_SIZE && 
          adjCol >= 0 && adjCol < this.BOARD_SIZE) {
        
        const adjTile = this.state.board[adjRow][adjCol];
        
        // If there's a bird in this adjacent tile
        if (adjTile.bird) {
          // Add the adjacent bird's ID to this tile's adjacentTo list
          if (!this.state.board[row][col].adjacentTo) {
            this.state.board[row][col].adjacentTo = [];
          }
          this.state.board[row][col].adjacentTo.push(adjTile.bird.id);
          adjacentBirdIds.push(adjTile.bird.id);
          
          // Also add this bird's ID to the adjacent tile's adjacentTo list
          if (!adjTile.adjacentTo) {
            adjTile.adjacentTo = [];
          }
          if (!adjTile.adjacentTo.includes(placedBird.id)) {
            adjTile.adjacentTo.push(placedBird.id);
          }
        }
      }
    }
    
    // Update the placed bird's adjacentTo list
    this.state.board[row][col].adjacentTo = adjacentBirdIds;
  }

  private calculateScore(row: number, col: number): number {
    const tile = this.state.board[row][col];
    const bird = tile.bird;
    
    if (!bird) return 0;
    
    let score = 0;
    
    // Base score: 1 point for placing a bird
    score += 1;
    
    // Terrain bonus: Birds get bonus points on their preferred terrain
    switch (bird.type) {
      case 'blue':
        if (tile.terrain === 'water') score += 2;
        break;
      case 'red':
        if (tile.terrain === 'forest') score += 2;
        break;
      case 'yellow':
        if (tile.terrain === 'desert') score += 2;
        break;
      case 'green':
        if (tile.terrain === 'grassland') score += 2;
        break;
      case 'purple':
        if (tile.terrain === 'mountain') score += 2;
        break;
    }
    
    // Flock bonus: Points for each adjacent bird
    if (tile.adjacentTo && tile.adjacentTo.length > 0) {
      // 1 point for each adjacent bird
      score += tile.adjacentTo.length;
      
      // Check if any of the adjacent birds are the same type (forming a flock)
      let sameTypeCount = 0;
      
      for (const adjBirdId of tile.adjacentTo) {
        // Find the adjacent bird on the board
        for (let r = 0; r < this.BOARD_SIZE; r++) {
          for (let c = 0; c < this.BOARD_SIZE; c++) {
            const adjTile = this.state.board[r][c];
            if (adjTile.bird && adjTile.bird.id === adjBirdId) {
              if (adjTile.bird.type === bird.type) {
                sameTypeCount++;
              }
            }
          }
        }
      }
      
      // Bonus points for each bird of the same type
      if (sameTypeCount > 0) {
        score += sameTypeCount * 2;
      }
    }
    
    return score;
  }
}