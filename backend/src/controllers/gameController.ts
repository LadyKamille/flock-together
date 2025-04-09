import { Request, Response, NextFunction } from 'express';
import gameService from '../services/GameService';

export const getAllGames = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const games = gameService.getAllGames();
    res.json(games);
  } catch (error) {
    console.error('Error getting all games:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getGameById = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const gameId = req.params.id;
    const game = gameService.getGameState(gameId);
    
    if (!game) {
      res.status(404).json({ error: 'Game not found' });
      return;
    }
    
    res.json(game);
  } catch (error) {
    console.error('Error getting game by id:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};