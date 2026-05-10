// Vercel serverless entry point — export app, do NOT call app.listen()
// Vercel wraps this with its own HTTP server per invocation
import app from '../src/app.js';

export default app;
