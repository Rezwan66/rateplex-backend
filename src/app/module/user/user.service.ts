import status from 'http-status';
import AppError from '../../errorHandling/AppError';
import { prisma } from '../../lib/prisma';
import { ICreateUserPayload, ILoginUserPayload } from './user.interface';
import bcrypt from 'bcrypt';

const createUser = async (payload: ICreateUserPayload) => {
  const userExists = await prisma.user.findUnique({
    where: { email: payload.email },
  });
  if (userExists) {
    // throw new Error('User already exists');
    throw new AppError(409, 'User already exists');
  }

  const hashedPassword = await bcrypt.hash(payload.password, 10);

  const result = await prisma.user.create({
    data: { ...payload, password: hashedPassword },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  // delete result.password;

  return result;
};

const loginUser = async (payload: ILoginUserPayload) => {
  const userExists = await prisma.user.findUnique({
    where: { email: payload.email },
  });
  if (!userExists) {
    throw new AppError(status.NOT_FOUND, 'User not found!');
  }

  if (!payload.password || !userExists.password) {
    throw new AppError(status.BAD_REQUEST, 'Password is required!');
  }

  const isPasswordMatched = await bcrypt.compare(payload.password, userExists.password);

  if (!isPasswordMatched) {
    throw new AppError(status.UNAUTHORIZED, 'Password incorrect!');
  }

  //TODO: create access and refresh tokens

  return { isPasswordMatched };
};

export const UserService = {
  createUser,
  loginUser,
};
