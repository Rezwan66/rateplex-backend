import express, { Application, Request, Response } from 'express';
import app from './app';

const bootstrap = async () => {
  try {
    // await seedSuperAdmin();
    app.listen(5000, () => {
      console.log(`Server is running on http://localhost:${5000}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

bootstrap();
