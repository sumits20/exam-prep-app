import express from 'express';
import { authRouter } from './routes/auth.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/auth', authRouter);

app.listen(PORT, () => {
  console.log(`Backend listening on port ${PORT}`);
});
