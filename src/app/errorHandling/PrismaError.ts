import status from 'http-status';

type PrismaError = {
  code?: string;
  message?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const isPrismaError = (error: any) => {
  return (
    error &&
    typeof error === 'object' &&
    typeof error.code === 'string' &&
    error.code.startsWith('P')
  );
};

export const handlePrismaError = (error: PrismaError) => {
  //   console.log('prisma error-->', error);
  if (error.code === 'P2002') {
    return {
      statusCode: status.CONFLICT,
      message: 'Unique constraint failed: duplicate value found.',
    };
  }
  if (error.code === 'P2025') {
    return {
      statusCode: status.NOT_FOUND,
      message: 'Record not found.',
    };
  }
  return {
    statusCode: status.INTERNAL_SERVER_ERROR,
    message: 'Database error occurred.',
  };
};
