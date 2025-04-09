import { useState, useEffect } from 'react'
import './App.css'
import GameLobby from './components/GameLobby'
import GameBoard from './components/GameBoard'
import { useGame } from './context/GameContext'

function App() {
  const [view, setView] = useState<'home' | 'lobby' | 'game'>('home')
  const [gameIdInput, setGameIdInput] = useState<string>('')
  const [playerNameInput, setPlayerNameInput] = useState<string>('')
  
  const { gameState, createGame, joinGame, connected } = useGame()
  
  // Auto-transition between views based on game state
  useEffect(() => {
    if (gameState) {
      // If the game is created or joined, go to lobby
      if (gameState.status === 'waiting') {
        setView('lobby')
      }
      // If the game has started, go to the game board
      else if (gameState.status === 'playing') {
        setView('game')
      }
    }
  }, [gameState])

  const handleCreateGame = () => {
    if (!playerNameInput || playerNameInput.trim() === '') {
      alert('Please enter your name')
      return
    }
    
    createGame(playerNameInput)
  }

  const handleJoinGame = () => {
    if (!playerNameInput || playerNameInput.trim() === '') {
      alert('Please enter your name')
      return
    }
    
    if (!gameIdInput || gameIdInput.trim() === '') {
      alert('Please enter a game ID')
      return
    }
    
    joinGame(gameIdInput.trim(), playerNameInput)
  }

  const handleStartGame = () => {
    // This is now handled by the GameLobby component
  }

  return (
    <div className="app-container">
      {!connected && (
        <div className="connection-status">
          Connecting to server...
        </div>
      )}
      
      {view === 'home' && (
        <div className="home-screen">
          <h1>Flock Together</h1>
          <p>An online multiplayer board game</p>
          
          <div className="input-group">
            <label htmlFor="playerName">Your Name</label>
            <input
              type="text"
              id="playerName"
              value={playerNameInput}
              onChange={(e) => setPlayerNameInput(e.target.value)}
              placeholder="Enter your name"
              disabled={!connected}
            />
          </div>
          
          <div className="actions">
            <div>
              <button 
                onClick={handleCreateGame}
                disabled={!connected}
              >
                Create New Game
              </button>
            </div>
            
            <div className="join-game">
              <input
                type="text"
                value={gameIdInput}
                onChange={(e) => setGameIdInput(e.target.value.toUpperCase())}
                placeholder="Enter Game ID"
                disabled={!connected}
              />
              <button 
                onClick={handleJoinGame}
                disabled={!connected}
              >
                Join Game
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'lobby' && (
        <GameLobby onStartGame={handleStartGame} />
      )}

      {view === 'game' && (
        <GameBoard />
      )}
    </div>
  )
}

export default App
