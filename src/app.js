import cookieParser from 'cookie-parser';
import express from 'express';
import { config } from './config/env.js';
import { errorHandler } from './middleware/error-handler.js';
import { notFoundHandler } from './middleware/not-found.js';
import { requestId } from './middleware/request-id.js';
import { requestLogger } from './middleware/request-logger.js';
import { requireJson } from './middleware/require-json.js';
import { createAuthRouter } from './routes/auth.routes.js';
import { createUsersRouter } from './routes/users.routes.js';

// Builds the Express app from the objects in the container. Does NOT call listen().
export function createApp(container) {
  const { usersController, authController, authenticate, avatarController, avatarUpload } = container;
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 'loopback');

  // ── 1. App-level middleware (runs top to bottom for EVERY request) ──
  app.use(requestId);
  if (!config.isTest) app.use(requestLogger);
  app.use(requireJson); // JSON for normal requests, multipart/form-data for uploads
  app.use(express.json({ limit: config.bodyLimit }));
  app.use(cookieParser()); // reads the refresh_token httpOnly cookie

  // ── 2. Routes ──
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptimeSec: Math.round(process.uptime()) });
  });
  // Uploaded files on local disk are served as static files (public, cache forever: names never repeat).
  if (container.uploads.driver === 'local') {
    app.use(
      '/uploads',
      express.static(container.uploads.localDir, {
        index: false,
        dotfiles: 'deny',
        immutable: true,
        maxAge: '365d',
        setHeaders: (res) => res.set('X-Content-Type-Options', 'nosniff'), // never let the browser guess the type
      }),
    );
  }
  app.use('/api/v1/auth', createAuthRouter({ authController, authenticate }));
  app.use('/api/v1/users', createUsersRouter({ usersController, avatarController, authenticate, avatarUpload }));

  // ── 3. Fallbacks (must be LAST) ──
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
