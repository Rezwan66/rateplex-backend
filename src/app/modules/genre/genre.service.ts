import status from 'http-status';
import { prisma } from '../../config/prisma.js';
import AppError from '../../utils/AppError.js';

const getAllGenres = async () => {
  const genres = await prisma.genre.findMany({
    orderBy: { name: 'asc' },
    include: {
      _count: {
        select: { media: true },
      },
    },
  });

  return genres;
};

const createGenre = async (name: string) => {
  if (!name || name.trim().length === 0) {
    throw new AppError(status.BAD_REQUEST, 'Genre name is required.');
  }

  const existing = await prisma.genre.findUnique({
    where: { name: name.trim() },
  });

  if (existing) {
    throw new AppError(status.CONFLICT, 'Genre already exists.');
  }

  const genre = await prisma.genre.create({
    data: { name: name.trim() },
  });

  return genre;
};

const deleteGenre = async (id: string) => {
  const genre = await prisma.genre.findUnique({
    where: { id },
  });

  if (!genre) {
    throw new AppError(status.NOT_FOUND, 'Genre not found.');
  }

  await prisma.genre.delete({
    where: { id },
  });
};

export const GenreService = {
  getAllGenres,
  createGenre,
  deleteGenre,
};
