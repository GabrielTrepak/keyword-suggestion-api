import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';

import { swaggerSpec } from './config/swagger';
import { apiKeyMiddleware } from './middleware/api-key.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import mainRoutes from './routes/main.routes';

const app = express();

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests',
  },
});

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'SEO Keyword Suggestion API',
  });
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/v1', limiter);
app.use('/api/v1', apiKeyMiddleware);

app.use('/api/v1', mainRoutes);

app.use(errorMiddleware);

export default app;
