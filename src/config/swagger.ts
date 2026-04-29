import swaggerJsdoc from 'swagger-jsdoc';

const serverUrl = process.env.SERVER_URL || 'http://localhost:3000';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'SEO Keyword Suggestion API',
      version: '1.0.0',
      description:
        'A fast SEO keyword suggestion API powered by autocomplete data. Supports multiple queries, country targeting, language targeting, and caching.',
    },
    servers: [
      {
        url: serverUrl,
      },
    ],
  },
  apis: ['./src/routes/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);