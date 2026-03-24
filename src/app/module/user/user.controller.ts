import { Request, Response } from 'express';
import { catchAsync } from '../../helpers/catchAsync';
import { sendResponse } from '../../helpers/sendResponse';
import status from 'http-status';
import { UserService } from './user.service';

const createUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await UserService.createUser(payload);

  sendResponse(res, {
    httpStatusCode: status.CREATED,
    success: true,
    message: 'User created successfully',
    data: result,
  });
});

const loginUser = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await UserService.loginUser(payload);

  sendResponse(res, {
    httpStatusCode: status.OK,
    success: true,
    message: 'User logged in successfully',
    data: result,
  });
});

export const UserController = { createUser, loginUser };
