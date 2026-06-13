import swaggerJsdoc from 'swagger-jsdoc';

import { ENV } from '@/shared/constants';

const swaggerOptions: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Supply Chain Traceability API',
      version: '0.1.0',
      description:
        'REST API for the Traceability Platform — farms, actors, supply chains, and lifecycle events.',
    },
    servers: [
      {
        url: `http://localhost:${ENV.PORT}`,
        description: 'Development server',
      },
      {
        url: `http://localhost:${ENV.PORT}/api/${ENV.API_VERSION}`,
        description: 'Versioned API base path',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    tags: [
      { name: 'Health', description: 'Service health checks' },
      { name: 'Auth', description: 'Authentication endpoints' },
    ],
  },
  apis: ['./src/modules/**/*.routes.ts', './src/modules/**/*.controller.ts'],
};

/** OpenAPI specification generated from JSDoc annotations. */
export const swaggerSpec = swaggerJsdoc(swaggerOptions);
