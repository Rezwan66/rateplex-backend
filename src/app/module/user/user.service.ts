import AppError from '../../errorHandling/AppError';
import { prisma } from '../../lib/prisma';
import { ICreateUserPayload } from './user.interface';

const createUser = async (payload: ICreateUserPayload) => {
  const userExists = await prisma.user.findUnique({
    where: { email: payload.email },
  });
  if (userExists) {
    // throw new Error('User already exists');
    throw new AppError(409, 'User already exists');
  }
  const result = await prisma.user.create({
    data: payload,
  });
  return result;
};

export const UserService = {
  createUser,
};
