param (
    [Parameter(Mandatory=$true)]
    [string]$ApiName
)

Write-Host "Setting up API project: $ApiName" -ForegroundColor Green

npm init -y

npm install express cors dotenv express-rate-limit swagger-ui-express swagger-jsdoc
npm install -D typescript ts-node-dev @types/node @types/express @types/cors @types/swagger-ui-express @types/swagger-jsdoc

mkdir src
mkdir src\config
mkdir src\middleware
mkdir src\routes
mkdir src\services

New-Item src\app.ts
New-Item src\server.ts
New-Item src\config\swagger.ts
New-Item src\middleware\api-key.middleware.ts
New-Item src\middleware\error.middleware.ts
New-Item src\routes\main.routes.ts
New-Item src\services\main.service.ts

@"
PORT=3000
API_KEY=test_123
"@ | Out-File .env -Encoding utf8

@"
PORT=3000
API_KEY=your_api_key_here
"@ | Out-File .env.example -Encoding utf8

@"
node_modules/
dist/
.env
*.log
.DS_Store
Thumbs.db
.vscode/
"@ | Out-File .gitignore -Encoding utf8

@"
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node10",
    "rootDir": "./src",
    "outDir": "./dist",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "ignoreDeprecations": "6.0"
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
"@ | Out-File tsconfig.json -Encoding utf8

node -e "
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
pkg.scripts = {
  dev: 'ts-node-dev --respawn --transpile-only src/server.ts',
  build: 'tsc',
  start: 'node dist/server.js'
};
fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
"

@"
import dotenv from 'dotenv';
import app from './app';

dotenv.config();

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('$ApiName running on port ' + PORT);
});
"@ | Out-File src\server.ts -Encoding utf8

@"
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
    service: '$ApiName',
  });
});

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/v1', limiter);
app.use('/api/v1', apiKeyMiddleware);

app.use('/api/v1', mainRoutes);

app.use(errorMiddleware);

export default app;
"@ | Out-File src\app.ts -Encoding utf8

@"
import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: '$ApiName',
      version: '1.0.0',
      description: 'REST API built with Node.js, TypeScript and Express.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);
"@ | Out-File src\config\swagger.ts -Encoding utf8

@"
import { Request, Response, NextFunction } from 'express';

export function apiKeyMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  const isRapidApiRequest =
    req.header('X-RapidAPI-Host') || req.header('x-rapidapi-host');

  if (isRapidApiRequest) {
    return next();
  }

  const apiKey = req.header('x-api-key');

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      message: 'API key is required',
    });
  }

  if (apiKey !== process.env.API_KEY) {
    return res.status(403).json({
      success: false,
      message: 'Invalid API key',
    });
  }

  next();
}
"@ | Out-File src\middleware\api-key.middleware.ts -Encoding utf8

@"
import { Request, Response, NextFunction } from 'express';

export function errorMiddleware(
  error: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  return res.status(400).json({
    success: false,
    message: error.message || 'Unexpected error',
  });
}
"@ | Out-File src\middleware\error.middleware.ts -Encoding utf8

@"
export function exampleService() {
  return {
    message: 'API is working',
  };
}
"@ | Out-File src\services\main.service.ts -Encoding utf8

@"
import { Router } from 'express';
import { exampleService } from '../services/main.service';

const router = Router();

/**
 * @swagger
 * /example:
 *   get:
 *     summary: Example endpoint
 *     tags: [Example]
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/example', (_req, res) => {
  res.json({
    success: true,
    data: exampleService(),
  });
});

export default router;
"@ | Out-File src\routes\main.routes.ts -Encoding utf8

Write-Host "API project created successfully!" -ForegroundColor Green
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "cd $ApiName"
Write-Host "npm run dev"