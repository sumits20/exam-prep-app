import cors from 'cors';
import 'dotenv/config';
import express from 'express';
import type { NextFunction, Request, Response } from 'express';
import { authRouter } from './routes/auth.js';

class CorsRejectionError extends Error {}

const app = express();
const PORT = process.env.PORT ?? 3001;

// Falls back to local dev; set to the deployed Cloudflare Pages URL in production.
const FRONTEND_URL = process.env.FRONTEND_URL ?? 'http://localhost:5173';

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${Date.now() - start}ms`);
  });
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      // Requests with no Origin header (curl, server-to-server, health checks)
      // aren't subject to browser CORS enforcement, so let them through.
      if (!origin || origin === FRONTEND_URL) {
        callback(null, true);
      } else {
        callback(new CorsRejectionError(`Origin not allowed by CORS: ${origin}`));
      }
    },
  })
);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRouter);

app.use((err: unknown, _req: Request, res: Response, next: NextFunction) => {
  if (err instanceof CorsRejectionError) {
    res.status(403).json({ error: 'Origin not allowed' });
    return;
  }
  next(err);
});

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
