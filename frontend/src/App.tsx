import { useState, useEffect } from 'react'
import './App.css'
import GameLobby from './components/GameLobby'
import GameBoard from './components/GameBoard'
import { useGame } from './context/GameContext'

function App() {
  const [view, setView] = useState<'home' | 'lobby' | 'game'>('home')
  const [gameIdInput, setGameIdInput] = useState<string>('')
  const [createNameInput, setCreateNameInput] = useState<string>('')
  const [joinNameInput, setJoinNameInput] = useState<string>('')
  
  const { gameState, createGame, joinGame, leaveGame, connected, connecting, demoMode } = useGame()
  
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
    if (!createNameInput || createNameInput.trim() === '') {
      alert('Please enter your name')
      return
    }
    
    // Create the game (this will use demo mode internally if needed)
    console.log('Creating game', { playerName: createNameInput, demoMode });
    createGame(createNameInput)
    
    // Set the view to lobby after creating the game
    setView('lobby')
  }

  const handleJoinGame = () => {
    if (!joinNameInput || joinNameInput.trim() === '') {
      alert('Please enter your name')
      return
    }
    
    if (!gameIdInput || gameIdInput.trim() === '') {
      alert('Please enter a game ID')
      return
    }
    
    // Join the game (this will use demo mode internally if needed)
    console.log('Joining game', { gameIdInput, playerName: joinNameInput, demoMode });
    joinGame(gameIdInput.trim(), joinNameInput)
    
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
          <div className="home-screen" style={{padding: '20px', maxWidth: '800px', margin: '0 auto'}}>
            <h1 style={{
              fontSize: '2.5rem',
              color: '#2c3e50',
              margin: '0 0 5px 0',
              textAlign: 'center'
            }}>🦜 Flock Together</h1>
            <p style={{
              fontSize: '1.2rem',
              color: '#7f8c8d',
              margin: '0 0 30px 0',
              textAlign: 'center'
            }}>An online multiplayer bird placement game</p>
            
            <div style={{
              display: 'flex',
              gap: '20px',
              marginTop: '20px',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}>
              {/* Create Game Column */}
              <div style={{
                flex: '1',
                minWidth: '300px',
                maxWidth: '400px',
                padding: '20px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: 'white',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
              }}>
                <h2 style={{margin: '0 0 15px 0', fontSize: '1.5rem', textAlign: 'center', color: '#2e7d32'}}>Create New Game</h2>
                
                <div className="input-group">
                  <label htmlFor="createPlayerName">Your Name</label>
                  <input
                    type="text"
                    id="createPlayerName"
                    value={createNameInput}
                    onChange={(e) => setCreateNameInput(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
                
                <button 
                  onClick={handleCreateGame}
                  style={{
                    backgroundColor: '#2e7d32',
                    color: 'white',
                    width: '100%',
                    marginTop: '20px',
                    padding: '10px',
                    borderRadius: '5px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Create New Game
                </button>
                
                <p style={{
                  marginTop: '15px',
                  fontSize: '0.9rem',
                  color: '#666',
                  textAlign: 'center'
                }}>
                  Create a new game and invite friends to join with your game ID.
                </p>
              </div>
              
              {/* Join Game Column */}
              <div style={{
                flex: '1',
                minWidth: '300px',
                maxWidth: '400px',
                padding: '20px',
                border: '1px solid #e0e0e0',
                borderRadius: '8px',
                backgroundColor: 'white',
                boxShadow: '0 2px 10px rgba(0, 0, 0, 0.05)'
              }}>
                <h2 style={{margin: '0 0 15px 0', fontSize: '1.5rem', textAlign: 'center', color: '#1976d2'}}>Join Existing Game</h2>
                
                <div className="input-group">
                  <label htmlFor="joinPlayerName">Your Name</label>
                  <input
                    type="text"
                    id="joinPlayerName"
                    value={joinNameInput}
                    onChange={(e) => setJoinNameInput(e.target.value)}
                    placeholder="Enter your name"
                  />
                </div>
                
                <div className="input-group" style={{marginTop: '15px'}}>
                  <label htmlFor="gameId">Game ID</label>
                  <input
                    type="text"
                    id="gameId"
                    value={gameIdInput}
                    onChange={(e) => setGameIdInput(e.target.value.toUpperCase())}
                    placeholder="Enter Game ID"
                  />
                </div>
                
                <button 
                  onClick={handleJoinGame}
                  style={{
                    backgroundColor: '#1976d2',
                    color: 'white',
                    width: '100%',
                    marginTop: '20px',
                    padding: '10px',
                    borderRadius: '5px',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1rem'
                  }}
                >
                  Join Game
                </button>
                
                <p style={{
                  marginTop: '15px',
                  fontSize: '0.9rem',
                  color: '#666',
                  textAlign: 'center'
                }}>
                  Join a game that someone else has created using their game ID.
                </p>
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
              onExitLobby={() => {
                // Leave the current game
                leaveGame();
                // Return to home screen
                setView('home');
                // Clear game ID input
                setGameIdInput('');
              }}
              gameId={gameIdInput} 
              playerName={view === 'home' ? '' : (gameIdInput ? joinNameInput : createNameInput)}
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
