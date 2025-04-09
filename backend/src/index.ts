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

// Initialize WebSocket server with explicit server and path
const wss = new WebSocketServer({ 
  server,
  path: '/',
  perMessageDeflate: {
    zlibDeflateOptions: {
      // See zlib defaults.
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    // Other options settable:
    clientNoContextTakeover: true, // Defaults to negotiated value.
    serverNoContextTakeover: true, // Defaults to negotiated value.
    serverMaxWindowBits: 10, // Defaults to negotiated value.
    // Below options specified as default values.
    concurrencyLimit: 10, // Limits zlib concurrency for perf.
    threshold: 1024 // Size (in bytes) below which messages
    // should not be compressed if context takeover is disabled.
  }
});

// Create WebSocket handler
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
server.listen(Number(port), () => {
  console.log(`Server running on port ${port}`);
  console.log(`WebSocket server running on ws://localhost:${port}`);
  console.log(`CORS is configured to allow all origins`);
  
  // Print basic routes info without using internal properties
  console.log('Active HTTP endpoints:');
  console.log('GET\t/');
  console.log('GET\t/health');
  console.log('*\t/api/games/*');
});