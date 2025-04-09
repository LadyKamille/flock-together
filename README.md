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