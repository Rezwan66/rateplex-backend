import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { GenreService } from './genre.service.js';

const getAllGenres = catchAsync(async (_req: Request, res: Response) => {
  const genres = await GenreService.getAllGenres();

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Genres retrieved successfully.',
    data: genres,
  });
});

const createGenre = catchAsync(async (req: Request, res: Response) => {
  const { name } = req.body as { name: string };
  const genre = await GenreService.createGenre(name);

  sendResponse(res, {
    statusCode: status.CREATED,
    success: true,
    message: 'Genre created successfully.',
    data: genre,
  });
});

const deleteGenre = catchAsync(async (req: Request, res: Response) => {
  await GenreService.deleteGenre(String(req.params.id));

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Genre deleted successfully.',
  });
});

export const GenreController = {
  getAllGenres,
  createGenre,
  deleteGenre,
};
