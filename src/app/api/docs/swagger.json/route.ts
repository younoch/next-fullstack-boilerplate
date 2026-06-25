// src/app/api/docs/swagger.json/route.ts
import { NextResponse } from "next/server";
import swaggerJSDoc from "swagger-jsdoc";

const options: swaggerJSDoc.Options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Pacutax Async Engine - Enterprise API Docs",
      version: "1.0.0",
      description: "Modular Monolith Multi-Country Tax Processing Core Layout",
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Local Docker Development Server",
      },
    ],
    components: {
      schemas: {
        TaxTask: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              example: 'task_12345',
            },
            status: {
              type: 'string',
              example: 'PENDING',
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              example: '2026-06-25T12:00:00Z',
            },
          },
          required: ['id', 'status', 'createdAt'],
        },
      },
    },
  },
  // Ensure it scans your new modular monolith modules folder cleanly
  apis: ["src/app/api/**/*.ts", "src/modules/**/*.ts"],
};

const spec = swaggerJSDoc(options);

// Adding 'request: Request' ensures Next.js treats this dynamically and matches signature strictness
export async function GET(request: Request) {
  return NextResponse.json(spec);
}