# Flock Together Online

An online multiplayer implementation of the board game Flock Together, built with a React frontend and Node.js backend.

> **Note**: This entire project was built using Claude Code, Anthropic's AI coding assistant. All code, configurations, and documentation were generated with Claude.

## Project Status

🚧 **Work In Progress** 🚧

## Structure

This is a monorepo containing:
- `frontend/`: React application with Vite and TypeScript
- `backend/`: Node.js Express server with WebSocket support
- `aws-setup/`: AWS deployment configuration files

## Local Development

You can run both the frontend and backend concurrently with a single command:

```bash
# Install all dependencies first
npm run install:all

# Run both frontend and backend
npm run dev
```

Or you can run them separately:

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

```bash
cd backend
npm install
npm run dev
```

## Game Features

- Real-time multiplayer gameplay using WebSockets
- Lobby system with unique game IDs for joining
- Turn-based game mechanics following Flock Together rules
- Responsive design for desktop and mobile play
- Demo mode that works without a backend connection
- Automatic reconnection handling with exponential backoff

## Demo Mode

The game features a robust demo mode that automatically activates when the backend server is unavailable:

- Visual indicator showing "DEMO MODE" at the top of the screen
- Simulated game state that works entirely in the browser
- Automatically generated demo board with random terrain
- AI-controlled opponent for testing gameplay
- Ability to place birds and see game mechanics in action
- Seamlessly transitions back to multiplayer mode when connection is restored

This makes the game playable even during server maintenance or network issues, and is perfect for testing and demonstration purposes.

## AWS Deployment

The game is deployed to AWS using:
- Frontend: S3 + CloudFront for static hosting
- Backend: AWS Lambda + API Gateway for WebSocket API
- Database: DynamoDB for game state persistence
- CI/CD: GitHub Actions for automated deployments

See the `aws-setup/` directory for deployment configuration.

## Contributing

1. Clone the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a pull request