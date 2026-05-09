import { Request, Response } from 'express';
import status from 'http-status';
import { catchAsync } from '../../utils/catchAsync.js';
import { sendResponse } from '../../utils/sendResponse.js';
import { UserService } from './user.service.js';
import { Role } from '../../../generated/prisma/client.js';

const getAllUsers = catchAsync(async (req: Request, res: Response) => {
  const query = {
    role: req.query.role as string | undefined,
    search: req.query.search as string | undefined,
    page: Number(req.query.page) || 1,
    limit: Number(req.query.limit) || 10,
  };

  const result = await UserService.getAllUsers(query);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Users retrieved successfully.',
    data: result.data,
    meta: result.meta,
  });
});

const getUserById = catchAsync(async (req: Request, res: Response) => {
  const user = await UserService.getUserById(String(req.params.id));

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'User retrieved successfully.',
    data: user,
  });
});

const updateProfile = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  const user = await UserService.updateProfile(userId, req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Profile updated successfully.',
    data: user,
  });
});

const changePassword = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user!.userId;
  await UserService.changePassword(userId, req.body);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'Password changed successfully.',
  });
});

const deleteUser = catchAsync(async (req: Request, res: Response) => {
  await UserService.deleteUser(String(req.params.id));

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'User deleted successfully.',
  });
});

const updateUserRole = catchAsync(async (req: Request, res: Response) => {
  const { role } = req.body as { role: Role };
  const user = await UserService.updateUserRole(String(req.params.id), role);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'User role updated successfully.',
    data: user,
  });
});

const getUserStats = catchAsync(async (req: Request, res: Response) => {
  const userId = String(req.params.id);
  const stats = await UserService.getUserStats(userId);

  sendResponse(res, {
    statusCode: status.OK,
    success: true,
    message: 'User stats retrieved successfully.',
    data: stats,
  });
});

export const UserController = {
  getAllUsers,
  getUserById,
  updateProfile,
  changePassword,
  deleteUser,
  updateUserRole,
  getUserStats,
};
