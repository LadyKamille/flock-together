import { Request, Response } from 'express';
import gameService from '../services/GameService';

export const getAllGames = (req: Request, res: Response) => {
  try {
    const games = gameService.getAllGames();
    res.json(games);
  } catch (error) {
    console.error('Error getting all games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getGameById = (req: Request, res: Response) => {
  try {
    const gameId = req.params.id;
    const game = gameService.getGameState(gameId);
    
    if (!game) {
      return res.status(404).json({ error: 'Game not found' });
    }
    
    res.json(game);
  } catch (error) {
    console.error('Error getting game by id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};