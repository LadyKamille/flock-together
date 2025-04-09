import express from 'express';
import { getAllGames, getGameById } from '../controllers/gameController';

const router = express.Router();

// Get all active games
router.get('/', getAllGames);

// Get a specific game by ID
router.get('/:id', getGameById);

export default router;