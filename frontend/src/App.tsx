import { useState } from 'react'
import './App.css'

function App() {
  const [view, setView] = useState<'home' | 'lobby' | 'game'>('home')
  const [gameId, setGameId] = useState<string>('')
  const [playerName, setPlayerName] = useState<string>('')

  const handleCreateGame = () => {
    if (!playerName) {
      alert('Please enter your name')
      return
    }
    setView('lobby')
  }

  const handleJoinGame = () => {
    if (!playerName || !gameId) {
      alert('Please enter your name and game ID')
      return
    }
    setView('lobby')
  }

  const handleStartGame = () => {
    setView('game')
  }

  return (
    <div className="app-container">
      {view === 'home' && (
        <div className="home-screen">
          <h1>Flock Together</h1>
          <p>An online multiplayer board game</p>
          
          <div className="input-group">
            <label htmlFor="playerName">Your Name</label>
            <input
              type="text"
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
            />
          </div>
          
          <div className="actions">
            <div>
              <button onClick={handleCreateGame}>Create New Game</button>
            </div>
            
            <div className="join-game">
              <input
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value.toUpperCase())}
                placeholder="Enter Game ID"
              />
              <button onClick={handleJoinGame}>Join Game</button>
            </div>
          </div>
        </div>
      )}

      {view === 'lobby' && (
        <div className="lobby-screen">
          <h2>Game Lobby</h2>
          <div className="game-id">
            <p>Game ID: <strong>{gameId || 'ABCD12'}</strong></p>
            <p>Share this code with other players</p>
          </div>
          
          <div className="player-list">
            <h3>Players</h3>
            <ul>
              <li>{playerName} (Host)</li>
              {/* Other players will be added here */}
            </ul>
          </div>
          
          <button onClick={handleStartGame}>Start Game</button>
        </div>
      )}

      {view === 'game' && (
        <div className="game-screen">
          <h2>Flock Together</h2>
          <div className="game-board">
            {/* Game board will be implemented here */}
            <p>Game board placeholder</p>
          </div>
          
          <div className="game-controls">
            <button>End Turn</button>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
