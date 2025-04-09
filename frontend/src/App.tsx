import { useState, useEffect } from 'react'
import './App.css'
import GameLobby from './components/GameLobby'
import GameBoard from './components/GameBoard'
import { useGame } from './context/GameContext'

function App() {
  const [view, setView] = useState<'home' | 'lobby' | 'game'>('home')
  const [gameIdInput, setGameIdInput] = useState<string>('')
  const [playerNameInput, setPlayerNameInput] = useState<string>('')
  
  const { gameState, createGame, joinGame, connected, connecting, demoMode } = useGame()
  
  // Let's add some debugging to see connection status
  useEffect(() => {
    console.log('Connection status changed:', { connected, connecting, demoMode });
  }, [connected, connecting, demoMode]);
  
  // Add debug info about gameState changes
  useEffect(() => {
    console.log('Game state updated:', gameState);
    
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
    
    // Create the game (this will use demo mode internally if needed)
    console.log('Creating game', { playerNameInput, demoMode });
    createGame(playerNameInput)
    
    // Set the view to lobby after creating the game
    setView('lobby')
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
    
    // Join the game (this will use demo mode internally if needed)
    console.log('Joining game', { gameIdInput, playerNameInput, demoMode });
    joinGame(gameIdInput.trim(), playerNameInput)
    
    // Set the view to lobby after joining the game
    setView('lobby')
  }

  const handleStartGame = () => {
    // This is now handled by the GameLobby component
  }

  return (
    <div className="app-container" style={{
      padding: '0', 
      maxWidth: '100%',
      width: '100%',
      margin: '0',
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh'
    }}>
      {/* Only show connection status while actually connecting - no status bar during solo play */}
      {connecting && (
        <div className="connection-status connecting" style={{
          position: 'fixed',
          top: '0',
          left: '0',
          right: '0',
          padding: '8px',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          backgroundColor: '#3498db',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '0.9rem'
        }}>
          <strong>CONNECTING...</strong> Game available in solo mode while connecting.
          <span className="loading-spinner"></span>
        </div>
      )}
      
      <div style={{marginTop: connecting ? '40px' : '0', flex: 1, width: '100%'}}>
        {view === 'home' && (
          <div className="home-screen" style={{padding: '20px', maxWidth: '400px', margin: '0 auto'}}>
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
              />
            </div>
            
            <div className="actions">
              <div>
                <button 
                  onClick={handleCreateGame}
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
                />
                <button 
                  onClick={handleJoinGame}
                >
                  Join Game
                </button>
              </div>
            </div>
          </div>
        )}

        {view === 'lobby' && (
          <div style={{
            width: '100%', 
            height: '100%', 
            padding: '0',
            overflow: 'hidden'
          }}>
            <GameLobby 
              onStartGame={() => setView('game')} 
              gameId={gameIdInput} 
              playerName={playerNameInput} 
            />
          </div>
        )}

        {view === 'game' && (
          <div style={{
            width: '100%', 
            height: 'calc(100vh - 40px)',
            padding: '0',
            overflow: 'hidden'
          }}>
            <GameBoard onReturnToLobby={() => setView('lobby')} />
          </div>
        )}
      </div>
    </div>
  )
}

export default App
