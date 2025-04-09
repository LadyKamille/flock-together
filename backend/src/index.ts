import express, { Router } from 'express';
import http from 'http';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import WebSocketHandler from './websocket/WebSocketHandler';
import gameRoutes from './routes/gameRoutes';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket server
const wss = new WebSocketServer({ server });
new WebSocketHandler(wss);

// API routes
app.use('/api/games', gameRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Flock Together Game Server' });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Start server
server.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`WebSocket server running on ws://localhost:${port}`);
});