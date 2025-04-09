import express, { Router, IRouter } from 'express';
import { getAllGames, getGameById } from '../controllers/gameController';

// Using the IRouter interface is more specific and correct for Express 5
const router: IRouter = express.Router();

// Get all active games
router.get('/', getAllGames);

// Get a specific game by ID
router.get('/:id', getGameById);

export default router;